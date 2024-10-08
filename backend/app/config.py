import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.environ["DATABASE_URL"]
    SECRET_KEY: str = os.environ["SECRET_KEY"]
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str = os.environ["CORS_ORIGINS"]
    BACKEND_HOST: str = os.environ["BACKEND_HOST"]
    BACKEND_PORT: int = int(os.environ.get("PORT", 8000))

settings = Settings()