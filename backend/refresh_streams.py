#!/usr/bin/env python3
"""
Refresh existing streams with updated HLS URLs
"""

import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000"

# Update existing streams with fresh URLs
REFRESH_STREAMS = [
    {
        "id": "Ihr_nwydXi0",
        "url": "https://www.youtube.com/watch?v=Ihr_nwydXi0",
        "custom_title": "Red Panda Forest Park powered by EXPLORE.org"
    },
    {
        "id": "ydYDqZQpim8", 
        "url": "https://www.youtube.com/watch?v=ydYDqZQpim8",
        "custom_title": "African Animals Live from Tembe Elephant Park"
    }
]

async def refresh_stream(session, stream_data):
    """Refresh a single stream's HLS URL"""
    try:
        # First delete the existing stream
        delete_url = f"{BASE_URL}/api/v1/streams/{stream_data['id']}"
        async with session.delete(delete_url) as response:
            if response.status in [200, 404]:  # 404 is OK if stream doesn't exist
                print(f"🗑️ Deleted existing stream: {stream_data['custom_title']}")
            else:
                print(f"⚠️ Could not delete stream {stream_data['id']}: HTTP {response.status}")

        # Wait a moment
        await asyncio.sleep(1)
        
        # Add the stream back with fresh URL
        add_data = {
            "url": stream_data["url"],
            "category": "wildlife",
            "custom_title": stream_data["custom_title"]
        }
        
        async with session.post(f"{BASE_URL}/api/v1/streams/", json=add_data) as response:
            if response.status == 200:
                result = await response.json()
                if result.get("success"):
                    stream_info = result.get("stream", {})
                    hls_url = stream_info.get("hls_url", "N/A")
                    viewers = stream_info.get("viewer_count", 0)
                    status = stream_info.get("status", "unknown")
                    print(f"✅ Refreshed: {stream_data['custom_title']}")
                    print(f"   Status: {status} | Viewers: {viewers}")
                    print(f"   HLS URL: {'Valid' if hls_url != 'N/A' else 'Invalid'}")
                    return True
                else:
                    print(f"❌ Failed to refresh {stream_data['custom_title']}: {result.get('message', 'Unknown error')}")
                    return False
            else:
                print(f"❌ HTTP Error {response.status} refreshing {stream_data['custom_title']}")
                return False
                
    except Exception as e:
        print(f"❌ Exception refreshing {stream_data['custom_title']}: {e}")
        return False

async def main():
    print("🔄 Refreshing Wildlife Streams with Fresh HLS URLs")
    print("=" * 60)
    
    # Test API health first
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/health") as response:
                if response.status == 200:
                    print("✅ API is healthy")
                else:
                    print(f"❌ API health check failed: HTTP {response.status}")
                    return
        except Exception as e:
            print(f"❌ Cannot connect to API: {e}")
            return
    
    print()
    
    # Refresh each stream
    success_count = 0
    async with aiohttp.ClientSession() as session:
        for i, stream_data in enumerate(REFRESH_STREAMS, 1):
            print(f"{i}. Refreshing: {stream_data['custom_title']}")
            success = await refresh_stream(session, stream_data)
            if success:
                success_count += 1
            print()
    
    print("=" * 60)
    print(f"✅ Successfully refreshed {success_count}/{len(REFRESH_STREAMS)} streams")
    
    # List final state
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/api/v1/streams/") as response:
                if response.status == 200:
                    data = await response.json()
                    streams = data.get("streams", [])
                    print(f"\n📺 Total streams in database: {len(streams)}")
                    for stream in streams:
                        title = stream.get("title", "Unknown")
                        stream_id = stream.get("id", "Unknown")
                        viewers = stream.get("viewer_count", 0)
                        status = stream.get("status", "unknown")
                        print(f"  • {title} (ID: {stream_id})")
                        print(f"    Viewers: {viewers} | Status: {status}")
        except Exception as e:
            print(f"❌ Error listing final streams: {e}")
    
    print(f"\n🎯 Visit http://localhost:3000 to view refreshed streams!")

if __name__ == "__main__":
    asyncio.run(main()) 