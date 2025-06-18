#!/usr/bin/env python3
"""
Add multiple wildlife streams to test the system
"""

import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:8000"

# Wildlife streams to add
WILDLIFE_STREAMS = [
    {
        "url": "https://www.youtube.com/watch?v=ydYDqZQpim8",
        "category": "wildlife",
        "custom_title": "African Animals Live from Tembe Elephant Park",
        "custom_description": "24/7 live stream of elephants, lions, leopards and other African wildlife from South Africa"
    },
    {
        "url": "https://www.youtube.com/watch?v=M7pWm_VEhAg", 
        "category": "wildlife",
        "custom_title": "Namibian Waterhole Live Cam",
        "custom_description": "Watch elephants, giraffes, zebras and other African animals visit this waterhole in Namibia"
    },
    {
        "url": "https://www.youtube.com/watch?v=UHkEbemburs",
        "category": "wildlife", 
        "custom_title": "Bird Feeder Live Cam",
        "custom_description": "Live stream of various birds visiting backyard feeders throughout the day"
    },
    {
        "url": "https://www.youtube.com/watch?v=wFE1EDt_8HU",
        "category": "wildlife",
        "custom_title": "Shark Lagoon Live Cam - Aquarium",
        "custom_description": "Live underwater view of sharks and rays at the Aquarium of the Pacific"
    }
]

async def add_stream(stream_data):
    """Add a single stream"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BASE_URL}/api/v1/streams/", 
                json=stream_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Added: {stream_data['custom_title']}")
                    return data
                else:
                    text = await response.text()
                    print(f"❌ Failed to add {stream_data['custom_title']}: {response.status} - {text}")
                    return None
        except Exception as e:
            print(f"❌ Error adding {stream_data['custom_title']}: {e}")
            return None

async def list_all_streams():
    """List all streams"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/api/v1/streams/") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"\n📺 Total streams in database: {len(data.get('streams', []))}")
                    for stream in data.get('streams', []):
                        print(f"  • {stream['title']} (ID: {stream['id']})")
                        print(f"    Viewers: {stream.get('viewer_count', 'N/A')} | Status: {stream.get('status', 'N/A')}")
                    return data
                else:
                    print(f"❌ Failed to list streams: {response.status}")
                    return None
        except Exception as e:
            print(f"❌ Error listing streams: {e}")
            return None

async def main():
    print("🌍 Adding Multiple Wildlife Streams")
    print("=" * 50)
    
    added_count = 0
    
    for i, stream_data in enumerate(WILDLIFE_STREAMS, 1):
        print(f"\n{i}. Adding: {stream_data['custom_title']}")
        result = await add_stream(stream_data)
        if result:
            added_count += 1
        
        # Small delay between requests
        await asyncio.sleep(1)
    
    print(f"\n=" * 50)
    print(f"✅ Successfully added {added_count}/{len(WILDLIFE_STREAMS)} streams")
    
    # List all streams
    await list_all_streams()
    
    print(f"\n🎯 Visit http://localhost:3001 to view all streams!")

if __name__ == "__main__":
    asyncio.run(main()) 