#!/usr/bin/env python3
"""
Wildlife Narration API - Development Server Runner

Run this script to start the FastAPI development server.
"""

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print(f"🦁 Starting {settings.app_name} v{settings.app_version}")
    print(f"🌐 Server will be available at: http://{settings.host}:{settings.port}")
    print(f"📚 API Documentation: http://{settings.host}:{settings.port}/docs")
    print(f"🔧 Debug mode: {settings.debug}")
    print("-" * 50)
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
    ) 