from pydantic import BaseModel, ConfigDict


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    avatar_color: str
    initial: str


class UserOut(UserBrief):
    email: str
    personal_meeting_id: str
    timezone: str


class TimezoneOption(BaseModel):
    id: str
    label: str
