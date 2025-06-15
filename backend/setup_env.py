#!/usr/bin/env python3
"""
Setup script to create .env file for Wildlife Narration API
"""

import os
from pathlib import Path

def create_env_file():
    """Create .env file with API keys and configuration"""
    
    env_content = """# API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
YOUTUBE_API_KEY=AIzaSyB6TPxS19x_gJzyCOTGZJm_oJThJ_Bmv64

# Application Configuration
APP_NAME=Wildlife Narration API
APP_VERSION=1.0.0
DEBUG=True
LOG_LEVEL=INFO

# Server Configuration
HOST=0.0.0.0
PORT=8000
RELOAD=True

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

# Database Configuration (if needed later)
DATABASE_URL=sqlite:///./wildlife_narration.db

# AI Model Configuration
DEFAULT_LLM_MODEL=gpt-3.5-turbo
YOLO_MODEL_PATH=yolov8n.pt
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Video Processing Configuration
MAX_FRAME_RATE=2
FRAME_EXTRACTION_QUALITY=medium
MAX_CONCURRENT_STREAMS=5

# Narration Configuration
DEFAULT_NARRATION_STYLE=field-scientist
MAX_NARRATION_LENGTH=500
NARRATION_UPDATE_INTERVAL=5

# Security
SECRET_KEY=wildlife_narration_secret_key_change_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
"""
    
    env_path = Path(".env")
    
    if env_path.exists():
        print("⚠️  .env file already exists!")
        response = input("Do you want to overwrite it? (y/N): ")
        if response.lower() != 'y':
            print("❌ Setup cancelled.")
            return False
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        
        print("✅ .env file created successfully!")
        print("\n📝 Next steps:")
        print("1. Add your OpenAI API key to the .env file")
        print("2. Optionally add Anthropic or HuggingFace API keys")
        print("3. Run: python -m pip install -r requirements.txt")
        print("4. Run: python run.py")
        print("\n🔗 Get API keys from:")
        print("   • OpenAI: https://platform.openai.com/api-keys")
        print("   • Anthropic: https://console.anthropic.com/")
        print("   • HuggingFace: https://huggingface.co/settings/tokens")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

if __name__ == "__main__":
    print("🦁 Wildlife Narration API - Environment Setup")
    print("=" * 50)
    create_env_file() 