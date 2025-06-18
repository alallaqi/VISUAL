from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger

from .core.config import settings
from .api.v1.streams import router as streams_router
from .api.v1.proxy import router as proxy_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"🦁 Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"🌐 Server will be available at: http://{settings.host}:{settings.port}")
    logger.info(f"📚 API Documentation: http://{settings.host}:{settings.port}/docs")
    logger.info(f"🔧 Debug mode: {settings.debug}")
    logger.info("=" * 50)
    yield
    # Shutdown
    logger.info("🛑 Shutting down Wildlife Narration API")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered wildlife narration API for live stream accessibility",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(streams_router, prefix="/api/v1")
app.include_router(proxy_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "debug": settings.debug
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower()
    ) 