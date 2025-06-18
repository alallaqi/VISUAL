#!/usr/bin/env python3
"""
Find Active Wildlife Live Streams
This script searches for currently active wildlife live streams on YouTube
"""

import asyncio
import yt_dlp
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from loguru import logger

# List of popular wildlife stream channels and URLs to check
WILDLIFE_STREAM_CANDIDATES = [
    # EXPLORE.org channels (reliable wildlife streams)
    "https://www.youtube.com/watch?v=ydYDqZQpim8",  # African Wildlife
    "https://www.youtube.com/watch?v=kFBDn5PiL00",  # Tembe Elephant Park
    "https://www.youtube.com/watch?v=G_rWl_kSxt8",  # Namibian Desert Elephants
    
    # San Diego Zoo
    "https://www.youtube.com/watch?v=gHiTEOBUjQs",  # Penguin Beach
    "https://www.youtube.com/watch?v=OHMYG8JsZKo",  # Elephant Odyssey
    "https://www.youtube.com/watch?v=3j8mr-gcS6A",  # Tiger Beach
    
    # Other wildlife streams
    "https://www.youtube.com/watch?v=hFg17Ha_8_4",  # Cornell Bird Cam
    "https://www.youtube.com/watch?v=wCkWgQ1YclE",  # Monterey Bay Aquarium
    "https://www.youtube.com/watch?v=SNggmeilXDQ",  # Houston Zoo
    
    # Red Panda - original URL (might come back online)
    "https://www.youtube.com/watch?v=Ihr_nwydXi0",  # Red Panda Forest Park
]

