from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse

from ...models.stream import (
    StreamInfo, StreamRequest, StreamResponse, StreamListResponse,
    StreamCategory, StreamStatus
)
from ...services.youtube_service import youtube_service
from ...core.config import settings

router = APIRouter(prefix="/streams", tags=["streams"])

# In-memory storage for demo (replace with database later)
streams_db: List[StreamInfo] = []


@router.get("/", response_model=StreamListResponse)
async def list_streams(
    category: Optional[StreamCategory] = Query(None, description="Filter by category"),
    status: Optional[StreamStatus] = Query(None, description="Filter by status"),
    is_live: Optional[bool] = Query(None, description="Filter by live status"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page")
):
    """List all available streams with optional filtering"""
    
    # Filter streams
    filtered_streams = streams_db.copy()
    
    if category:
        filtered_streams = [s for s in filtered_streams if s.category == category]
    
    if status:
        filtered_streams = [s for s in filtered_streams if s.status == status]
    
    if is_live is not None:
        filtered_streams = [s for s in filtered_streams if s.is_live == is_live]
    
    # Pagination
    total = len(filtered_streams)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_streams = filtered_streams[start_idx:end_idx]
    
    return StreamListResponse(
        streams=paginated_streams,
        total=total,
        page=page,
        per_page=per_page,
        has_next=end_idx < total,
        has_prev=page > 1
    )


@router.get("/{stream_id}", response_model=StreamInfo)
async def get_stream(stream_id: str):
    """Get a specific stream by ID"""
    
    stream = next((s for s in streams_db if s.id == stream_id), None)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    return stream


@router.post("/", response_model=StreamResponse)
async def add_stream(stream_request: StreamRequest, background_tasks: BackgroundTasks):
    """Add a new stream from YouTube URL"""
    
    # Validate YouTube URL
    if not youtube_service.is_valid_youtube_url(str(stream_request.url)):
        return StreamResponse(
            success=False,
            message="Invalid YouTube URL",
            error="The provided URL is not a valid YouTube URL"
        )
    
    try:
        # Extract metadata
        metadata = await youtube_service.get_stream_metadata(str(stream_request.url))
        if not metadata:
            return StreamResponse(
                success=False,
                message="Failed to extract stream metadata",
                error="Could not retrieve information from the provided URL"
            )
        
        # Check if stream already exists
        existing_stream = next((s for s in streams_db if s.id == metadata.id), None)
        if existing_stream:
            return StreamResponse(
                success=False,
                message="Stream already exists",
                error=f"Stream with ID {metadata.id} is already in the database",
                stream=existing_stream
            )
        
        # Convert to StreamInfo
        category = stream_request.category
        stream_info = await youtube_service.convert_to_stream_info(metadata, category)
        
        # Override with custom title/description if provided
        if stream_request.custom_title:
            stream_info.title = stream_request.custom_title
        if stream_request.custom_description:
            stream_info.description = stream_request.custom_description
        
        # Add to database
        streams_db.append(stream_info)
        
        return StreamResponse(
            success=True,
            message="Stream added successfully",
            stream=stream_info
        )
        
    except Exception as e:
        return StreamResponse(
            success=False,
            message="Error processing stream",
            error=str(e)
        )


@router.put("/{stream_id}", response_model=StreamResponse)
async def update_stream(stream_id: str, stream_request: StreamRequest):
    """Update an existing stream"""
    
    stream_idx = next((i for i, s in enumerate(streams_db) if s.id == stream_id), None)
    if stream_idx is None:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    try:
        # Get fresh metadata
        metadata = await youtube_service.get_stream_metadata(str(stream_request.url))
        if not metadata:
            return StreamResponse(
                success=False,
                message="Failed to extract updated stream metadata",
                error="Could not retrieve updated information from the provided URL"
            )
        
        # Update stream info
        category = stream_request.category or streams_db[stream_idx].category
        updated_stream = await youtube_service.convert_to_stream_info(metadata, category)
        
        # Override with custom title/description if provided
        if stream_request.custom_title:
            updated_stream.title = stream_request.custom_title
        if stream_request.custom_description:
            updated_stream.description = stream_request.custom_description
        
        # Preserve processing status
        updated_stream.is_processing = streams_db[stream_idx].is_processing
        updated_stream.narration_enabled = streams_db[stream_idx].narration_enabled
        
        # Update in database
        streams_db[stream_idx] = updated_stream
        
        return StreamResponse(
            success=True,
            message="Stream updated successfully",
            stream=updated_stream
        )
        
    except Exception as e:
        return StreamResponse(
            success=False,
            message="Error updating stream",
            error=str(e)
        )


@router.delete("/{stream_id}", response_model=StreamResponse)
async def delete_stream(stream_id: str):
    """Delete a stream"""
    
    stream_idx = next((i for i, s in enumerate(streams_db) if s.id == stream_id), None)
    if stream_idx is None:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    deleted_stream = streams_db.pop(stream_idx)
    
    return StreamResponse(
        success=True,
        message="Stream deleted successfully",
        stream=deleted_stream
    )


@router.post("/{stream_id}/refresh", response_model=StreamResponse)
async def refresh_stream(stream_id: str):
    """Refresh stream metadata from YouTube"""
    
    stream_idx = next((i for i, s in enumerate(streams_db) if s.id == stream_id), None)
    if stream_idx is None:
        raise HTTPException(status_code=404, detail="Stream not found")
    
    current_stream = streams_db[stream_idx]
    
    try:
        # Get fresh metadata using the webpage URL
        if not current_stream.webpage_url:
            return StreamResponse(
                success=False,
                message="Cannot refresh stream",
                error="No webpage URL available for this stream"
            )
        
        metadata = await youtube_service.get_stream_metadata(str(current_stream.webpage_url))
        if not metadata:
            return StreamResponse(
                success=False,
                message="Failed to refresh stream metadata",
                error="Could not retrieve updated information from YouTube"
            )
        
        # Update stream info while preserving custom settings
        refreshed_stream = await youtube_service.convert_to_stream_info(metadata, current_stream.category)
        
        # Preserve custom settings
        refreshed_stream.is_processing = current_stream.is_processing
        refreshed_stream.narration_enabled = current_stream.narration_enabled
        
        # Update in database
        streams_db[stream_idx] = refreshed_stream
        
        return StreamResponse(
            success=True,
            message="Stream refreshed successfully",
            stream=refreshed_stream
        )
        
    except Exception as e:
        return StreamResponse(
            success=False,
            message="Error refreshing stream",
            error=str(e)
        )


@router.get("/categories/", response_model=List[str])
async def get_categories():
    """Get all available stream categories"""
    return [category.value for category in StreamCategory]


@router.post("/bulk-add", response_model=List[StreamResponse])
async def bulk_add_streams(urls: List[str]):
    """Add multiple streams from a list of YouTube URLs"""
    
    results = []
    
    for url in urls:
        try:
            stream_request = StreamRequest(url=url)
            result = await add_stream(stream_request, BackgroundTasks())
            results.append(result)
        except Exception as e:
            results.append(StreamResponse(
                success=False,
                message=f"Error processing URL: {url}",
                error=str(e)
            ))
    
    return results 