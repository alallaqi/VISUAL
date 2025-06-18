"""
Video Frame Extraction Service

This service handles extracting frames from video streams for AI analysis.
It supports both live streams and recorded videos, with configurable
extraction intervals and frame processing options.
"""

import asyncio
import io
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union, AsyncGenerator
import base64
import hashlib

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import aiofiles
import aiohttp

from ..core.config import settings

logger = logging.getLogger(__name__)

class FrameExtractionError(Exception):
    """Custom exception for frame extraction errors"""
    pass

class FrameProcessor:
    """Handles frame processing and enhancement for AI analysis"""
    
    def __init__(self):
        self.supported_formats = ['.jpg', '.jpeg', '.png', '.webp']
        
    def enhance_frame(self, frame: np.ndarray, enhance_config: Optional[Dict] = None) -> np.ndarray:
        """
        Enhance frame quality for better AI analysis
        
        Args:
            frame: Input frame as numpy array
            enhance_config: Configuration for enhancement parameters
            
        Returns:
            Enhanced frame as numpy array
        """
        if enhance_config is None:
            enhance_config = {
                'brightness': 1.1,
                'contrast': 1.2,
                'sharpness': 1.1,
                'denoise': True,
                'resize_target': (1280, 720)  # HD resolution for AI analysis
            }
        
        try:
            # Convert to PIL Image for enhancement
            if len(frame.shape) == 3:
                # BGR to RGB conversion for OpenCV frames
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            else:
                frame_rgb = frame
                
            pil_image = Image.fromarray(frame_rgb)
            
            # Resize if needed (maintain aspect ratio)
            if enhance_config.get('resize_target'):
                target_width, target_height = enhance_config['resize_target']
                pil_image.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)
            
            # Apply enhancements
            if enhance_config.get('brightness', 1.0) != 1.0:
                enhancer = ImageEnhance.Brightness(pil_image)
                pil_image = enhancer.enhance(enhance_config['brightness'])
                
            if enhance_config.get('contrast', 1.0) != 1.0:
                enhancer = ImageEnhance.Contrast(pil_image)
                pil_image = enhancer.enhance(enhance_config['contrast'])
                
            if enhance_config.get('sharpness', 1.0) != 1.0:
                enhancer = ImageEnhance.Sharpness(pil_image)
                pil_image = enhancer.enhance(enhance_config['sharpness'])
            
            # Apply denoising filter
            if enhance_config.get('denoise', False):
                pil_image = pil_image.filter(ImageFilter.MedianFilter(size=3))
            
            # Convert back to numpy array
            enhanced_frame = np.array(pil_image)
            
            # Convert back to BGR if needed for OpenCV compatibility
            if len(enhanced_frame.shape) == 3:
                enhanced_frame = cv2.cvtColor(enhanced_frame, cv2.COLOR_RGB2BGR)
                
            return enhanced_frame
            
        except Exception as e:
            logger.error(f"Frame enhancement failed: {e}")
            return frame  # Return original frame if enhancement fails
    
    def extract_frame_features(self, frame: np.ndarray) -> Dict:
        """
        Extract basic features from frame for analysis
        
        Args:
            frame: Input frame as numpy array
            
        Returns:
            Dictionary containing frame features
        """
        try:
            features = {
                'timestamp': datetime.utcnow().isoformat(),
                'shape': frame.shape,
                'mean_brightness': float(np.mean(frame)),
                'std_brightness': float(np.std(frame)),
            }
            
            # Color analysis (if color frame)
            if len(frame.shape) == 3:
                # Calculate color channel statistics
                features['color_channels'] = {
                    'blue': {'mean': float(np.mean(frame[:, :, 0])), 'std': float(np.std(frame[:, :, 0]))},
                    'green': {'mean': float(np.mean(frame[:, :, 1])), 'std': float(np.std(frame[:, :, 1]))},
                    'red': {'mean': float(np.mean(frame[:, :, 2])), 'std': float(np.std(frame[:, :, 2]))}
                }
                
                # Dominant color detection
                features['dominant_colors'] = self._get_dominant_colors(frame)
            
            # Motion detection preparation (edge detection)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
            edges = cv2.Canny(gray, 50, 150)
            features['edge_density'] = float(np.sum(edges > 0) / edges.size)
            
            return features
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return {'timestamp': datetime.utcnow().isoformat(), 'error': str(e)}
    
    def _get_dominant_colors(self, frame: np.ndarray, k: int = 3) -> List[List[int]]:
        """Extract dominant colors using K-means clustering"""
        try:
            # Reshape frame to be a list of pixels
            data = frame.reshape((-1, 3))
            data = np.float32(data)
            
            # Apply K-means clustering
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
            _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
            
            # Convert centers to integers and return as list
            centers = np.uint8(centers)
            return centers.tolist()
            
        except Exception as e:
            logger.error(f"Dominant color extraction failed: {e}")
            return []

