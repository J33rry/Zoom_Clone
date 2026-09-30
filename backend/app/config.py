"""Application settings, loaded from environment variables (or a .env file)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # A local SQLite file, or a Turso database: the `libsql://<db>.turso.io` URL from the Turso dashboard.
    database_url: str = "sqlite:///./zoom_clone.db"
    # Turso database auth token (secret). Only used for remote libsql URLs.
    database_auth_token: str = ""
    # Public URL of the Next.js app; used to build shareable invite links.
    frontend_url: str = "http://localhost:3000"
    # Comma-separated list of allowed CORS origins.
    cors_origins: str = "http://localhost:3000"
    # Seed the database with sample data on startup when it is empty.
    seed_on_startup: bool = True
    # A live meeting ends this many seconds after its last participant disconnects,
    # so a page refresh or network blip does not kill the meeting.
    empty_room_grace_seconds: float = 30

    @property
    def sqlalchemy_url(self) -> str:
        """`libsql://x.turso.io` (as Turso prints it) as a URL for the sqlalchemy-libsql dialect."""
        url = self.database_url
        if url.startswith("libsql://"):
            url = "sqlite+libsql://" + url.removeprefix("libsql://")
        if self.is_remote_libsql and "secure=" not in url:
            url += ("&" if "?" in url else "?") + "secure=true"
        return url

    @property
    def is_remote_libsql(self) -> bool:
        """True for a hosted Turso URL (has a host); a `sqlite+libsql:///file.db` URL is local."""
        scheme, _, rest = self.database_url.partition("://")
        return scheme in ("libsql", "sqlite+libsql") and not rest.startswith("/")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