class LiveStreamFinder:
    def __init__(self):
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'noplaylist': True,
            'ignoreerrors': True,  # Don't stop on errors
            'geo_bypass': True,
            'extractor_args': {
                'youtube': {
                    'player_client': ['web', 'ios'],  # Try multiple clients
                    'player_skip': [],
                    'formats': ['complete'],
                }
            }
        }
    
    async def check_stream_status(self, url: str) -> Dict[str, Any]:
        """Check if a stream is currently live"""
        logger.info(f"🔍 Checking: {url}")
        
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, self._check_stream_sync, url
            )
            return result
        except Exception as e:
            logger.error(f"❌ Error checking {url}: {e}")
            return {
                'url': url,
                'status': 'error',
                'error': str(e),
                'is_live': False
            }
    
    def _check_stream_sync(self, url: str) -> Dict[str, Any]:
        """Synchronously check stream status"""
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    return {
                        'url': url,
                        'status': 'no_info',
                        'is_live': False
                    }
                
                # Extract key information
                result = {
                    'url': url,
                    'video_id': info.get('id', ''),
                    'title': info.get('title', ''),
                    'uploader': info.get('uploader', ''),
                    'is_live': info.get('is_live', False),
                    'live_status': info.get('live_status', 'unknown'),
                    'concurrent_viewers': info.get('concurrent_view_count', 0),
                    'view_count': info.get('view_count', 0),
                    'thumbnail': info.get('thumbnail', ''),
                    'status': 'success'
                }
                
                # Check for HLS formats if live
                if result['is_live']:
                    formats = info.get('formats', [])
                    hls_formats = [f for f in formats if f.get('ext') == 'm3u8' or 'hls' in f.get('protocol', '').lower()]
                    
                    if hls_formats:
                        # Get best HLS format
                        best_hls = max(hls_formats, key=lambda x: (x.get('height', 0), x.get('tbr', 0)))
                        result['hls_url'] = best_hls.get('url')
                        result['hls_quality'] = f"{best_hls.get('height', 'N/A')}p"
                        result['hls_bitrate'] = best_hls.get('tbr', 'N/A')
                
                return result
                
        except Exception as e:
            return {
                'url': url,
                'status': 'error',
                'error': str(e),
                'is_live': False
            }
    
    async def find_active_streams(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Find all currently active streams from a list of URLs"""
        logger.info(f"🔍 Checking {len(urls)} potential wildlife streams...")
        
        # Check all URLs concurrently
        tasks = [self.check_stream_status(url) for url in urls]
        results = await asyncio.gather(*tasks)
        
        # Filter for live streams
        active_streams = [r for r in results if r.get('is_live', False)]
        
        return results, active_streams
    
    def print_results(self, all_results: List[Dict[str, Any]], active_streams: List[Dict[str, Any]]):
        """Print comprehensive results"""
        print("\n" + "="*80)
        print("🦁 WILDLIFE LIVE STREAM FINDER RESULTS")
        print("="*80)
        
        print(f"📊 SUMMARY:")
        print(f"   Total streams checked: {len(all_results)}")
        print(f"   Currently LIVE: {len(active_streams)}")
        print(f"   Offline/Error: {len(all_results) - len(active_streams)}")
        
        if active_streams:
            print(f"\n🔴 ACTIVE LIVE STREAMS:")
            print("-" * 60)
            
            for i, stream in enumerate(active_streams, 1):
                print(f"\n{i}. {stream.get('title', 'N/A')}")
                print(f"   👤 Uploader: {stream.get('uploader', 'N/A')}")
                print(f"   👥 Viewers: {stream.get('concurrent_viewers', 0):,}")
                print(f"   🆔 Video ID: {stream.get('video_id', 'N/A')}")
                print(f"   🔗 URL: {stream.get('url', 'N/A')}")
                
                if stream.get('hls_url'):
                    print(f"   🎥 HLS Quality: {stream.get('hls_quality', 'N/A')}")
                    print(f"   📡 HLS URL: {stream.get('hls_url', 'N/A')[:100]}...")
        else:
            print(f"\n⚠️  NO ACTIVE LIVE STREAMS FOUND")
            print("   This is normal - wildlife streams come and go throughout the day.")
        
        print(f"\n📋 ALL STREAMS STATUS:")
        print("-" * 60)
        
        for result in all_results:
            status_icon = "🔴" if result.get('is_live') else "⭕"
            status_text = result.get('live_status', result.get('status', 'unknown'))
            title = result.get('title', 'N/A')[:50]
            
            print(f"{status_icon} {title} ({status_text})")
            
            if result.get('error'):
                print(f"   ❌ Error: {result['error']}")

async def main():
    """Main function to find active wildlife streams"""
    print("🚀 Starting Wildlife Live Stream Finder")
    print(f"⏰ Search Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Checking {len(WILDLIFE_STREAM_CANDIDATES)} potential streams...")
    
    finder = LiveStreamFinder()
    
    # Find active streams
    all_results, active_streams = await finder.find_active_streams(WILDLIFE_STREAM_CANDIDATES)
    
    # Print results
    finder.print_results(all_results, active_streams)
    
    # Save results to file
    output_file = f"wildlife_streams_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    output_data = {
        'timestamp': datetime.now().isoformat(),
        'total_checked': len(all_results),
        'active_count': len(active_streams),
        'active_streams': active_streams,
        'all_results': all_results
    }
    
    try:
        with open(output_file, 'w') as f:
            json.dump(output_data, f, indent=2, default=str)
        print(f"\n💾 Results saved to: {output_file}")
    except Exception as e:
        print(f"⚠️  Failed to save results: {e}")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    
    if active_streams:
        best_stream = max(active_streams, key=lambda x: x.get('concurrent_viewers', 0))
        print(f"🏆 Best Active Stream: {best_stream.get('title', 'N/A')}")
        print(f"   URL: {best_stream.get('url', 'N/A')}")
        print(f"   Viewers: {best_stream.get('concurrent_viewers', 0):,}")
        
        print(f"\n🔧 UPDATE YOUR add_stream.py:")
        print(f'   Replace the URL with: "{best_stream.get("url", "N/A")}"')
        print(f'   Update title to: "{best_stream.get("title", "N/A")}"')
    else:
        print("1. Try running this script at different times of day")
        print("2. Wildlife streams are most active during daylight hours in their timezone")
        print("3. Consider using a backup/fallback mechanism in your app")
        print("4. Check the EXPLORE.org website directly for current streams")
    
    print(f"\n🎉 Stream Search Complete!")

if __name__ == "__main__":
    asyncio.run(main()) 