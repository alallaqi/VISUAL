"""
Frame Extraction API Endpoints

Provides REST API endpoints for video frame extraction functionality.
"""

import asyncio
import logging
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import json

from app.services.frame_extraction import (
    extract_frames_from_stream,
    extract_single_frame,
    stop_stream_extraction,
    get_extraction_status,
    FrameExtractionError
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/frame-extraction", tags=["Frame Extraction"])

# Pydantic models for request/response
class FrameExtractionConfig(BaseModel):
    """Configuration for frame extraction"""
    interval_seconds: float = Field(default=2.0, ge=0.1, le=60.0, description="Interval between frame extractions in seconds")
    max_frames: int = Field(default=1000, ge=1, le=10000, description="Maximum number of frames to extract")
    enhance_frames: bool = Field(default=True, description="Apply frame enhancement for better AI analysis")
    save_frames: bool = Field(default=False, description="Save frames to disk")
    extract_features: bool = Field(default=True, description="Extract frame features for analysis")

class FrameExtractionRequest(BaseModel):
    """Request model for starting frame extraction"""
    stream_url: str = Field(..., description="URL of the video stream")
    stream_id: str = Field(..., description="Unique identifier for the stream")
    config: Optional[FrameExtractionConfig] = Field(default=None, description="Extraction configuration")

class SingleFrameRequest(BaseModel):
    """Request model for single frame extraction"""
    stream_url: str = Field(..., description="URL of the video stream")
    timestamp: Optional[float] = Field(default=None, description="Specific timestamp to extract (seconds)")

class FrameData(BaseModel):
    """Response model for frame data"""
    frame_id: str
    stream_id: str
    frame_number: int
    timestamp: str
    frame_base64: str
    frame_path: Optional[str]
    features: Dict
    processing_config: Dict

class ExtractionStatus(BaseModel):
    """Response model for extraction status"""
    active_extractions: int
    cached_frames: int
    extraction_ids: List[str]

# Global storage for active extraction tasks
active_extraction_tasks: Dict[str, asyncio.Task] = {}

@router.post("/start", response_model=Dict[str, str])
async def start_frame_extraction(
    request: FrameExtractionRequest,
    background_tasks: BackgroundTasks
):
    """
    Start frame extraction from a video stream
    
    Args:
        request: Frame extraction request parameters
        background_tasks: FastAPI background tasks
        
    Returns:
        Dictionary with extraction task ID and status
    """
    try:
        # Validate stream URL
        if not request.stream_url or not request.stream_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Invalid stream URL")
        
        # Check if extraction is already running for this stream
        if request.stream_id in active_extraction_tasks:
            existing_task = active_extraction_tasks[request.stream_id]
            if not existing_task.done():
                raise HTTPException(
                    status_code=409, 
                    detail=f"Frame extraction already running for stream {request.stream_id}"
                )
        
        # Convert config to dict
        config_dict = request.config.dict() if request.config else None
        
        # Create extraction task
        task = asyncio.create_task(
            _run_frame_extraction(request.stream_url, request.stream_id, config_dict)
        )
        
        # Store task reference
        active_extraction_tasks[request.stream_id] = task
        
        logger.info(f"Started frame extraction for stream {request.stream_id}")
        
        return {
            "message": f"Frame extraction started for stream {request.stream_id}",
            "stream_id": request.stream_id,
            "status": "started"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start frame extraction: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start frame extraction: {str(e)}")

@router.post("/stop/{stream_id}", response_model=Dict[str, str])
async def stop_frame_extraction(stream_id: str):
    """
    Stop frame extraction for a specific stream
    
    Args:
        stream_id: Stream identifier to stop
        
    Returns:
        Dictionary with stop status
    """
    try:
        # Stop the extraction service
        stop_stream_extraction(stream_id)
        
        # Cancel the task if it exists
        if stream_id in active_extraction_tasks:
            task = active_extraction_tasks[stream_id]
            if not task.done():
                task.cancel()
            del active_extraction_tasks[stream_id]
        
        logger.info(f"Stopped frame extraction for stream {stream_id}")
        
        return {
            "message": f"Frame extraction stopped for stream {stream_id}",
            "stream_id": stream_id,
            "status": "stopped"
        }
        
    except Exception as e:
        logger.error(f"Failed to stop frame extraction: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to stop frame extraction: {str(e)}")

@router.get("/status", response_model=ExtractionStatus)
async def get_frame_extraction_status():
    """
    Get the current status of frame extraction service
    
    Returns:
        Current extraction status
    """
    try:
        status = get_extraction_status()
        
        # Clean up completed tasks
        completed_tasks = [
            stream_id for stream_id, task in active_extraction_tasks.items() 
            if task.done()
        ]
        for stream_id in completed_tasks:
            del active_extraction_tasks[stream_id]
        
        # Add task information
        status['active_tasks'] = len(active_extraction_tasks)
        status['task_ids'] = list(active_extraction_tasks.keys())
        
        return ExtractionStatus(**status)
        
    except Exception as e:
        logger.error(f"Failed to get extraction status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get extraction status: {str(e)}")

@router.post("/single-frame", response_model=FrameData)
async def extract_single_frame_endpoint(request: SingleFrameRequest):
    """
    Extract a single frame from a video stream
    
    Args:
        request: Single frame extraction request
        
    Returns:
        Frame data including base64 encoded image and features
    """
    try:
        # Validate stream URL
        if not request.stream_url or not request.stream_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Invalid stream URL")
        
        # Extract single frame
        frame_data = await extract_single_frame(request.stream_url, request.timestamp)
        
        if not frame_data:
            raise HTTPException(status_code=404, detail="Failed to extract frame from stream")
        
        return FrameData(**frame_data)
        
    except HTTPException:
        raise
    except FrameExtractionError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Single frame extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Single frame extraction failed: {str(e)}")

@router.get("/stream/{stream_id}")
async def stream_frames(
    stream_id: str,
    stream_url: str = Query(..., description="URL of the video stream"),
    interval_seconds: float = Query(default=2.0, ge=0.1, le=60.0, description="Interval between frames"),
    max_frames: int = Query(default=100, ge=1, le=1000, description="Maximum frames to stream"),
    enhance_frames: bool = Query(default=True, description="Apply frame enhancement")
):
    """
    Stream frames from a video source in real-time
    
    Args:
        stream_id: Unique identifier for the stream
        stream_url: URL of the video stream
        interval_seconds: Interval between frame extractions
        max_frames: Maximum number of frames to stream
        enhance_frames: Whether to apply frame enhancement
        
    Returns:
        Server-sent events stream of frame data
    """
    try:
        # Validate stream URL
        if not stream_url or not stream_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="Invalid stream URL")
        
        config = {
            'interval_seconds': interval_seconds,
            'max_frames': max_frames,
            'enhance_frames': enhance_frames,
            'save_frames': False,
            'extract_features': True
        }
        
        async def generate_frame_stream():
            """Generate server-sent events for frame data"""
            try:
                async for frame_data in extract_frames_from_stream(stream_url, stream_id, config):
                    # Remove base64 data for streaming to reduce bandwidth
                    stream_data = frame_data.copy()
                    stream_data.pop('frame_base64', None)
                    
                    # Format as server-sent event
                    yield f"data: {json.dumps(stream_data)}\n\n"
                    
            except Exception as e:
                logger.error(f"Frame streaming error: {e}")
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
            finally:
                yield f"event: end\ndata: {json.dumps({'message': 'Stream ended'})}\n\n"
        
        return StreamingResponse(
            generate_frame_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Frame streaming setup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Frame streaming setup failed: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Health check endpoint for frame extraction service
    
    Returns:
        Service health status
    """
    try:
        status = get_extraction_status()
        return {
            "status": "healthy",
            "service": "frame_extraction",
            "active_extractions": status.get('active_extractions', 0),
            "cached_frames": status.get('cached_frames', 0)
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "frame_extraction",
            "error": str(e)
        }

# Background task function
async def _run_frame_extraction(stream_url: str, stream_id: str, config: Optional[Dict]):
    """
    Background task for running frame extraction
    
    Args:
        stream_url: URL of the video stream
        stream_id: Stream identifier
        config: Extraction configuration
    """
    try:
        logger.info(f"Background frame extraction started for stream {stream_id}")
        
        frame_count = 0
        async for frame_data in extract_frames_from_stream(stream_url, stream_id, config):
            frame_count += 1
            # Frame data is automatically cached by the extraction service
            
        logger.info(f"Background frame extraction completed for stream {stream_id}. Processed {frame_count} frames")
        
    except Exception as e:
        logger.error(f"Background frame extraction failed for stream {stream_id}: {e}")
    finally:
        # Clean up task reference
        if stream_id in active_extraction_tasks:
            del active_extraction_tasks[stream_id] 