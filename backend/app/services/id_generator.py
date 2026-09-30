"""Generators for public Meeting IDs, PMIs and passcodes."""
import secrets
import string
from collections.abc import Callable

_PASSCODE_ALPHABET = string.ascii_letters + string.digits
MAX_ATTEMPTS = 20


def _random_digits(length: int) -> str:
    # First digit is never 0 so IDs keep their length when treated as numbers.
    first = secrets.choice("123456789")
    return first + "".join(secrets.choice(string.digits) for _ in range(length - 1))


def generate_unique_code(length: int, is_taken: Callable[[str], bool]) -> str:
    """Draw random numeric codes until one is free. 10^10 codes make collisions vanishingly rare."""
    for _ in range(MAX_ATTEMPTS):
        code = _random_digits(length)
        if not is_taken(code):
            return code
    raise RuntimeError("Could not allocate a unique meeting code")


def generate_passcode(length: int = 6) -> str:
    """Zoom-style mixed-case alphanumeric passcode, e.g. "AwW2T7"."""
    return "".join(secrets.choice(_PASSCODE_ALPHABET) for _ in range(length))


def format_meeting_id(code: str) -> str:
    """Group digits the way Zoom displays them: 813 6000 4521 / 320 631 3470."""
    if len(code) == 11:
        return f"{code[:3]} {code[3:7]} {code[7:]}"
    if len(code) == 10:
        return f"{code[:3]} {code[3:6]} {code[6:]}"
    return code
