"""Host tools panel: waiting room, lock, and the "Allow participants to …" permissions."""
from contextlib import contextmanager

from tests.test_realtime import _receive_until, _start_meeting


@contextmanager
def _connect_both(client, meeting_id, host_pid, guest_pid):
    with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={host_pid}") as host_ws:
        host_ws.receive_json()
        with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={guest_pid}") as guest_ws:
            guest_ws.receive_json()
            yield host_ws, guest_ws


def _peer_update(ws, peer_id):
    while True:
        message = _receive_until(ws, "peer-updated")
        if message["peer"]["id"] == peer_id:
            return message["peer"]


def _receive_types(ws, *types):
    """Collect one message of each type, in whatever order they arrive."""
    pending, seen = set(types), {}
    while pending:
        message = ws.receive_json()
        if message["type"] in pending:
            pending.discard(message["type"])
            seen[message["type"]] = message
    return seen


def _settings(ws, **changes):
    ws.send_json({"type": "update-settings", "settings": changes})


def test_room_state_includes_default_settings(client):
    meeting_id, host_pid, _ = _start_meeting(client)
    with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={host_pid}") as ws:
        settings = ws.receive_json()["settings"]
    assert settings == {
        "waiting_room": False,
        "locked": False,
        "hide_profile_pictures": False,
        "allow_chat": True,
        "allow_rename": True,
        "allow_unmute": True,
        "allow_video": True,
        "allow_share": True,
        "share_mode": "multiple",
        "share_takeover": "all",
    }