class VideoFrameExtractor:
    """Main class for extracting frames from video streams"""
    
    def __init__(self):
        self.processor = FrameProcessor()
        self.active_extractions: Dict[str, bool] = {}
        self.frame_cache: Dict[str, Dict] = {}
        self.max_cache_size = 100
        
        # Create frames directory if it doesn't exist
        self.frames_dir = Path("frames")
        self.frames_dir.mkdir(exist_ok=True)
    
    async def extract_frames_from_stream(
        self,
        stream_url: str,
        stream_id: str,
        extraction_config: Optional[Dict] = None
    ) -> AsyncGenerator[Dict, None]:
        """
        Extract frames from a video stream asynchronously
        
        Args:
            stream_url: URL of the video stream
            stream_id: Unique identifier for the stream
            extraction_config: Configuration for frame extraction
            
        Yields:
            Dictionary containing frame data and metadata
        """
        if extraction_config is None:
            extraction_config = {
                'interval_seconds': 2.0,  # Extract frame every 2 seconds
                'max_frames': 1000,       # Maximum frames to extract
                'enhance_frames': True,   # Apply frame enhancement
                'save_frames': False,     # Save frames to disk
                'extract_features': True  # Extract frame features
            }
        
        extraction_id = f"{stream_id}_{int(time.time())}"
        self.active_extractions[extraction_id] = True
        
        logger.info(f"Starting frame extraction for stream {stream_id}")
        
        try:
            # Initialize video capture
            cap = cv2.VideoCapture(stream_url)
            
            if not cap.isOpened():
                raise FrameExtractionError(f"Failed to open video stream: {stream_url}")
            
            # Get stream properties
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            frame_interval = int(fps * extraction_config['interval_seconds'])
            frame_count = 0
            extracted_count = 0
            
            logger.info(f"Stream FPS: {fps}, Frame interval: {frame_interval}")
            
            while (self.active_extractions.get(extraction_id, False) and 
                   extracted_count < extraction_config['max_frames']):
                
                ret, frame = cap.read()
                
                if not ret:
                    logger.warning("Failed to read frame, stream may have ended")
                    break
                
                # Extract frame at specified interval
                if frame_count % frame_interval == 0:
                    try:
                        frame_data = await self._process_frame(
                            frame, 
                            stream_id, 
                            extracted_count,
                            extraction_config
                        )
                        
                        if frame_data:
                            yield frame_data
                            extracted_count += 1
                            
                    except Exception as e:
                        logger.error(f"Frame processing error: {e}")
                        continue
                
                frame_count += 1
                
                # Small delay to prevent overwhelming the system
                await asyncio.sleep(0.01)
            
        except Exception as e:
            logger.error(f"Frame extraction error for stream {stream_id}: {e}")
            raise FrameExtractionError(f"Frame extraction failed: {e}")
            
        finally:
            # Cleanup
            if 'cap' in locals():
                cap.release()
            self.active_extractions.pop(extraction_id, None)
            logger.info(f"Frame extraction completed for stream {stream_id}. Extracted {extracted_count} frames")
    
    async def _process_frame(
        self, 
        frame: np.ndarray, 
        stream_id: str, 
        frame_number: int,
        config: Dict
    ) -> Optional[Dict]:
        """
        Process a single frame according to configuration
        
        Args:
            frame: The frame to process
            stream_id: Stream identifier
            frame_number: Frame sequence number
            config: Processing configuration
            
        Returns:
            Dictionary containing processed frame data
        """
        try:
            frame_id = f"{stream_id}_frame_{frame_number}"
            timestamp = datetime.utcnow()
            
            # Enhance frame if requested
            processed_frame = frame
            if config.get('enhance_frames', False):
                processed_frame = self.processor.enhance_frame(frame)
            
            # Extract features if requested
            features = {}
            if config.get('extract_features', False):
                features = self.processor.extract_frame_features(processed_frame)
            
            # Convert frame to base64 for transmission
            frame_base64 = self._frame_to_base64(processed_frame)
            
            # Save frame to disk if requested
            frame_path = None
            if config.get('save_frames', False):
                frame_path = await self._save_frame(processed_frame, frame_id)
            
            frame_data = {
                'frame_id': frame_id,
                'stream_id': stream_id,
                'frame_number': frame_number,
                'timestamp': timestamp.isoformat(),
                'frame_base64': frame_base64,
                'frame_path': str(frame_path) if frame_path else None,
                'features': features,
                'processing_config': config
            }
            
            # Cache frame data
            self._cache_frame_data(frame_id, frame_data)
            
            return frame_data
            
        except Exception as e:
            logger.error(f"Frame processing failed: {e}")
            return None
    
    def _frame_to_base64(self, frame: np.ndarray, format: str = 'JPEG') -> str:
        """Convert frame to base64 string"""
        try:
            # Encode frame as JPEG
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            
            # Convert to base64
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            return frame_base64
            
        except Exception as e:
            logger.error(f"Frame to base64 conversion failed: {e}")
            return ""
    
    async def _save_frame(self, frame: np.ndarray, frame_id: str) -> Optional[Path]:
        """Save frame to disk"""
        try:
            frame_path = self.frames_dir / f"{frame_id}.jpg"
            
            # Save frame asynchronously
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
            
            async with aiofiles.open(frame_path, 'wb') as f:
                await f.write(buffer.tobytes())
            
            return frame_path
            
        except Exception as e:
            logger.error(f"Frame saving failed: {e}")
            return None
    
    def _cache_frame_data(self, frame_id: str, frame_data: Dict):
        """Cache frame data with size limit"""
        # Remove oldest entries if cache is full
        if len(self.frame_cache) >= self.max_cache_size:
            # Remove oldest entry
            oldest_key = next(iter(self.frame_cache))
            del self.frame_cache[oldest_key]
        
        # Remove base64 data from cache to save memory
        cached_data = frame_data.copy()
        cached_data.pop('frame_base64', None)
        
        self.frame_cache[frame_id] = cached_data
    
    def stop_extraction(self, stream_id: str):
        """Stop frame extraction for a specific stream"""
        keys_to_remove = [key for key in self.active_extractions.keys() if key.startswith(stream_id)]
        for key in keys_to_remove:
            self.active_extractions[key] = False
        
        logger.info(f"Stopped frame extraction for stream {stream_id}")
    
    def get_cached_frame_data(self, frame_id: str) -> Optional[Dict]:
        """Retrieve cached frame data"""
        return self.frame_cache.get(frame_id)
    
    def get_extraction_status(self) -> Dict:
        """Get status of all active extractions"""
        return {
            'active_extractions': len([v for v in self.active_extractions.values() if v]),
            'cached_frames': len(self.frame_cache),
            'extraction_ids': list(self.active_extractions.keys())
        }
    
    async def extract_single_frame(self, stream_url: str, timestamp: Optional[float] = None) -> Optional[Dict]:
        """
        Extract a single frame from a video stream
        
        Args:
            stream_url: URL of the video stream
            timestamp: Specific timestamp to extract (seconds), None for current frame
            
        Returns:
            Dictionary containing frame data
        """
        try:
            cap = cv2.VideoCapture(stream_url)
            
            if not cap.isOpened():
                raise FrameExtractionError(f"Failed to open video stream: {stream_url}")
            
            # Seek to specific timestamp if provided
            if timestamp is not None:
                cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
            
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                raise FrameExtractionError("Failed to read frame from stream")
            
            # Process the frame
            frame_data = await self._process_frame(
                frame, 
                f"single_{int(time.time())}", 
                0,
                {'enhance_frames': True, 'extract_features': True, 'save_frames': False}
            )
            
            return frame_data
            
        except Exception as e:
            logger.error(f"Single frame extraction failed: {e}")
            raise FrameExtractionError(f"Single frame extraction failed: {e}")

