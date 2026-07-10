import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediLabsPro LIMS"
    API_V1_STR: str = "/api/v1"
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-medilab-pro-key-change-in-prod-1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for local testing convenience
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Google OAuth (Client ID from Google Cloud Console — free)
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    
    # Database
    # Fallback to local SQLite database in scratch/medilab-pro/backend directory
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./medilab_pro.db"
    )
    
    # Default Lab and Admin for seeding
    DEFAULT_LAB_NAME: str = "Central Diagnostic Lab"
    DEFAULT_LAB_SLUG: str = "central-lab"
    
    DEFAULT_ADMIN_EMAIL: str = "admin@medilab.pro"
    DEFAULT_ADMIN_PASSWORD: str = "Admin@123"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
