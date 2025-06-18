from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
import os
from pathlib import Path


class Settings(BaseSettings):
    model_config = ConfigDict(
        extra='ignore',
        env_file='.env',
        case_sensitive=False
    )
    
    # Application
    app_name: str = "Wildlife Narration API"
    app_version: str = "1.0.0"
    debug: bool = True
    log_level: str = "INFO"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8001
    reload: bool = True
    
    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3005"
    
    # API Keys
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    huggingface_api_key: str = ""
    youtube_api_key: str = ""
    
    # Database
    database_url: str = "sqlite:///./wildlife_narration.db"
    
    # AI Models
    default_llm_model: str = "gpt-3.5-turbo"
    yolo_model_path: str = "yolov8n.pt"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Video Processing
    max_frame_rate: int = 2
    frame_extraction_quality: str = "medium"
    max_concurrent_streams: int = 5
    
    # Narration
    default_narration_style: str = "field-scientist"
    max_narration_length: int = 500
    narration_update_interval: int = 5
    
    # Security
    secret_key: str = "your_secret_key_here_change_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as a list"""
        if isinstance(self.allowed_origins, str):
            return [origin.strip() for origin in self.allowed_origins.split(",")]
        return self.allowed_origins


# Global settings instance
settings = Settings()

# Ensure required directories exist
def ensure_directories():
    """Create necessary directories if they don't exist"""
    directories = [
        "logs",
        "models", 
        "temp",
        "data/streams",
        "data/frames",
        "data/vectors"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)

# Initialize directories on import
ensure_directories() 