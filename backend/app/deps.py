"""Shared FastAPI dependencies."""
from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User


def get_current_user(db: Session = Depends(get_db)) -> User:
    """No authentication yet: the seeded default user is always "signed in".

    Swapping this dependency for a real session/JWT lookup is the only change
    routers need once login is added.
    """
    user = db.scalar(select(User).order_by(User.id).limit(1))
    if user is None:
        raise HTTPException(status_code=503, detail="No default user; run the seed script")
    return user