# Global instance
frame_extractor = VideoFrameExtractor()

async def extract_frames_from_stream(
    stream_url: str,
    stream_id: str,
    extraction_config: Optional[Dict] = None
) -> AsyncGenerator[Dict, None]:
    """
    Convenience function for frame extraction
    
    Args:
        stream_url: URL of the video stream
        stream_id: Unique identifier for the stream
        extraction_config: Configuration for frame extraction
        
    Yields:
        Dictionary containing frame data and metadata
    """
    async for frame_data in frame_extractor.extract_frames_from_stream(
        stream_url, stream_id, extraction_config
    ):
        yield frame_data

async def extract_single_frame(stream_url: str, timestamp: Optional[float] = None) -> Optional[Dict]:
    """
    Convenience function for single frame extraction
    
    Args:
        stream_url: URL of the video stream
        timestamp: Specific timestamp to extract (seconds)
        
    Returns:
        Dictionary containing frame data
    """
    return await frame_extractor.extract_single_frame(stream_url, timestamp)

def stop_stream_extraction(stream_id: str):
    """
    Convenience function to stop frame extraction
    
    Args:
        stream_id: Stream identifier to stop
    """
    frame_extractor.stop_extraction(stream_id)

def get_extraction_status() -> Dict:
    """
    Get status of frame extraction service
    
    Returns:
        Dictionary containing extraction status
    """
    return frame_extractor.get_extraction_status() 