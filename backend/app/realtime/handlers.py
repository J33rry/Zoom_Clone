"""Room entry plus handlers for messages a connected peer sends over the meeting WebSocket.

Client → server message types:
  signal           {to, data}                  WebRTC offer/answer/ICE relayed to one peer
  media-state      {audio_muted, video_on, sharing}
  chat             {body, to?}                to = participant id for a direct message
  reaction         {emoji}
  rename           {name, target?}             target (someone else) is host only
  host only:
  mute             {target}
  mute-all         {}
  remove           {target}
  admit / deny     {target}                    waiting room
  admit-all        {}
  update-settings  {settings: {...}}           Host tools toggles (see RoomSettings)
  suspend          {}                          "Suspend Participant Activities"
  end-meeting      {}

Everything a participant may or may not do is checked here, server-side; the UI only mirrors it.
"""
from collections.abc import Awaitable, Callable
from typing import Any

from sqlalchemy import or_, select

from app.db import SessionLocal
from app.models import ChatMessage
from app.realtime.room_manager import Peer, RoomSettings, room_manager
from app.schemas.common import to_utc_iso
from app.services import meeting_service, participant_service
from app.services.errors import DomainError

ALLOWED_REACTIONS = {"👏", "👍", "❤️", "😂", "😮", "🎉"}
MAX_CHAT_LENGTH = 2000
MAX_NAME_LENGTH = 120
CHAT_HISTORY_LIMIT = 200

Handler = Callable[[int, Peer, dict[str, Any]], Awaitable[None]]


def serialize_chat(message: ChatMessage, name: str, recipient_name: str | None = None) -> dict[str, Any]:
    return {
        "id": message.id,
        "participant_id": message.participant_id,
        "name": name,
        "body": message.body,
        "created_at": to_utc_iso(message.created_at),
        # None = Meeting Group Chat; otherwise a direct message.
        "to": {"id": message.recipient_id, "name": recipient_name} if message.recipient_id else None,
    }


def load_chat_history(meeting_id: int, viewer_id: str) -> list[dict[str, Any]]:
    """Group messages plus the direct messages this participant sent or received."""
    with SessionLocal() as db:
        messages = db.scalars(
            select(ChatMessage)
            .where(
                ChatMessage.meeting_id == meeting_id,
                or_(
                    ChatMessage.recipient_id.is_(None),
                    ChatMessage.recipient_id == viewer_id,
                    ChatMessage.participant_id == viewer_id,
                ),
            )
            .order_by(ChatMessage.created_at)
            .limit(CHAT_HISTORY_LIMIT)
        ).all()
        return [
            serialize_chat(m, m.participant.display_name, m.recipient.display_name if m.recipient else None)
            for m in messages
        ]


def _settings(meeting_id: int) -> RoomSettings:
    return room_manager.settings(meeting_id)


async def _error(peer: Peer, message: str) -> None:
    await peer.send({"type": "error", "message": message})


async def _broadcast_peer(meeting_id: int, peer: Peer) -> None:
    await room_manager.broadcast(meeting_id, {"type": "peer-updated", "peer": peer.public()})


# ---------------------------------------------------------------- entering the room


async def notify_waiting_list(meeting_id: int) -> None:
    await room_manager.send_hosts(
        meeting_id, {"type": "waiting-list", "peers": [p.public() for p in room_manager.waiting(meeting_id)]}
    )


async def enter_room(meeting_id: int, peer: Peer) -> None:
    """Bring a peer into the meeting: apply host restrictions, send room-state, announce it."""
    settings = _settings(meeting_id)
    if not peer.is_host:
        # Restrictions apply from the first frame; the client's media-state gets corrected too.
        if not settings.allow_video:
            peer.video_on = False
        if not settings.allow_unmute:
            peer.audio_muted = True
        if not settings.allow_share:
            peer.sharing = False

    others = await room_manager.add(meeting_id, peer)
    state: dict[str, Any] = {
        "type": "room-state",
        "self": peer.public(),
        "peers": [p.public() for p in others],
        "chat": load_chat_history(meeting_id, peer.id),
        "settings": settings.public(),
    }
    if peer.is_host:
        state["waiting"] = [p.public() for p in room_manager.waiting(meeting_id)]
    await peer.send(state)
    await room_manager.broadcast(meeting_id, {"type": "peer-joined", "peer": peer.public()}, exclude=peer.id)


