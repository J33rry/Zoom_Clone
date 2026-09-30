"""Time-zone helpers: the curated list shown in the Schedule form, plus Zoom-style labels."""
from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# (IANA zone, the short label Zoom shows next to the GMT offset)
_TIMEZONES: list[tuple[str, str]] = [
    ("Pacific/Honolulu", "Hawaii"),
    ("America/Anchorage", "Alaska"),
    ("America/Los_Angeles", "Pacific Time (US and Canada)"),
    ("America/Denver", "Mountain Time (US and Canada)"),
    ("America/Chicago", "Central Time (US and Canada)"),
    ("America/New_York", "Eastern Time (US and Canada)"),
    ("America/Sao_Paulo", "Sao Paulo"),
    ("UTC", "Universal Time UTC"),
    ("Europe/London", "London"),
    ("Europe/Paris", "Paris"),
    ("Europe/Berlin", "Berlin"),
    ("Africa/Cairo", "Cairo"),
    ("Europe/Moscow", "Moscow"),
    ("Asia/Dubai", "Dubai"),
    ("Asia/Karachi", "Islamabad, Karachi"),
    ("Asia/Kolkata", "India"),
    ("Asia/Kathmandu", "Kathmandu"),
    ("Asia/Dhaka", "Dhaka"),
    ("Asia/Bangkok", "Bangkok"),
    ("Asia/Singapore", "Singapore"),
    ("Asia/Shanghai", "Beijing, Shanghai"),
    ("Asia/Tokyo", "Tokyo"),
    ("Australia/Sydney", "Sydney"),
    ("Pacific/Auckland", "Auckland"),
]
_LABELS = dict(_TIMEZONES)


def is_valid_timezone(zone: str) -> bool:
    try:
        ZoneInfo(zone)
    except (ZoneInfoNotFoundError, ValueError):
        return False
    return True


def zone_label(zone: str) -> str:
    """Short name used in invitations, e.g. "India" for Asia/Kolkata."""
    return _LABELS.get(zone, zone)


def _gmt_offset(zone: str) -> str:
    offset = datetime.now(UTC).astimezone(ZoneInfo(zone)).utcoffset()
    total_minutes = int(offset.total_seconds() // 60) if offset else 0
    sign = "+" if total_minutes >= 0 else "-"
    hours, minutes = divmod(abs(total_minutes), 60)
    return f"GMT{sign}{hours}:{minutes:02d}"


def timezone_options() -> list[dict[str, str]]:
    """Options for the Time Zone select, e.g. {"id": "Asia/Kolkata", "label": "(GMT+5:30) India"}."""
    return [{"id": zone, "label": f"({_gmt_offset(zone)}) {label}"} for zone, label in _TIMEZONES]
