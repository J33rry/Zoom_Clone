from datetime import UTC, datetime
from typing import Annotated

from pydantic import PlainSerializer


def to_utc_iso(value: datetime) -> str:
    """Datetimes are stored as naive UTC; expose them as ISO-8601 with a trailing Z."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


UTCDateTime = Annotated[datetime, PlainSerializer(to_utc_iso, return_type=str)]


def to_naive_utc(value: datetime) -> datetime:
    """Normalise incoming datetimes: aware → UTC; naive values are assumed to already be UTC."""
    if value.tzinfo is not None:
        value = value.astimezone(UTC)
    return value.replace(tzinfo=None)
