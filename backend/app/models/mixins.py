from datetime import UTC, datetime


def utcnow() -> datetime:
    """Naive UTC timestamp; every datetime column in the database is stored as UTC."""
    return datetime.now(UTC).replace(tzinfo=None)
