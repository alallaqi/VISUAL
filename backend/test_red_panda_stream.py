#!/usr/bin/env python3
"""
Advanced Red Panda Live Stream Analysis using yt-dlp
Based on Context7 documentation for optimal live stream extraction
"""

import asyncio
import yt_dlp
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from loguru import logger

# Red Panda stream URL from your add_stream.py
# RED_PANDA_URL = "https://www.youtube.com/watch?v=Ihr_nwydXi0"  # OFFLINE

# Active Namibia desert stream (found by wildlife stream finder)
RED_PANDA_URL = "https://www.youtube.com/watch?v=ydYDqZQpim8"

class AdvancedYouTubeAnalyzer:
    def __init__(self):
        # Advanced yt-dlp options based on Context7 documentation
        self.base_opts = {
            'quiet': False,  # Enable logging for debugging
            'no_warnings': False,
            'extract_flat': False,
            'noplaylist': True,
            'ignoreerrors': False,
            'geo_bypass': True,
            # YouTube-specific optimizations from Context7 docs
            'extractor_args': {
                'youtube': {
                    'player_client': ['web', 'ios', 'android'],  # Try multiple clients
                    'player_skip': [],  # Don't skip any requests for live streams
                    'formats': ['complete'],  # Get complete format info
                }
            }
        }
    
    def get_info_opts(self) -> Dict[str, Any]:
        """Options for info extraction only"""
        return {
            **self.base_opts,
            'format': 'best',  # Don't specify format for info extraction
        }
    
    def get_live_opts(self) -> Dict[str, Any]:
        """Optimized options for live stream extraction"""
        return {
            **self.base_opts,
            # Live stream specific formats - prefer HLS for live content
            'format': 'best[ext=m3u8]/best[protocol^=m3u8]/best[protocol*=hls]/best',
            'youtube_include_dash_manifest': False,  # Prefer HLS over DASH for live
            'hls_prefer_native': True,  # Use native HLS when available
        }
    
    async def analyze_stream_info(self, url: str) -> Optional[Dict[str, Any]]:
        """Extract comprehensive stream information"""
        logger.info(f"🔍 Analyzing stream: {url}")
        
        try:
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(
                None, self._extract_info_sync, url
            )
            return info
        except Exception as e:
            logger.error(f"❌ Failed to analyze stream: {e}")
            return None
    
    def _extract_info_sync(self, url: str) -> Dict[str, Any]:
        """Synchronous info extraction with advanced options"""
        with yt_dlp.YoutubeDL(self.get_info_opts()) as ydl:
            # Extract info without downloading
            info = ydl.extract_info(url, download=False)
            return info
    
    async def get_live_formats(self, url: str) -> List[Dict[str, Any]]:
        """Get all available live stream formats"""
        logger.info(f"🎥 Extracting live formats for: {url}")
        
        try:
            loop = asyncio.get_event_loop()
            formats = await loop.run_in_executor(
                None, self._extract_live_formats_sync, url
            )
            return formats
        except Exception as e:
            logger.error(f"❌ Failed to extract live formats: {e}")
            return []
    
    def _extract_live_formats_sync(self, url: str) -> List[Dict[str, Any]]:
        """Extract live formats synchronously"""
        with yt_dlp.YoutubeDL(self.get_live_opts()) as ydl:
            info = ydl.extract_info(url, download=False)
            return info.get('formats', [])
    
    def analyze_formats(self, formats: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze available formats for live streaming"""
        analysis = {
            'total_formats': len(formats),
            'hls_formats': [],
            'dash_formats': [],
            'direct_formats': [],
            'live_formats': [],
            'best_hls': None,
            'recommended_format': None
        }
        
        for fmt in formats:
            # Categorize formats
            protocol = fmt.get('protocol', '').lower()
            ext = fmt.get('ext', '').lower()
            format_note = fmt.get('format_note', '').lower()
            url = fmt.get('url', '')
            
            # HLS formats (m3u8)
            if ext == 'm3u8' or 'hls' in protocol or 'm3u8' in url:
                analysis['hls_formats'].append(fmt)
                if 'live' in format_note:
                    analysis['live_formats'].append(fmt)
            
            # DASH formats
            elif 'dash' in protocol or 'mpd' in ext:
                analysis['dash_formats'].append(fmt)
            
            # Direct formats
            else:
                analysis['direct_formats'].append(fmt)
        
        # Find best HLS format for live streaming
        if analysis['hls_formats']:
            # Prefer live HLS formats
            live_hls = [f for f in analysis['hls_formats'] if 'live' in f.get('format_note', '').lower()]
            
            if live_hls:
                # Sort by quality (height, then quality score)
                analysis['best_hls'] = max(
                    live_hls, 
                    key=lambda x: (x.get('height', 0), x.get('quality', 0), x.get('tbr', 0))
                )
            else:
                # Fallback to best HLS format
                analysis['best_hls'] = max(
                    analysis['hls_formats'],
                    key=lambda x: (x.get('height', 0), x.get('quality', 0), x.get('tbr', 0))
                )
        
        # Determine recommended format
        if analysis['best_hls']:
            analysis['recommended_format'] = analysis['best_hls']
        elif analysis['hls_formats']:
            analysis['recommended_format'] = analysis['hls_formats'][0]
        elif formats:
            analysis['recommended_format'] = formats[0]
        
        return analysis
    
    def print_stream_summary(self, info: Dict[str, Any]):
        """Print comprehensive stream summary"""
        print("\n" + "="*60)
        print("🦊 RED PANDA STREAM ANALYSIS")
        print("="*60)
        
        # Basic info
        print(f"📺 Title: {info.get('title', 'N/A')}")
        print(f"👤 Uploader: {info.get('uploader', 'N/A')}")
        print(f"🆔 Video ID: {info.get('id', 'N/A')}")
        print(f"🔗 URL: {info.get('webpage_url', 'N/A')}")
        
        # Live status
        is_live = info.get('is_live', False)
        live_status = info.get('live_status', 'unknown')
        print(f"📡 Live Status: {'🔴 LIVE' if is_live else '⭕ NOT LIVE'} ({live_status})")
        
        if is_live:
            concurrent_viewers = info.get('concurrent_view_count', 0)
            print(f"👥 Concurrent Viewers: {concurrent_viewers:,}")
        
        # View stats
        view_count = info.get('view_count', 0)
        like_count = info.get('like_count', 0)
        print(f"👀 Total Views: {view_count:,}")
        print(f"👍 Likes: {like_count:,}")
        
        # Duration
        duration = info.get('duration')
        if duration:
            hours, remainder = divmod(duration, 3600)
            minutes, seconds = divmod(remainder, 60)
            print(f"⏱️  Duration: {hours:02d}:{minutes:02d}:{seconds:02d}")
        else:
            print("⏱️  Duration: Live Stream (ongoing)")
        
        # Thumbnail
        thumbnail = info.get('thumbnail')
        if thumbnail:
            print(f"🖼️  Thumbnail: {thumbnail}")
    
    def print_format_analysis(self, analysis: Dict[str, Any]):
        """Print detailed format analysis"""
        print("\n" + "="*60)
        print("🎥 FORMAT ANALYSIS")
        print("="*60)
        
        print(f"📊 Total Formats: {analysis['total_formats']}")
        print(f"🎬 HLS Formats: {len(analysis['hls_formats'])}")
        print(f"⚡ DASH Formats: {len(analysis['dash_formats'])}")
        print(f"🔗 Direct Formats: {len(analysis['direct_formats'])}")
        print(f"📡 Live Formats: {len(analysis['live_formats'])}")
        
        # Best HLS format details
        if analysis['best_hls']:
            fmt = analysis['best_hls']
            print(f"\n🏆 RECOMMENDED FORMAT (Best HLS):")
            print(f"   Format ID: {fmt.get('format_id', 'N/A')}")
            print(f"   Quality: {fmt.get('height', 'N/A')}p")
            print(f"   Protocol: {fmt.get('protocol', 'N/A')}")
            print(f"   Extension: {fmt.get('ext', 'N/A')}")
            print(f"   Bitrate: {fmt.get('tbr', 'N/A')} kbps")
            print(f"   Note: {fmt.get('format_note', 'N/A')}")
            print(f"   URL: {fmt.get('url', 'N/A')[:100]}...")
        
        # Show top 5 HLS formats
        if analysis['hls_formats']:
            print(f"\n📋 TOP HLS FORMATS:")
            sorted_hls = sorted(
                analysis['hls_formats'], 
                key=lambda x: (x.get('height', 0), x.get('tbr', 0)), 
                reverse=True
            )[:5]
            
            for i, fmt in enumerate(sorted_hls, 1):
                quality = fmt.get('height', 'N/A')
                bitrate = fmt.get('tbr', 'N/A')
                note = fmt.get('format_note', 'N/A')
                print(f"   {i}. {quality}p @ {bitrate}kbps ({note})")

async def main():
    """Main analysis function"""
    print("🚀 Starting Advanced Red Panda Stream Analysis")
    print(f"🎯 Target URL: {RED_PANDA_URL}")
    print(f"⏰ Analysis Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    analyzer = AdvancedYouTubeAnalyzer()
    
    # Step 1: Extract stream info
    print("\n🔍 Step 1: Extracting stream information...")
    info = await analyzer.analyze_stream_info(RED_PANDA_URL)
    
    if not info:
        print("❌ Failed to extract stream information")
        return
    
    # Step 2: Print stream summary
    analyzer.print_stream_summary(info)
    
    # Step 3: Analyze formats
    print("\n🎥 Step 2: Analyzing available formats...")
    formats = info.get('formats', [])
    
    if not formats:
        print("⚠️  No formats found in stream info")
        return
    
    analysis = analyzer.analyze_formats(formats)
    analyzer.print_format_analysis(analysis)
    
    # Step 4: Test recommended format
    if analysis['recommended_format']:
        print("\n🧪 Step 3: Testing recommended format...")
        recommended = analysis['recommended_format']
        test_url = recommended.get('url')
        
        if test_url:
            print(f"✅ Recommended HLS URL: {test_url}")
            print("💡 This URL can be used in your video player for live streaming")
        else:
            print("⚠️  No URL found in recommended format")
    
    # Step 5: Save detailed analysis
    print("\n💾 Step 4: Saving detailed analysis...")
    output_file = f"red_panda_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    analysis_data = {
        'timestamp': datetime.now().isoformat(),
        'url': RED_PANDA_URL,
        'stream_info': {
            'title': info.get('title'),
            'uploader': info.get('uploader'),
            'id': info.get('id'),
            'is_live': info.get('is_live'),
            'live_status': info.get('live_status'),
            'concurrent_view_count': info.get('concurrent_view_count'),
            'view_count': info.get('view_count'),
            'thumbnail': info.get('thumbnail'),
        },
        'format_analysis': {
            'total_formats': analysis['total_formats'],
            'hls_count': len(analysis['hls_formats']),
            'dash_count': len(analysis['dash_formats']),
            'live_count': len(analysis['live_formats']),
            'recommended_format': analysis['recommended_format'],
        }
    }
    
    try:
        with open(output_file, 'w') as f:
            json.dump(analysis_data, f, indent=2, default=str)
        print(f"✅ Analysis saved to: {output_file}")
    except Exception as e:
        print(f"⚠️  Failed to save analysis: {e}")
    
    print("\n🎉 Analysis Complete!")
    print("\n💡 NEXT STEPS:")
    print("1. Use the recommended HLS URL in your video player")
    print("2. Update your YouTubeService to prioritize live HLS formats")
    print("3. Test the stream in your frontend application")

if __name__ == "__main__":
    asyncio.run(main()) 