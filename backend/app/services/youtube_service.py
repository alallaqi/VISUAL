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
        # Enhanced yt-dlp options based on Context7 documentation and live stream analysis
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'noplaylist': True,
            'ignoreerrors': False,
            'geo_bypass': True,
            # Enhanced YouTube-specific options for better live stream extraction
            'extractor_args': {
                'youtube': {
                    'player_client': ['web', 'ios', 'android'],  # Try multiple clients for reliability
                    'player_skip': [],  # Don't skip any requests for live streams
                    'formats': ['complete'],  # Get complete format information
                }
            },
            # Live stream optimizations
            'format': 'best[ext=m3u8]/best[protocol^=m3u8]/best[protocol*=hls]/best',  # Prefer HLS for live
            'youtube_include_dash_manifest': False,  # Prefer HLS over DASH for live streams
            'hls_prefer_native': True,  # Use native HLS when available
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
                # Extract info without downloading
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    logger.error(f"No info extracted from {url}")
                    return None
                
                logger.info(f"Extracted info for: {info.get('title', 'Unknown')}")
                logger.info(f"Is live: {info.get('is_live', False)}")
                logger.info(f"Live status: {info.get('live_status', 'unknown')}")
                
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
                
                # Extract HLS URL for live streams
                hls_url = self._extract_hls_url(info)
                if hls_url:
                    metadata.best_video_url = hls_url
                    logger.info(f"Found HLS URL: {hls_url}")
                else:
                    # Fallback to best format URL
                    best_format = self._get_best_format(info.get('formats', []))
                    if best_format:
                        metadata.best_video_url = best_format.get('url')
                        logger.info(f"Using best format URL: {metadata.best_video_url}")
                
                return metadata
                
        except Exception as e:
            logger.error(f"yt-dlp extraction failed for {url}: {e}")
            return None
    
    def _extract_hls_url(self, info: Dict[str, Any]) -> Optional[str]:
        """Extract HLS manifest URL from yt-dlp info using enhanced detection"""
        formats = info.get('formats', [])
        
        # Enhanced HLS detection based on successful live stream analysis
        hls_formats = []
        for fmt in formats:
            protocol = fmt.get('protocol', '').lower()
            ext = fmt.get('ext', '').lower()
            format_note = fmt.get('format_note', '').lower()
            url = fmt.get('url', '')
            
            # Multiple ways to identify HLS formats
            if (ext == 'm3u8' or 
                'hls' in protocol or 
                'm3u8' in url or 
                'm3u8_native' in protocol):
                hls_formats.append(fmt)
        
        if hls_formats:
            # For live streams, prefer formats with higher quality and bitrate
            if info.get('is_live', False):
                # Sort by height (resolution), then by total bitrate for live streams
                best_hls = max(
                    hls_formats, 
                    key=lambda x: (
                        x.get('height', 0), 
                        x.get('tbr', 0),  # Total bitrate
                        x.get('quality', 0)
                    )
                )
                logger.info(f"Selected live HLS format: {best_hls.get('format_id')} "
                          f"({best_hls.get('height', 'N/A')}p @ {best_hls.get('tbr', 'N/A')}kbps)")
                return best_hls.get('url')
            
            # For non-live content, prefer by quality
            best_hls = max(hls_formats, key=lambda x: (x.get('height', 0), x.get('quality', 0)))
            return best_hls.get('url')
        
        # Fallback to main URL if available
        if info.get('url'):
            return info['url']
        
        logger.warning("No HLS formats found in stream")
        return None
    
    def _get_best_format(self, formats: List[Dict]) -> Optional[Dict]:
        """Get the best overall format"""
        if not formats:
            return None
        
        # Filter out audio-only formats
        video_formats = [f for f in formats if f.get('vcodec') != 'none']
        
        if video_formats:
            # Sort by quality (height, then quality score)
            return max(video_formats, key=lambda x: (x.get('height', 0), x.get('quality', 0)))
        
        # If no video formats, return best audio
        audio_formats = [f for f in formats if f.get('acodec') != 'none']
        if audio_formats:
            return max(audio_formats, key=lambda x: x.get('abr', 0))
        
        # Last resort: return first format
        return formats[0] if formats else None
    
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
            hls_url=metadata.best_video_url,
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