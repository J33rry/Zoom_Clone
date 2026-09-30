from datetime import UTC, datetime, timedelta


def _future(hours: int = 3) -> str:
    return (datetime.now(UTC) + timedelta(hours=hours)).isoformat()


def _schedule_payload(**overrides):
    payload = {
        "topic": "Planning",
        "description": "Agenda",
        "start_time": _future(),
        "duration_minutes": 40,
        "timezone": "Asia/Kolkata",
        "passcode_enabled": True,
        "passcode": "AwW2T7",
    }
    payload.update(overrides)
    return payload


def test_schedule_meeting_appears_in_upcoming(client):
    created = client.post("/api/meetings", json=_schedule_payload())
    assert created.status_code == 201
    body = created.json()
    assert len(body["join_code"]) == 11
    assert body["invite_link"].endswith(f"/j/{body['join_code']}?pwd=AwW2T7")
    assert "Passcode: AwW2T7" in body["invitation"]

    upcoming = client.get("/api/meetings/upcoming").json()
    assert body["id"] in [m["id"] for m in upcoming]


def test_schedule_rejects_past_start_and_bad_duration(client):
    past = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    assert client.post("/api/meetings", json=_schedule_payload(start_time=past)).status_code == 422
    assert client.post("/api/meetings", json=_schedule_payload(duration_minutes=0)).status_code == 422
    assert client.post("/api/meetings", json=_schedule_payload(topic="   ")).status_code == 422


def test_calendar_range_query(client):
    created = client.post("/api/meetings", json=_schedule_payload(start_time=_future(48))).json()
    start = datetime.fromisoformat(created["start_time"].replace("Z", "+00:00"))
    day = client.get(
        "/api/meetings",
        params={"from": (start - timedelta(hours=1)).isoformat(), "to": (start + timedelta(hours=1)).isoformat()},
    ).json()
    assert [m["id"] for m in day] == [created["id"]]


def test_edit_and_delete(client):
    meeting = client.post("/api/meetings", json=_schedule_payload()).json()
    updated = client.put(f"/api/meetings/{meeting['id']}", json=_schedule_payload(topic="Renamed"))
    assert updated.status_code == 200
    assert updated.json()["topic"] == "Renamed"
    assert updated.json()["join_code"] == meeting["join_code"]  # ID is stable across edits

    assert client.delete(f"/api/meetings/{meeting['id']}").status_code == 204
    assert client.get(f"/api/meetings/{meeting['id']}").status_code == 404


def test_pmi_meeting_uses_personal_room_code(client):
    meeting = client.post("/api/meetings", json=_schedule_payload(use_pmi=True)).json()
    assert meeting["join_code"] == "3206313470"
    assert client.get("/api/meetings/code/320 631 3470").status_code == 200


def test_lookup_unknown_meeting_returns_404(client):
    assert client.get("/api/meetings/code/12345678901").status_code == 404
    assert client.get("/api/meetings/code/not-a-code").status_code == 404


def test_instant_meeting_join_flow(client):
    meeting = client.post("/api/meetings/instant", json={}).json()
    code = meeting["join_code"]

    lookup = client.get(f"/api/meetings/code/{code}").json()
    assert lookup["requires_passcode"] is True

    host = client.post(f"/api/meetings/code/{code}/join", json={"display_name": "Jerry", "as_host": True})
    assert host.status_code == 200 and host.json()["role"] == "host"
    assert host.json()["meeting"]["status"] == "live"

    wrong = client.post(f"/api/meetings/code/{code}/join", json={"display_name": "Guest", "passcode": "nope"})
    assert wrong.status_code == 422

    guest = client.post(
        f"/api/meetings/code/{code}/join", json={"display_name": "Guest", "passcode": meeting["passcode"]}
    )
    assert guest.status_code == 200 and guest.json()["role"] == "participant"

    # A second session under the same guest name counts once.
    client.post(f"/api/meetings/code/{code}/join", json={"display_name": "guest", "passcode": meeting["passcode"]})
    people = client.get(f"/api/meetings/{meeting['id']}/participants").json()
    assert [(p["name"], p["role"], p["is_guest"], p["in_meeting"]) for p in people] == [
        ("Jerry", "host", False, True),
        ("Guest", "participant", True, True),
    ]

    assert client.post(f"/api/meetings/{meeting['id']}/end").status_code == 200
    assert not any(p["in_meeting"] for p in client.get(f"/api/meetings/{meeting['id']}/participants").json())
    assert client.get(f"/api/meetings/code/{code}").status_code == 410
    assert meeting["id"] in [m["id"] for m in client.get("/api/meetings/recent").json()]


def test_blank_display_name_rejected(client):
    meeting = client.post("/api/meetings/instant", json={}).json()
    response = client.post(f"/api/meetings/code/{meeting['join_code']}/join", json={"display_name": "  "})
    assert response.status_code == 422

