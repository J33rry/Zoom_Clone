"""Sample data: the default signed-in user, upcoming meetings and a meeting history.

Run manually with `python -m app.seed` (add `--reset` to wipe first). The app also
calls seed_if_empty() on startup so a fresh deployment is never blank.
"""
import sys
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.db import Base, SessionLocal, engine
from app.models import (
    ChatMessage,
    Meeting,
    MeetingParticipant,
    MeetingStatus,
    MeetingType,
    ParticipantRole,
    User,
)
from app.services.id_generator import generate_passcode

DEFAULT_TZ = "Asia/Kolkata"
UTC = ZoneInfo("UTC")

# (days from today, local start time, duration minutes, topic, description)
UPCOMING = [
    (0, None, 30, "Daily Standup", "Quick sync on yesterday's progress and today's blockers."),
    (1, time(10, 30), 60, "Sprint Planning", "Plan the scope for Sprint 42."),
    (1, time(20, 30), 40, "My Meeting", None),
    (2, time(11, 0), 30, "1:1 with Priya", "Weekly check-in."),
    (3, time(17, 0), 45, "Client Demo — Acme Corp", "Walkthrough of the new scheduling flow."),
    (5, time(9, 30), 60, "Architecture Review", "Discuss the realtime signalling design."),
]

# (days ago, local start time, duration, topic, meeting type, guest names)
HISTORY = [
    (1, time(16, 0), 45, "Team Retro", MeetingType.SCHEDULED, ["Priya Sharma", "Alex Chen", "Maria Garcia"]),
    (2, time(12, 0), 30, "Product Sync", MeetingType.SCHEDULED, ["Sam Wilson", "Alex Chen"]),
    (3, time(18, 15), 20, "Jerry NotAbout's Zoom Meeting", MeetingType.INSTANT, ["Priya Sharma"]),
    (4, time(15, 0), 60, "Interview: Frontend Engineer", MeetingType.SCHEDULED, ["Jordan Lee"]),
]


def _to_utc(local_date, local_time: time, tz: str) -> datetime:
    return datetime.combine(local_date, local_time, ZoneInfo(tz)).astimezone(UTC).replace(tzinfo=None)


def _next_half_hour(now_local: datetime, hours_ahead: int = 2) -> time:
    target = now_local + timedelta(hours=hours_ahead)
    minute = 0 if target.minute < 30 else 30
    return min(target.replace(minute=minute, second=0, microsecond=0).time(), time(23, 30))


def seed(db: Session) -> None:
    user = User(
        name="Jerry NotAbout",
        email="jerry@example.com",
        avatar_color="#6E1E9A",
        personal_meeting_id="3206313470",
        timezone=DEFAULT_TZ,
    )
    db.add(user)
    db.flush()

    now_local = datetime.now(ZoneInfo(DEFAULT_TZ))
    today = now_local.date()
    code_seq = iter(range(81360004521, 81360004521 + 10_000_000, 104_729))

    for days, start, duration, topic, description in UPCOMING:
        local_time = start or _next_half_hour(now_local)
        db.add(
            Meeting(
                meeting_code=str(next(code_seq)),
                host=user,
                topic=topic,
                description=description,
                meeting_type=MeetingType.SCHEDULED,
                start_time=_to_utc(today + timedelta(days=days), local_time, DEFAULT_TZ),
                duration_minutes=duration,
                timezone=DEFAULT_TZ,
                passcode=generate_passcode(),
                status=MeetingStatus.SCHEDULED,
            )
        )

    for days_ago, start, duration, topic, meeting_type, guests in HISTORY:
        start_utc = _to_utc(today - timedelta(days=days_ago), start, DEFAULT_TZ)
        end_utc = start_utc + timedelta(minutes=duration)
        meeting = Meeting(
            meeting_code=str(next(code_seq)),
            host=user,
            topic=topic,
            meeting_type=meeting_type,
            start_time=start_utc,
            duration_minutes=duration,
            timezone=DEFAULT_TZ,
            passcode=generate_passcode(),
            status=MeetingStatus.ENDED,
            started_at=start_utc,
            ended_at=end_utc,
        )
        host_session = MeetingParticipant(
            meeting=meeting,
            user=user,
            display_name=user.name,
            role=ParticipantRole.HOST,
            joined_at=start_utc,
            left_at=end_utc,
        )
        db.add_all([meeting, host_session])
        for offset, guest in enumerate(guests, start=1):
            db.add(
                MeetingParticipant(
                    meeting=meeting,
                    display_name=guest,
                    joined_at=start_utc + timedelta(minutes=offset),
                    left_at=end_utc,
                )
            )
        db.add(ChatMessage(meeting=meeting, participant=host_session, body="Thanks everyone for joining!",
                           created_at=start_utc + timedelta(minutes=2)))

    db.commit()


def seed_if_empty(db: Session) -> bool:
    if db.scalar(select(User.id).limit(1)) is not None:
        return False
    seed(db)
    return True


if __name__ == "__main__":
    if "--reset" in sys.argv:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        print("Seeded sample data." if seed_if_empty(session) else "Database already has data; skipped.")
