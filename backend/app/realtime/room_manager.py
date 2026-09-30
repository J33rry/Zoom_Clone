"""In-memory registry of live meeting rooms: connected peers, the waiting room and host settings.

Single-process by design (SQLite + one server). Running several workers would need
a shared pub/sub (e.g. Redis) so broadcasts reach sockets held by other processes.
"""
import asyncio
import contextlib
from dataclasses import asdict, dataclass, field, fields
from typing import Any, ClassVar, Literal

from fastapi import WebSocket

HOST_ROLE = "host"


@dataclass
class Peer:
    id: str
    name: str
    role: str
    avatar_color: str
    audio_muted: bool
    video_on: bool
    websocket: WebSocket = field(repr=False)
    sharing: bool = False
    # Joined without an account, so there is no profile picture (Zoom shows the name instead).
    is_guest: bool = False

    @property
    def is_host(self) -> bool:
        return self.role == HOST_ROLE

    def public(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "avatar_color": self.avatar_color,
            "audio_muted": self.audio_muted,
            "video_on": self.video_on,
            "sharing": self.sharing,
            "is_guest": self.is_guest,
        }

    async def send(self, message: dict[str, Any]) -> None:
        # A peer that vanished mid-send is cleaned up by its own receive loop.
        with contextlib.suppress(Exception):
            await self.websocket.send_json(message)


@dataclass
class RoomSettings:
    """Host tools state for the current live session (like Zoom, it resets per session)."""

    waiting_room: bool = False
    locked: bool = False
    hide_profile_pictures: bool = False
    # "Allow participants to …"
    allow_chat: bool = True
    allow_rename: bool = True
    allow_unmute: bool = True
    allow_video: bool = True
    # Share settings. allow_share is "Who can share?": All Participants (True) / Only Host (False).
    allow_share: bool = True
    # "How many participants can share at the same time?"
    share_mode: str = "multiple"  # "single" | "multiple"
    # "Who can start sharing when someone else is sharing?"
    share_takeover: str = "all"  # "all" | "host"

    CHOICES: ClassVar[dict[str, set[str]]] = {
        "share_mode": {"single", "multiple"},
        "share_takeover": {"all", "host"},
    }

    def public(self) -> dict[str, Any]:
        return asdict(self)

    def _valid(self, name: str, value: Any) -> bool:
        if name in self.CHOICES:
            return value in self.CHOICES[name]
        return isinstance(value, bool)

    def update(self, changes: dict[str, Any]) -> set[str]:
        """Apply known, valid settings; returns the names whose value actually changed."""
        before = self.public()
        for f in fields(self):
            if f.name in changes and self._valid(f.name, changes[f.name]):
                setattr(self, f.name, changes[f.name])
        # With multiple simultaneous sharers, Zoom fixes both "who" questions to All Participants.
        if self.share_mode == "multiple":
            self.allow_share, self.share_takeover = True, "all"
        after = self.public()
        return {name for name in after if after[name] != before[name]}


@dataclass
class Room:
    settings: RoomSettings
    peers: dict[str, Peer] = field(default_factory=dict)
    waiting: dict[str, Peer] = field(default_factory=dict)
    # Sessions the host let in, so a refresh does not send them back to the waiting room.
    admitted: set[str] = field(default_factory=set)


