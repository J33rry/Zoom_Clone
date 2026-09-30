from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models import User
from app.schemas.user import TimezoneOption, UserOut
from app.services.timezones import timezone_options

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut)
def read_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.get("/timezones", response_model=list[TimezoneOption])
def list_timezones() -> list[dict[str, str]]:
    return timezone_options()
