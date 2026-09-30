from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User
from app.realtime.room_manager import room_manager
from app.schemas.common import to_naive_utc
from app.schemas.meeting import (
    InstantMeetingCreate,
    JoinRequest,
    JoinResponse,
    MeetingAttendee,
    MeetingCreate,
    MeetingLookup,
    MeetingOut,
    MeetingUpdate,
)
from app.schemas.serializers import meeting_lookup, meeting_out
from app.services import meeting_service, participant_service

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=list[MeetingOut])
def list_meetings(
    start: datetime = Query(alias="from", description="Range start (ISO-8601)"),
    end: datetime = Query(alias="to", description="Range end, exclusive (ISO-8601)"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    meetings = meeting_service.list_meetings_between(db, user, to_naive_utc(start), to_naive_utc(end))
    return [meeting_out(m) for m in meetings]


@router.get("/upcoming", response_model=list[MeetingOut])
def upcoming_meetings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [meeting_out(m) for m in meeting_service.list_upcoming(db, user)]


@router.get("/recent", response_model=list[MeetingOut])
def recent_meetings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [meeting_out(m) for m in meeting_service.list_recent(db, user)]


@router.post("/instant", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    payload: InstantMeetingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    meeting = meeting_service.create_instant_meeting(
        db, user, use_pmi=payload.use_pmi, video_on=payload.video_on
    )
    return meeting_out(meeting)


@router.post("", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def schedule_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return meeting_out(meeting_service.schedule_meeting(db, user, payload))


@router.get("/code/{code}", response_model=MeetingLookup)
def lookup_meeting(code: str, db: Session = Depends(get_db)):
    """Validate a Meeting ID before the join screen asks for a display name."""
    meeting = meeting_service.resolve_code(db, code)
    meeting_service.ensure_joinable(meeting)
    return meeting_lookup(meeting)


@router.post("/code/{code}/join", response_model=JoinResponse)
def join_meeting(
    code: str,
    payload: JoinRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    meeting = meeting_service.resolve_code(db, code)
    locked = room_manager.settings(meeting.id).locked
    participant = participant_service.join_meeting(db, meeting, payload, user, locked=locked)
    return JoinResponse(participant_id=participant.id, role=participant.role, meeting=meeting_out(meeting))


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    return meeting_out(meeting_service.get_meeting(db, meeting_id))


@router.get("/{meeting_id}/participants", response_model=list[MeetingAttendee])
def meeting_participants(meeting_id: int, db: Session = Depends(get_db)):
    meeting = meeting_service.get_meeting(db, meeting_id)
    return [
        MeetingAttendee(
            name=p.display_name,
            avatar_color=p.avatar_color,
            role=p.role,
            is_guest=p.user_id is None,
            in_meeting=present,
        )
        for p, present in participant_service.attendees(db, meeting)
    ]


@router.put("/{meeting_id}", response_model=MeetingOut)
def update_meeting(
    meeting_id: int,
    payload: MeetingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    meeting = meeting_service.get_owned_meeting(db, meeting_id, user)
    return meeting_out(meeting_service.update_meeting(db, meeting, payload))


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    meeting = meeting_service.get_owned_meeting(db, meeting_id, user)
    meeting_service.delete_meeting(db, meeting)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{meeting_id}/end", response_model=MeetingOut)
async def end_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    meeting = meeting_service.get_owned_meeting(db, meeting_id, user)
    participant_service.end_meeting(db, meeting)
    await room_manager.close_room(meeting.id, reason="meeting-ended")
    return meeting_out(meeting)