class RoomManager:
    def __init__(self) -> None:
        self._rooms: dict[int, Room] = {}
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------ lookups

    def ensure_room(self, meeting_id: int, defaults: RoomSettings) -> Room:
        return self._rooms.setdefault(meeting_id, Room(settings=defaults))

    def settings(self, meeting_id: int) -> RoomSettings:
        """Live settings, or defaults when nobody is connected."""
        room = self._rooms.get(meeting_id)
        return room.settings if room else RoomSettings()

    def peers(self, meeting_id: int) -> list[Peer]:
        room = self._rooms.get(meeting_id)
        return list(room.peers.values()) if room else []

    def waiting(self, meeting_id: int) -> list[Peer]:
        room = self._rooms.get(meeting_id)
        return list(room.waiting.values()) if room else []

    def get(self, meeting_id: int, peer_id: str) -> Peer | None:
        room = self._rooms.get(meeting_id)
        return room.peers.get(peer_id) if room else None

    def is_waiting(self, meeting_id: int, peer: Peer) -> bool:
        room = self._rooms.get(meeting_id)
        return bool(room) and room.waiting.get(peer.id) is peer

    def is_admitted(self, meeting_id: int, peer_id: str) -> bool:
        room = self._rooms.get(meeting_id)
        return bool(room) and peer_id in room.admitted

    def is_empty(self, meeting_id: int) -> bool:
        """True when no one is *in* the meeting (people in the waiting room don't count)."""
        return not self.peers(meeting_id)

    # ------------------------------------------------------------------ membership

    async def add(self, meeting_id: int, peer: Peer) -> list[Peer]:
        """Put a peer in the meeting; returns the peers that were already there."""
        async with self._lock:
            room = self._rooms[meeting_id]
            stale = room.peers.pop(peer.id, None)
            existing = list(room.peers.values())
            room.peers[peer.id] = peer
        if stale is not None and stale is not peer:  # same session opened twice
            with contextlib.suppress(Exception):
                await stale.websocket.close(code=4409)
        return existing

    async def add_waiting(self, meeting_id: int, peer: Peer) -> None:
        async with self._lock:
            self._rooms[meeting_id].waiting[peer.id] = peer

    async def admit(self, meeting_id: int, peer_id: str) -> Peer | None:
        """Move a peer out of the waiting room. The caller then brings it into the meeting."""
        async with self._lock:
            room = self._rooms.get(meeting_id)
            peer = room.waiting.pop(peer_id, None) if room else None
            if peer is not None:
                room.admitted.add(peer_id)
            return peer

    async def remove(self, meeting_id: int, peer: Peer) -> Literal["meeting", "waiting"] | None:
        """Unregister a peer; says where it was, or None if it was already gone."""
        async with self._lock:
            room = self._rooms.get(meeting_id)
            if room is None:
                return None
            if room.peers.get(peer.id) is peer:
                del room.peers[peer.id]
                where: Literal["meeting", "waiting"] = "meeting"
            elif room.waiting.get(peer.id) is peer:
                del room.waiting[peer.id]
                where = "waiting"
            else:
                return None
            if not room.peers and not room.waiting:
                del self._rooms[meeting_id]
            return where

    # ------------------------------------------------------------------ messaging

    async def send_to(self, meeting_id: int, peer_id: str, message: dict[str, Any]) -> None:
        peer = self.get(meeting_id, peer_id)
        if peer is not None:
            await peer.send(message)

    async def broadcast(self, meeting_id: int, message: dict[str, Any], exclude: str | None = None) -> None:
        await asyncio.gather(*(p.send(message) for p in self.peers(meeting_id) if p.id != exclude))

    async def send_hosts(self, meeting_id: int, message: dict[str, Any]) -> None:
        await asyncio.gather(*(p.send(message) for p in self.peers(meeting_id) if p.is_host))

    async def kick(self, meeting_id: int, peer_id: str, message: dict[str, Any]) -> bool:
        """Notify one peer (in the meeting or waiting room), drop it and close its socket."""
        room = self._rooms.get(meeting_id)
        peer = (room.peers.get(peer_id) or room.waiting.get(peer_id)) if room else None
        if peer is None:
            return False
        await peer.send(message)
        await self.remove(meeting_id, peer)
        with contextlib.suppress(Exception):
            await peer.websocket.close()
        return True

    async def close_room(self, meeting_id: int, reason: str) -> None:
        async with self._lock:
            room = self._rooms.pop(meeting_id, None)
        if room is None:
            return
        for peer in [*room.peers.values(), *room.waiting.values()]:
            await peer.send({"type": reason})
            with contextlib.suppress(Exception):
                await peer.websocket.close()


room_manager = RoomManager()
