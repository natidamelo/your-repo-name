import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Call Center Staff Scheduling & Management System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-call-center-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Dual database support: defaults to SQLite for instant local zero-config, or PostgreSQL when configured
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./callcenter.db"
    )
    
    # Default Schedule Settings
    SUNDAY_MAX_STAFF: int = 4
    SATURDAY_ROTATION_ANCHOR_DATE: str = "2026-09-28"  # Week A anchor
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
