import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    
    # AI - Groq Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # Database - Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    
    # CORS Origin (comma-separated or wildcard)
    FRONTEND_ORIGIN: Union[str, List[str]] = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.FRONTEND_ORIGIN, list):
            return self.FRONTEND_ORIGIN
        if self.FRONTEND_ORIGIN == "*":
            return ["*"]
        return [origin.strip() for origin in self.FRONTEND_ORIGIN.split(",") if origin.strip()]

settings = Settings()
