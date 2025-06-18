from typing import Optional, List, Dict, Any
from pydantic import BaseModel, HttpUrl, field_validator, Field, ConfigDict
from datetime import datetime
from enum import Enum


class StreamStatus(str, Enum):
    LIVE = "live"
    OFFLINE = "offline"
    UPCOMING = "upcoming"
    ERROR = "error"


class StreamCategory(str, Enum):
    SAFARI = "safari"
    AQUARIUM = "aquarium"
    BIRDS = "birds"
    ZOO = "zoo"
    WILDLIFE = "wildlife"
    MARINE = "marine"
    NATURE = "nature"
    CONSERVATION = "conservation"


class StreamQuality(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    BEST = "best"


class StreamMetadata(BaseModel):
    """Basic stream metadata from yt-dlp"""
    model_config = ConfigDict(use_enum_values=True)
    
    id: str
    title: str
    description: Optional[str] = None
    uploader: Optional[str] = None
    uploader_id: Optional[str] = None
    upload_date: Optional[str] = None
    duration: Optional[int] = None
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    thumbnail: Optional[HttpUrl] = None
    webpage_url: Optional[HttpUrl] = None
    
    # Live stream specific
    is_live: bool = False
    live_status: Optional[str] = None
    concurrent_view_count: Optional[int] = None
    
    # Video quality info
    formats: Optional[List[Dict[str, Any]]] = None
    best_video_url: Optional[HttpUrl] = None
    best_audio_url: Optional[HttpUrl] = None


class StreamInfo(BaseModel):
    """Enhanced stream information for our application"""
    model_config = ConfigDict(
        populate_by_name=True,
        use_enum_values=True
    )
    
    id: str
    title: str
    description: str
    thumbnail: HttpUrl
    viewer_count: int = 0
    is_live: bool = False
    category: StreamCategory
    duration: Optional[str] = None
    status: StreamStatus = StreamStatus.OFFLINE
    
    # Enhanced metadata
    uploader: Optional[str] = None
    upload_date: Optional[datetime] = None
    last_updated: datetime = Field(default_factory=datetime.now)
    
    # Processing status
    is_processing: bool = False
    narration_enabled: bool = False
    
    # URLs
    hls_url: Optional[HttpUrl] = None
    webpage_url: Optional[HttpUrl] = None
    
    @field_validator('viewer_count', mode='before')
    @classmethod
    def validate_viewer_count(cls, v):
        return max(0, v or 0)


class StreamRequest(BaseModel):
    """Request model for adding/updating streams"""
    url: HttpUrl
    category: Optional[StreamCategory] = None
    custom_title: Optional[str] = None
    custom_description: Optional[str] = None


class StreamResponse(BaseModel):
    """Response model for stream operations"""
    success: bool
    message: str
    stream: Optional[StreamInfo] = None
    error: Optional[str] = None


class StreamListResponse(BaseModel):
    """Response model for listing streams"""
    streams: List[StreamInfo]
    total: int
    page: int = 1
    per_page: int = 20
    has_next: bool = False
    has_prev: bool = False


class DetectionResult(BaseModel):
    """Object detection result for a frame"""
    class_name: str
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]
    timestamp: datetime


class FrameAnalysis(BaseModel):
    """Analysis result for a video frame"""
    stream_id: str
    frame_timestamp: float
    detections: List[DetectionResult]
    frame_path: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.now)


class NarrationRequest(BaseModel):
    """Request for generating narration"""
    stream_id: str
    style: str = "field-scientist"
    detections: List[DetectionResult]
    context: Optional[str] = None


class NarrationResponse(BaseModel):
    """Generated narration response"""
    stream_id: str
    text: str
    style: str
    timestamp: datetime = Field(default_factory=datetime.now)
    confidence: float = 1.0 