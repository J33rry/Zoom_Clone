"""Database engine, session factory and the declarative base."""
from collections.abc import Generator

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

def _connect_args() -> dict:
    if settings.is_remote_libsql:
        return {"auth_token": settings.database_auth_token}
    # SQLite connections are used across FastAPI's threadpool.
    if settings.database_url.startswith("sqlite:"):
        return {"check_same_thread": False}
    return {}


engine = create_engine(settings.sqlalchemy_url, connect_args=_connect_args(), pool_pre_ping=settings.is_remote_libsql)


@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
    """SQLite ignores FOREIGN KEY constraints unless this pragma is on."""
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
    except Exception:
        # A remote Turso database already enforces foreign keys and may reject the pragma.
        pass
    finally:
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Columns added after the first release: (table, column, DDL). create_all() only creates
# missing tables, so existing SQLite files get these via ALTER TABLE on startup.
_ADDED_COLUMNS = [
    (
        "chat_messages",
        "recipient_id",
        "VARCHAR(36) REFERENCES meeting_participants(id) ON DELETE CASCADE",
    ),
]


def migrate_schema() -> None:
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table, column, ddl in _ADDED_COLUMNS:
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            if column not in existing:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
