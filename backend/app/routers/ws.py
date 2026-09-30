"""WebSocket endpoint: signalling for the WebRTC mesh plus live room events.

Server → client message types:
  waiting          {}                        you are in the waiting room
  room-state       {self, peers, chat, settings, waiting?}   on entering the meeting
  room-settings    {settings}                Host tools changed
  waiting-list     {peers}                   (hosts) who is in the waiting room
  peer-joined      {peer}
  peer-updated     {peer}
  peer-left        {peer_id}
  signal           {from, data}
  chat             {message}
  reaction         {from, name, emoji}
  force-mute       {reason}
  force-video-off  {reason}
  force-share-off  {reason}
  removed          {}
  meeting-ended    {}
  error            {message}
"""
import asyncio
import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketDisconnected

from app.config import get_settings
from app.db import SessionLocal
from app.models import MeetingParticipant, MeetingStatus
from app.realtime.handlers import dispatch, enter_room, notify_waiting_list
from app.realtime.room_manager import Peer, RoomSettings, room_manager
from app.services import meeting_service, participant_service
from app.services.errors import NotFoundError

router = APIRouter()

# Strong references so pending grace-period tasks are not garbage-collected.
_background_tasks: set[asyncio.Task] = set()


def _load_session(meeting_id: int, participant_id: str) -> tuple[MeetingParticipant, str, bool]:
    with SessionLocal() as db:
        participant = participant_service.resume_session(db, participant_id, meeting_id)
        color = participant.avatar_color
        return participant, color, participant.meeting.waiting_room_enabled


async def _end_if_still_empty(meeting_id: int) -> None:
    """End a live meeting once nobody has come back within the grace period."""
    await asyncio.sleep(get_settings().empty_room_grace_seconds)
    if not room_manager.is_empty(meeting_id):
        return
    with SessionLocal() as db:
        meeting = meeting_service.get_meeting(db, meeting_id)
        if meeting.status == MeetingStatus.LIVE:
            participant_service.end_meeting(db, meeting)
    # Anyone still in the waiting room learns the meeting is over.
    await room_manager.close_room(meeting_id, reason="meeting-ended")


def _handle_departure(meeting_id: int, peer_id: str) -> None:
    with SessionLocal() as db:
        participant_service.mark_left(db, peer_id)
    if room_manager.is_empty(meeting_id):
        task = asyncio.create_task(_end_if_still_empty(meeting_id))
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_socket(websocket: WebSocket, meeting_id: int, pid: str = Query(...)) -> None:
    try:
        participant, color, waiting_room_default = _load_session(meeting_id, pid)
    except NotFoundError:
        await websocket.close(code=4404)
        return

    await websocket.accept()
    peer = Peer(
        id=participant.id,
        name=participant.display_name,
        role=participant.role.value,
        avatar_color=color,
        audio_muted=participant.is_audio_muted,
        video_on=participant.is_video_on,
        websocket=websocket,
        is_guest=participant.user_id is None,
    )
    # The scheduled "Waiting Room" option seeds the live Host tools toggle.
    room = room_manager.ensure_room(meeting_id, RoomSettings(waiting_room=waiting_room_default))
    if not peer.is_host and room.settings.waiting_room and not room_manager.is_admitted(meeting_id, peer.id):
        await room_manager.add_waiting(meeting_id, peer)
        await peer.send({"type": "waiting"})
        await notify_waiting_list(meeting_id)
    else:
        await enter_room(meeting_id, peer)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if isinstance(message, dict):
                await dispatch(meeting_id, peer, message)
    except (WebSocketDisconnect, WebSocketDisconnected):
        # WebSocketDisconnected: the server closed this socket (host removed us / ended the room).
        pass
    finally:
        # None when the host already removed this peer or ended the room.
        where = await room_manager.remove(meeting_id, peer)
        if where == "meeting":
            _handle_departure(meeting_id, peer.id)
            await room_manager.broadcast(meeting_id, {"type": "peer-left", "peer_id": peer.id})
        elif where == "waiting":
            with SessionLocal() as db:
                participant_service.mark_left(db, peer.id)
            await notify_waiting_list(meeting_id)
