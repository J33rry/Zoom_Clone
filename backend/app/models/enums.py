import enum


class MeetingType(str, enum.Enum):
    INSTANT = "instant"
    SCHEDULED = "scheduled"
    # The host's permanent Personal Meeting Room; its code is the user's PMI.
    PERSONAL = "personal"


class MeetingStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    ENDED = "ended"


class ParticipantRole(str, enum.Enum):
    HOST = "host"
    PARTICIPANT = "participant"