# ---------------------------------------------------------------- participant actions


async def _signal(meeting_id: int, peer: Peer, msg: dict[str, Any]) -> None:
    target = msg.get("to")
    if isinstance(target, str) and target != peer.id:
        await room_manager.send_to(meeting_id, target, {"type": "signal", "from": peer.id, "data": msg.get("data")})


async def _media_state(meeting_id: int, peer: Peer, msg: dict[str, Any]) -> None:
    settings = _settings(meeting_id)
    wants_muted = bool(msg.get("audio_muted", peer.audio_muted))
    wants_video = bool(msg.get("video_on", peer.video_on))
    wants_share = bool(msg.get("sharing", peer.sharing))

    if not peer.is_host:
        if not wants_muted and peer.audio_muted and not settings.allow_unmute:
            wants_muted = True
            await peer.send({"type": "force-mute", "reason": "The host has disabled unmuting."})
        if wants_video and not peer.video_on and not settings.allow_video:
            wants_video = False
            await peer.send({"type": "force-video-off", "reason": "The host has disabled participant video."})
    if wants_share and not peer.sharing:
        wants_share = await _may_start_share(meeting_id, peer, settings)

    peer.audio_muted, peer.video_on, peer.sharing = wants_muted, wants_video, wants_share
    with SessionLocal() as db:
        participant_service.set_media_state(db, peer.id, audio_muted=peer.audio_muted, video_on=peer.video_on)
    await _broadcast_peer(meeting_id, peer)


async def _may_start_share(meeting_id: int, peer: Peer, settings: RoomSettings) -> bool:
    """Apply the Share settings to someone starting a screen share; may take over another share."""
    reject = None
    if not peer.is_host and not settings.allow_share:
        reject = "The host has disabled screen sharing."
    elif settings.share_mode == "single":
        current = [p for p in room_manager.peers(meeting_id) if p.sharing and p.id != peer.id]
        if current and not peer.is_host and settings.share_takeover == "host":
            reject = "You cannot start sharing while another participant is sharing."
        elif current:
            await _stop_share(meeting_id, current, f"{peer.name} started sharing.")
    if reject:
        await peer.send({"type": "force-share-off", "reason": reject})
        return False
    return True


