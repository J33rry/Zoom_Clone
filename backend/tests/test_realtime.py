import pytest
from starlette.websockets import WebSocketDisconnect


def _start_meeting(client):
    meeting = client.post("/api/meetings/instant", json={}).json()
    code, pwd = meeting["join_code"], meeting["passcode"]
    host = client.post(f"/api/meetings/code/{code}/join", json={"display_name": "Host", "as_host": True}).json()
    guest = client.post(
        f"/api/meetings/code/{code}/join",
        json={"display_name": "Guest", "passcode": pwd, "audio_muted": False},
    ).json()
    return meeting["id"], host["participant_id"], guest["participant_id"]


def _receive_until(ws, msg_type):
    while True:
        message = ws.receive_json()
        if message["type"] == msg_type:
            return message


def test_invalid_session_is_rejected(client):
    meeting_id, _, _ = _start_meeting(client)
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid=bogus") as ws:
            ws.receive_json()


def test_signalling_and_host_controls(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={host_pid}") as host_ws:
        assert host_ws.receive_json()["type"] == "room-state"
        with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={guest_pid}") as guest_ws:
            state = guest_ws.receive_json()
            assert state["type"] == "room-state"
            assert [p["id"] for p in state["peers"]] == [host_pid]
            assert _receive_until(host_ws, "peer-joined")["peer"]["id"] == guest_pid

            # Newcomer sends an offer; it is relayed only to the addressed peer.
            guest_ws.send_json({"type": "signal", "to": host_pid, "data": {"kind": "offer", "sdp": "x"}})
            relayed = _receive_until(host_ws, "signal")
            assert relayed["from"] == guest_pid and relayed["data"]["kind"] == "offer"

            # Guests cannot use host tools.
            guest_ws.send_json({"type": "mute-all"})
            assert _receive_until(guest_ws, "error")["message"] == "Only the host can do that."

            host_ws.send_json({"type": "mute-all"})
            assert _receive_until(guest_ws, "force-mute")["type"] == "force-mute"

            host_ws.send_json({"type": "remove", "target": guest_pid})
            assert _receive_until(guest_ws, "removed")["type"] == "removed"
            assert _receive_until(host_ws, "peer-left")["peer_id"] == guest_pid

        # A removed participant cannot reconnect with the same session.
        with pytest.raises(WebSocketDisconnect):
            with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={guest_pid}") as ws:
                ws.receive_json()


def test_host_ends_meeting_for_all(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={host_pid}") as host_ws:
        host_ws.receive_json()
        with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={guest_pid}") as guest_ws:
            guest_ws.receive_json()
            host_ws.send_json({"type": "end-meeting"})
            assert _receive_until(guest_ws, "meeting-ended")["type"] == "meeting-ended"
    assert client.get(f"/api/meetings/{meeting_id}").json()["status"] == "ended"


def test_chat_is_broadcast_and_persisted(client):
    meeting_id, host_pid, guest_pid = _start_meeting(client)
    with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={host_pid}") as host_ws:
        host_ws.receive_json()
        host_ws.send_json({"type": "chat", "body": "hello"})
        assert _receive_until(host_ws, "chat")["message"]["body"] == "hello"
        with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={guest_pid}") as guest_ws:
            history = guest_ws.receive_json()["chat"]
            assert [m["body"] for m in history] == ["hello"]


def test_dropped_participant_can_reconnect(client):
    meeting_id, host_pid, _ = _start_meeting(client)
    with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={host_pid}") as ws:
        ws.receive_json()
    # e.g. a page refresh: same session id reconnects while the meeting is still live
    with client.websocket_connect(f"/ws/meetings/{meeting_id}?pid={host_pid}") as ws:
        assert ws.receive_json()["type"] == "room-state"


def test_lookup_exposes_participant_video_default(client):
    meeting = client.post("/api/meetings/instant", json={}).json()
    assert client.get(f"/api/meetings/code/{meeting['join_code']}").json()["participant_video_on"] is True


def test_direct_messages_are_private(client):
    meeting = client.post("/api/meetings/instant", json={}).json()
    code, pwd = meeting["join_code"], meeting["passcode"]

    def join(name, **extra):
        return client.post(f"/api/meetings/code/{code}/join", json={"display_name": name, "passcode": pwd, **extra}).json()

    host, alice, bob = join("Host", as_host=True), join("Alice"), join("Bob")
    url = lambda p: f"/ws/meetings/{meeting['id']}?pid={p['participant_id']}"  # noqa: E731
    with client.websocket_connect(url(host)) as host_ws, client.websocket_connect(url(alice)) as alice_ws:
        host_ws.receive_json()
        alice_ws.receive_json()
        with client.websocket_connect(url(bob)) as bob_ws:
            bob_ws.receive_json()
            alice_ws.send_json({"type": "chat", "body": "psst", "to": host["participant_id"]})
            dm = _receive_until(host_ws, "chat")["message"]
            assert dm["to"] == {"id": host["participant_id"], "name": "Host"}
            assert _receive_until(alice_ws, "chat")["message"]["body"] == "psst"

            # Bob only sees the next group message, never the DM.
            host_ws.send_json({"type": "chat", "body": "hello all"})
            group = _receive_until(bob_ws, "chat")["message"]
            assert group["body"] == "hello all" and group["to"] is None

        # History on (re)join follows the same visibility rules.
        with client.websocket_connect(url(bob)) as bob_ws:
            assert [m["body"] for m in bob_ws.receive_json()["chat"]] == ["hello all"]
    with client.websocket_connect(url(alice)) as alice_ws:
        assert [m["body"] for m in alice_ws.receive_json()["chat"]] == ["psst", "hello all"]
