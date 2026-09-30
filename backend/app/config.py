"""Application settings, loaded from environment variables (or a .env file)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./zoom_clone.db"
    # Public URL of the Next.js app; used to build shareable invite links.
    frontend_url: str = "http://localhost:3000"
    # Comma-separated list of allowed CORS origins.
    cors_origins: str = "http://localhost:3000"
    # Seed the database with sample data on startup when it is empty.
    seed_on_startup: bool = True
    # A live meeting ends this many seconds after its last participant disconnects,
    # so a page refresh or network blip does not kill the meeting.
    empty_room_grace_seconds: float = 30

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
