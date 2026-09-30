"""Domain errors raised by services; routers translate them into HTTP responses."""


class DomainError(Exception):
    status_code = 400

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class NotFoundError(DomainError):
    status_code = 404


class ForbiddenError(DomainError):
    status_code = 403


class MeetingEndedError(DomainError):
    status_code = 410


class ValidationError(DomainError):
    status_code = 422