def test_only_host_changes_settings(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with _connect_both(client, meeting_id, host_pid, guest_pid) as (host_ws, guest_ws):
        _settings(guest_ws, allow_chat=False)
        assert _receive_until(guest_ws, "error")["message"] == "Only the host can do that."


def test_waiting_room_admit_and_deny(client):
    meeting = client.post("/api/meetings/instant", json={}).json()
    code, pwd = meeting["join_code"], meeting["passcode"]
    host = client.post(f"/api/meetings/code/{code}/join", json={"display_name": "Host", "as_host": True}).json()
    with client.websocket_connect(f"/ws/meetings/{meeting['id']}?pid={host['participant_id']}") as host_ws:
        host_ws.receive_json()
        _settings(host_ws, waiting_room=True)
        _receive_until(host_ws, "room-settings")

        guest = client.post(f"/api/meetings/code/{code}/join", json={"display_name": "Guest", "passcode": pwd}).json()
        with client.websocket_connect(f"/ws/meetings/{meeting['id']}?pid={guest['participant_id']}") as guest_ws:
            assert guest_ws.receive_json()["type"] == "waiting"
            waiting = _receive_until(host_ws, "waiting-list")["peers"]
            assert [p["name"] for p in waiting] == ["Guest"]

            # Messages from the waiting room are ignored.
            guest_ws.send_json({"type": "chat", "body": "let me in"})

            host_ws.send_json({"type": "admit", "target": guest["participant_id"]})
            state = _receive_until(guest_ws, "room-state")
            assert state["chat"] == []
            assert _receive_until(host_ws, "peer-joined")["peer"]["name"] == "Guest"
            assert _receive_until(host_ws, "waiting-list")["peers"] == []

        # An admitted session reconnects straight into the meeting (e.g. page refresh).
        with client.websocket_connect(f"/ws/meetings/{meeting['id']}?pid={guest['participant_id']}") as guest_ws:
            assert guest_ws.receive_json()["type"] == "room-state"

        other = client.post(f"/api/meetings/code/{code}/join", json={"display_name": "Other", "passcode": pwd}).json()
        with client.websocket_connect(f"/ws/meetings/{meeting['id']}?pid={other['participant_id']}") as other_ws:
            assert other_ws.receive_json()["type"] == "waiting"
            host_ws.send_json({"type": "deny", "target": other["participant_id"]})
            assert _receive_until(other_ws, "removed")["type"] == "removed"


def test_disabling_waiting_room_admits_everyone(client):
    meeting = client.post("/api/meetings/instant", json={}).json()
    code, pwd = meeting["join_code"], meeting["passcode"]
    host = client.post(f"/api/meetings/code/{code}/join", json={"display_name": "Host", "as_host": True}).json()
    with client.websocket_connect(f"/ws/meetings/{meeting['id']}?pid={host['participant_id']}") as host_ws:
        host_ws.receive_json()
        _settings(host_ws, waiting_room=True)
        guest = client.post(f"/api/meetings/code/{code}/join", json={"display_name": "Guest", "passcode": pwd}).json()
        with client.websocket_connect(f"/ws/meetings/{meeting['id']}?pid={guest['participant_id']}") as guest_ws:
            assert guest_ws.receive_json()["type"] == "waiting"
            _settings(host_ws, waiting_room=False)
            assert _receive_until(guest_ws, "room-state")["type"] == "room-state"


def test_locked_meeting_rejects_new_joins(client):
    meeting_id, host_pid, _ = _start_meeting(client)
    meeting = client.get(f"/api/meetings/{meeting_id}").json()
    with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={host_pid}") as host_ws:
        host_ws.receive_json()
        _settings(host_ws, locked=True)
        _receive_until(host_ws, "room-settings")
        response = client.post(
            f"/api/meetings/code/{meeting['join_code']}/join",
            json={"display_name": "Late", "passcode": meeting["passcode"]},
        )
        assert response.status_code == 403
        assert response.json()["detail"] == "This meeting has been locked by the host."


def test_chat_permission(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with _connect_both(client, meeting_id, host_pid, guest_pid) as (host_ws, guest_ws):
        _settings(host_ws, allow_chat=False)
        _receive_until(guest_ws, "room-settings")
        guest_ws.send_json({"type": "chat", "body": "hello"})
        assert _receive_until(guest_ws, "error")["message"] == "The host has disabled chat."
        host_ws.send_json({"type": "chat", "body": "host can still chat"})
        assert _receive_until(guest_ws, "chat")["message"]["body"] == "host can still chat"


def test_unmute_permission(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)  # guest joins unmuted
    with _connect_both(client, meeting_id, host_pid, guest_pid) as (host_ws, guest_ws):
        _settings(host_ws, allow_unmute=False)
        host_ws.send_json({"type": "mute", "target": guest_pid})
        _receive_until(guest_ws, "force-mute")
        guest_ws.send_json({"type": "media-state", "audio_muted": False, "video_on": False, "sharing": False})
        assert _receive_until(guest_ws, "force-mute")["reason"] == "The host has disabled unmuting."
        assert _receive_until(host_ws, "peer-updated")["peer"]["audio_muted"] is True


def test_video_and_share_permissions(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with _connect_both(client, meeting_id, host_pid, guest_pid) as (host_ws, guest_ws):
        guest_ws.send_json({"type": "media-state", "audio_muted": True, "video_on": True, "sharing": True})
        peer = _receive_until(host_ws, "peer-updated")["peer"]
        assert peer["video_on"] is True and peer["sharing"] is True

        _settings(host_ws, allow_video=False, share_mode="single", allow_share=False)
        assert _receive_until(guest_ws, "force-video-off")["type"] == "force-video-off"
        assert _receive_until(guest_ws, "force-share-off")["type"] == "force-share-off"

        guest_ws.send_json({"type": "media-state", "audio_muted": True, "video_on": True, "sharing": False})
        assert _receive_until(guest_ws, "force-video-off")["reason"] == "The host has disabled participant video."

        # The host is never restricted.
        host_ws.send_json({"type": "media-state", "audio_muted": True, "video_on": True, "sharing": False})
        assert _peer_update(guest_ws, host_pid)["video_on"] is True


def test_rename_permission(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with _connect_both(client, meeting_id, host_pid, guest_pid) as (host_ws, guest_ws):
        guest_ws.send_json({"type": "rename", "name": "Guesty"})
        assert _receive_until(host_ws, "peer-updated")["peer"]["name"] == "Guesty"

        guest_ws.send_json({"type": "rename", "name": "Nope", "target": host_pid})
        assert _receive_until(guest_ws, "error")["message"] == "Only the host can rename other participants."

        _settings(host_ws, allow_rename=False)
        guest_ws.send_json({"type": "rename", "name": "Blocked"})
        assert _receive_until(guest_ws, "error")["message"] == "The host has disabled renaming."

        host_ws.send_json({"type": "rename", "name": "Renamed by host", "target": guest_pid})
        assert _receive_until(guest_ws, "peer-updated")["peer"]["name"] == "Renamed by host"


def test_suspend_participant_activities(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with _connect_both(client, meeting_id, host_pid, guest_pid) as (host_ws, guest_ws):
        guest_ws.send_json({"type": "media-state", "audio_muted": False, "video_on": True, "sharing": False})
        _receive_until(host_ws, "peer-updated")

        host_ws.send_json({"type": "suspend"})
        settings = _receive_until(guest_ws, "room-settings")["settings"]
        assert settings["locked"] is True
        assert not any(settings[k] for k in ("allow_chat", "allow_rename", "allow_unmute", "allow_video", "allow_share"))
        _receive_types(guest_ws, "force-mute", "force-video-off")


def test_share_settings_validation_and_multiple_mode_defaults(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with _connect_both(client, meeting_id, host_pid, guest_pid) as (host_ws, guest_ws):
        # Invalid choices are ignored, and in multiple mode "Who can share?" stays All Participants,
        # so this changes nothing (no room-settings broadcast).
        _settings(host_ws, share_mode="everyone", allow_share=False)
        _settings(host_ws, share_mode="single", allow_share=False, share_takeover="host")
        settings = _receive_until(guest_ws, "room-settings")["settings"]
        assert (settings["share_mode"], settings["allow_share"], settings["share_takeover"]) == ("single", False, "host")
        _settings(host_ws, share_mode="multiple")
        settings = _receive_until(guest_ws, "room-settings")["settings"]
        assert (settings["share_mode"], settings["allow_share"], settings["share_takeover"]) == ("multiple", True, "all")


def test_single_share_takeover_rules(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with _connect_both(client, meeting_id, host_pid, guest_pid) as (host_ws, guest_ws):
        _settings(host_ws, share_mode="single", share_takeover="host")
        _receive_until(guest_ws, "room-settings")

        host_ws.send_json({"type": "media-state", "audio_muted": True, "video_on": False, "sharing": True})
        assert _peer_update(guest_ws, host_pid)["sharing"] is True

        # Only the host may take over while someone is sharing.
        guest_ws.send_json({"type": "media-state", "audio_muted": True, "video_on": False, "sharing": True})
        reason = _receive_until(guest_ws, "force-share-off")["reason"]
        assert reason == "You cannot start sharing while another participant is sharing."

        # With "All Participants", starting a share takes over the current one.
        _settings(host_ws, share_takeover="all")
        _receive_until(guest_ws, "room-settings")
        guest_ws.send_json({"type": "media-state", "audio_muted": True, "video_on": False, "sharing": True})
        assert _receive_until(host_ws, "force-share-off")["reason"] == "Guest started sharing."
        assert _peer_update(host_ws, guest_pid)["sharing"] is True
