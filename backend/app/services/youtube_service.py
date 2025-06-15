import yt_dlp
import asyncio
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse
import re
from loguru import logger

from ..models.stream import StreamMetadata, StreamInfo, StreamCategory, StreamStatus
from ..core.config import settings


class YouTubeService:
    """Service for interacting with YouTube streams using yt-dlp"""
    
    def __init__(self):
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'format': 'best[height<=720]',  # Limit quality for processing
            'noplaylist': True,
            'ignoreerrors': False,  # Don't ignore errors, we want to handle them
        }
    
    async def get_stream_metadata(self, url: str) -> Optional[StreamMetadata]:
        """Extract metadata from a YouTube URL"""
        try:
            # Run yt-dlp in a thread to avoid blocking
            loop = asyncio.get_event_loop()
            metadata = await loop.run_in_executor(
                None, self._extract_metadata, url
            )
            return metadata
        except Exception as e:
            logger.error(f"Error extracting metadata from {url}: {e}")
            return None
    
    def _extract_metadata(self, url: str) -> Optional[StreamMetadata]:
        """Synchronous metadata extraction"""
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    return None
                
                # Extract relevant information
                metadata = StreamMetadata(
                    id=info.get('id', ''),
                    title=info.get('title', ''),
                    description=info.get('description', ''),
                    uploader=info.get('uploader', ''),
                    uploader_id=info.get('uploader_id', ''),
                    upload_date=info.get('upload_date', ''),
                    duration=info.get('duration'),
                    view_count=info.get('view_count', 0),
                    like_count=info.get('like_count', 0),
                    thumbnail=info.get('thumbnail'),
                    webpage_url=info.get('webpage_url'),
                    is_live=info.get('is_live', False),
                    live_status=info.get('live_status'),
                    concurrent_view_count=info.get('concurrent_view_count', 0),
                    formats=info.get('formats', [])
                )
                
                # Extract best quality URLs
                if info.get('formats'):
                    best_video = self._get_best_format(info['formats'], 'video')
                    best_audio = self._get_best_format(info['formats'], 'audio')
                    
                    if best_video:
                        metadata.best_video_url = best_video.get('url')
                    if best_audio:
                        metadata.best_audio_url = best_audio.get('url')
                
                return metadata
                
        except Exception as e:
            logger.error(f"yt-dlp extraction failed for {url}: {e}")
            return None
    
    def _get_best_format(self, formats: List[Dict], format_type: str) -> Optional[Dict]:
        """Get the best format for video or audio"""
        if format_type == 'video':
            # Filter video formats and sort by quality
            video_formats = [f for f in formats if f.get('vcodec') != 'none' and f.get('vcodec') is not None]
            if video_formats:
                return max(video_formats, key=lambda x: x.get('height') or 0)
        elif format_type == 'audio':
            # Filter audio formats and sort by quality
            audio_formats = [f for f in formats if f.get('acodec') != 'none' and f.get('acodec') is not None]
            if audio_formats:
                return max(audio_formats, key=lambda x: x.get('abr') or 0)
        return None
    
    async def convert_to_stream_info(self, metadata: StreamMetadata, category: Optional[StreamCategory] = None) -> StreamInfo:
        """Convert YouTube metadata to our StreamInfo format"""
        
        # Auto-detect category if not provided
        if not category:
            category = self._detect_category(metadata.title, metadata.description or "")
        
        # Determine status
        status = StreamStatus.LIVE if metadata.is_live else StreamStatus.OFFLINE
        if metadata.live_status == "upcoming":
            status = StreamStatus.UPCOMING
        
        # Format viewer count
        viewer_count = metadata.concurrent_view_count or metadata.view_count or 0
        
        # Create StreamInfo
        stream_info = StreamInfo(
            id=metadata.id,
            title=metadata.title,
            description=metadata.description or "No description available",
            thumbnail=metadata.thumbnail or "https://via.placeholder.com/400x200/gray/white?text=No+Thumbnail",
            viewer_count=viewer_count,
            is_live=metadata.is_live,
            category=category,
            duration=self._format_duration(metadata.duration),
            status=status,
            uploader=metadata.uploader,
            stream_url=metadata.best_video_url,
            webpage_url=metadata.webpage_url
        )
        
        return stream_info
    
    def _detect_category(self, title: str, description: str) -> StreamCategory:
        """Auto-detect stream category based on title and description"""
        text = f"{title} {description}".lower()
        
        # Define keywords for each category
        category_keywords = {
            StreamCategory.SAFARI: ['safari', 'kruger', 'serengeti', 'africa', 'lion', 'elephant', 'rhino'],
            StreamCategory.AQUARIUM: ['aquarium', 'fish', 'coral', 'reef', 'underwater', 'marine life'],
            StreamCategory.BIRDS: ['bird', 'eagle', 'nest', 'hawk', 'owl', 'falcon', 'avian'],
            StreamCategory.ZOO: ['zoo', 'panda', 'tiger', 'bear', 'monkey', 'giraffe'],
            StreamCategory.MARINE: ['ocean', 'whale', 'dolphin', 'shark', 'sea', 'marine'],
            StreamCategory.WILDLIFE: ['wildlife', 'nature', 'wild', 'forest', 'jungle'],
            StreamCategory.CONSERVATION: ['conservation', 'rescue', 'sanctuary', 'rehabilitation']
        }
        
        # Score each category
        category_scores = {}
        for category, keywords in category_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                category_scores[category] = score
        
        # Return category with highest score, default to wildlife
        if category_scores:
            return max(category_scores, key=category_scores.get)
        return StreamCategory.WILDLIFE
    
    def _format_duration(self, duration: Optional[int]) -> Optional[str]:
        """Format duration in seconds to human readable string"""
        if not duration:
            return None
        
        hours = duration // 3600
        minutes = (duration % 3600) // 60
        seconds = duration % 60
        
        if hours > 0:
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        else:
            return f"{minutes}:{seconds:02d}"
    
    def is_valid_youtube_url(self, url: str) -> bool:
        """Check if URL is a valid YouTube URL"""
        youtube_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=[\w-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/live/[\w-]+',
            r'(?:https?://)?youtu\.be/[\w-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/channel/[\w-]+/live',
            r'(?:https?://)?(?:www\.)?youtube\.com/c/[\w-]+/live',
            r'(?:https?://)?(?:www\.)?youtube\.com/@[\w-]+/live'
        ]
        
        return any(re.match(pattern, url) for pattern in youtube_patterns)
    
    async def get_live_streams(self, channel_urls: List[str]) -> List[StreamInfo]:
        """Get live streams from multiple channels"""
        streams = []
        
        for url in channel_urls:
            try:
                metadata = await self.get_stream_metadata(url)
                if metadata and metadata.is_live:
                    stream_info = await self.convert_to_stream_info(metadata)
                    streams.append(stream_info)
            except Exception as e:
                logger.error(f"Error processing channel {url}: {e}")
        
        return streams


# Global service instance
youtube_service = YouTubeService() 