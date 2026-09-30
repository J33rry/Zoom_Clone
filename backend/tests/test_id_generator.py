from app.services.id_generator import format_meeting_id, generate_passcode, generate_unique_code


def test_unique_code_skips_taken_codes():
    taken = set()
    for _ in range(200):
        code = generate_unique_code(11, lambda c: c in taken)
        assert len(code) == 11 and code.isdigit() and code[0] != "0"
        assert code not in taken
        taken.add(code)


def test_passcode_is_alphanumeric():
    code = generate_passcode()
    assert len(code) == 6 and code.isalnum()


def test_format_meeting_id_matches_zoom_grouping():
    assert format_meeting_id("81360004521") == "813 6000 4521"
    assert format_meeting_id("3206313470") == "320 631 3470"
