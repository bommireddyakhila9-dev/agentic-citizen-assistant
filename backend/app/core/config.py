from pydantic_settings import BaseSettings
from typing import List
import os

# Calculate absolute path to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_SQLITE_PATH = os.path.join(BACKEND_DIR, "citizen_assistant.db")
ENV_FILE_PATH = os.path.join(BACKEND_DIR, ".env")


class Settings(BaseSettings):
    PROJECT_NAME: str = "Agentic AI Citizen Assistant"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*",
    ]

    # Database Configuration
    DB_TYPE: str = "sqlite"

    # MySQL Settings
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = ""
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DB: str = "citizen_assistant_db"

    # Google Gemini API Settings (using gemini-flash-lite-latest for high availability & speed)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-lite-latest"

    # Cellular SMS Gateway Settings (Fast2SMS / Twilio)
    FAST2SMS_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    @property
    def DATABASE_URL(self) -> str:
        if self.DB_TYPE.lower() == "mysql":
            return (
                f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@"
                f"{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
            )
        formatted_path = DEFAULT_SQLITE_PATH.replace("\\", "/")
        return f"sqlite:///{formatted_path}"

    class Config:
        case_sensitive = True
        env_file = ENV_FILE_PATH
        extra = "allow"


settings = Settings()