async def _chat(meeting_id: int, peer: Peer, msg: dict[str, Any]) -> None:
    if not peer.is_host and not _settings(meeting_id).allow_chat:
        return await _error(peer, "The host has disabled chat.")
    body = str(msg.get("body", "")).strip()[:MAX_CHAT_LENGTH]
    if not body:
        return
    recipient = None
    if msg.get("to"):
        recipient = room_manager.get(meeting_id, str(msg["to"]))
        if recipient is None or recipient.id == peer.id:
            return await _error(peer, "That participant is no longer in the meeting.")
    with SessionLocal() as db:
        message = ChatMessage(
            meeting_id=meeting_id, participant_id=peer.id, recipient_id=recipient.id if recipient else None, body=body
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        payload = serialize_chat(message, peer.name, recipient.name if recipient else None)
    event = {"type": "chat", "message": payload}
    if recipient is None:
        await room_manager.broadcast(meeting_id, event)
    else:
        # Direct message: only the two people in the conversation see it.
        await peer.send(event)
        await recipient.send(event)


async def _reaction(meeting_id: int, peer: Peer, msg: dict[str, Any]) -> None:
    emoji = msg.get("emoji")
    if emoji in ALLOWED_REACTIONS:
        await room_manager.broadcast(meeting_id, {"type": "reaction", "from": peer.id, "name": peer.name, "emoji": emoji})


async def _rename(meeting_id: int, peer: Peer, msg: dict[str, Any]) -> None:
    name = str(msg.get("name", "")).strip()[:MAX_NAME_LENGTH]
    if not name:
        return await _error(peer, "Name cannot be empty.")
    target_id = str(msg.get("target") or peer.id)
    if target_id != peer.id and not peer.is_host:
        return await _error(peer, "Only the host can rename other participants.")
    if target_id == peer.id and not peer.is_host and not _settings(meeting_id).allow_rename:
        return await _error(peer, "The host has disabled renaming.")
    target = room_manager.get(meeting_id, target_id)
    if target is None:
        return
    with SessionLocal() as db:
        participant_service.rename_participant(db, target.id, name)
    target.name = name
    await _broadcast_peer(meeting_id, target)


# ---------------------------------------------------------------- host tools


async def _force_mute(meeting_id: int, targets: list[Peer], reason: str) -> None:
    targets = [t for t in targets if not t.audio_muted]
    with SessionLocal() as db:
        participant_service.mute_participants(db, meeting_id, [t.id for t in targets])
    for target in targets:
        target.audio_muted = True
        await target.send({"type": "force-mute", "reason": reason})
        await _broadcast_peer(meeting_id, target)


async def _stop_video(meeting_id: int, targets: list[Peer], reason: str) -> None:
    targets = [t for t in targets if t.video_on]
    with SessionLocal() as db:
        participant_service.stop_video(db, meeting_id, [t.id for t in targets])
    for target in targets:
        target.video_on = False
        await target.send({"type": "force-video-off", "reason": reason})
        await _broadcast_peer(meeting_id, target)


async def _stop_share(meeting_id: int, targets: list[Peer], reason: str) -> None:
    for target in [t for t in targets if t.sharing]:
        target.sharing = False
        await target.send({"type": "force-share-off", "reason": reason})
        await _broadcast_peer(meeting_id, target)


def _participants(meeting_id: int) -> list[Peer]:
    return [p for p in room_manager.peers(meeting_id) if not p.is_host]


async def _mute(meeting_id: int, peer: Peer, msg: dict[str, Any]) -> None:
    target = room_manager.get(meeting_id, str(msg.get("target")))
    if target is not None and target.id != peer.id:
        await _force_mute(meeting_id, [target], "The host muted you.")


async def _mute_all(meeting_id: int, peer: Peer, _msg: dict[str, Any]) -> None:
    others = [p for p in room_manager.peers(meeting_id) if p.id != peer.id]
    await _force_mute(meeting_id, others, "The host muted everyone.")


async def _remove(meeting_id: int, peer: Peer, msg: dict[str, Any]) -> None:
    target_id = str(msg.get("target"))
    with SessionLocal() as db:
        try:
            participant_service.remove_participant(db, meeting_id, target_id)
        except DomainError as exc:
            return await _error(peer, exc.message)
    await room_manager.kick(meeting_id, target_id, {"type": "removed"})
    await room_manager.broadcast(meeting_id, {"type": "peer-left", "peer_id": target_id})


async def _admit_peer(meeting_id: int, peer_id: str) -> None:
    admitted = await room_manager.admit(meeting_id, peer_id)
    if admitted is not None:
        await enter_room(meeting_id, admitted)


async def _admit(meeting_id: int, _peer: Peer, msg: dict[str, Any]) -> None:
    await _admit_peer(meeting_id, str(msg.get("target")))
    await notify_waiting_list(meeting_id)


async def _admit_everyone(meeting_id: int) -> None:
    for waiting in room_manager.waiting(meeting_id):
        await _admit_peer(meeting_id, waiting.id)
    await notify_waiting_list(meeting_id)


async def _admit_all(meeting_id: int, _peer: Peer, _msg: dict[str, Any]) -> None:
    await _admit_everyone(meeting_id)


async def _deny(meeting_id: int, _peer: Peer, msg: dict[str, Any]) -> None:
    target_id = str(msg.get("target"))
    if not any(p.id == target_id for p in room_manager.waiting(meeting_id)):
        return
    with SessionLocal() as db:
        participant_service.remove_participant(db, meeting_id, target_id)
    await room_manager.kick(meeting_id, target_id, {"type": "removed"})
    await notify_waiting_list(meeting_id)


async def _apply_settings(meeting_id: int, changes: dict[str, Any]) -> None:
    settings = _settings(meeting_id)
    changed = settings.update(changes)
    if not changed:
        return
    await room_manager.broadcast(meeting_id, {"type": "room-settings", "settings": settings.public()})

    participants = _participants(meeting_id)
    if "allow_video" in changed and not settings.allow_video:
        await _stop_video(meeting_id, participants, "The host has stopped your video.")
    if "allow_share" in changed and not settings.allow_share:
        await _stop_share(meeting_id, participants, "The host has stopped your screen share.")
    if "share_mode" in changed and settings.share_mode == "single":
        # Keep one presenter (the host's share wins), stop the rest.
        sharers = sorted((p for p in room_manager.peers(meeting_id) if p.sharing), key=lambda p: not p.is_host)
        await _stop_share(meeting_id, sharers[1:], "Only one participant can share at a time.")
    if "waiting_room" in changed and not settings.waiting_room:
        # Turning the waiting room off lets everyone who is waiting in (as Zoom does).
        await _admit_everyone(meeting_id)


async def _update_settings(meeting_id: int, _peer: Peer, msg: dict[str, Any]) -> None:
    changes = msg.get("settings")
    if isinstance(changes, dict):
        await _apply_settings(meeting_id, changes)


async def _suspend(meeting_id: int, _peer: Peer, _msg: dict[str, Any]) -> None:
    """Zoom's "Suspend Participant Activities": silence everyone, revoke permissions, lock."""
    await _apply_settings(
        meeting_id,
        {
            "locked": True,
            "allow_chat": False,
            "allow_rename": False,
            "allow_unmute": False,
            "allow_video": False,
            # "Only Host" can share; single mode, since multiple sharing forces All Participants.
            "share_mode": "single",
            "allow_share": False,
        },
    )
    participants = _participants(meeting_id)
    reason = "The host has suspended participant activities."
    await _force_mute(meeting_id, participants, reason)
    await _stop_video(meeting_id, participants, reason)
    await _stop_share(meeting_id, participants, reason)


async def _end_meeting(meeting_id: int, _peer: Peer, _msg: dict[str, Any]) -> None:
    with SessionLocal() as db:
        meeting = meeting_service.get_meeting(db, meeting_id)
        participant_service.end_meeting(db, meeting)
    await room_manager.close_room(meeting_id, reason="meeting-ended")


PEER_HANDLERS: dict[str, Handler] = {
    "signal": _signal,
    "media-state": _media_state,
    "chat": _chat,
    "reaction": _reaction,
    "rename": _rename,
}
HOST_HANDLERS: dict[str, Handler] = {
    "mute": _mute,
    "mute-all": _mute_all,
    "remove": _remove,
    "admit": _admit,
    "admit-all": _admit_all,
    "deny": _deny,
    "update-settings": _update_settings,
    "suspend": _suspend,
    "end-meeting": _end_meeting,
}


async def dispatch(meeting_id: int, peer: Peer, msg: dict[str, Any]) -> None:
    # People in the waiting room can't do anything until the host admits them.
    if room_manager.is_waiting(meeting_id, peer):
        return
    msg_type = msg.get("type")
    if msg_type in PEER_HANDLERS:
        await PEER_HANDLERS[msg_type](meeting_id, peer, msg)
    elif msg_type in HOST_HANDLERS:
        # Host privileges are enforced here, server-side, not just hidden in the UI.
        if not peer.is_host:
            return await _error(peer, "Only the host can do that.")
        await HOST_HANDLERS[msg_type](meeting_id, peer, msg)
