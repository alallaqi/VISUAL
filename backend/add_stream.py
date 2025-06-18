#!/usr/bin/env python3
"""
Add Red Panda stream and test all APIs
"""

import asyncio
import aiohttp
import json
from urllib.parse import quote

BASE_URL = "http://localhost:8001"

async def test_health():
    """Test health endpoint"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Health check passed:", data)
                    return True
                else:
                    print("❌ Health check failed:", response.status)
                    return False
        except Exception as e:
            print("❌ Health check error:", e)
            return False

async def add_stream():
    """Add the Namibia Desert stream (currently live)"""
    stream_data = {
        "url": "https://www.youtube.com/watch?v=ydYDqZQpim8",
        "category": "wildlife",
        "custom_title": "Namibia Desert Live Stream powered by NamibiaCam",
        "custom_description": "Live wildlife stream from the Namib Desert featuring desert animals and landscapes"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BASE_URL}/api/v1/streams/", 
                json=stream_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Stream added successfully:", data)
                    return data
                else:
                    text = await response.text()
                    print("❌ Failed to add stream:", response.status, text)
                    return None
        except Exception as e:
            print("❌ Error adding stream:", e)
            return None

async def list_streams():
    """List all streams"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/api/v1/streams/") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Streams listed successfully:")
                    if 'streams' in data:
                        for stream in data['streams']:
                            print(f"  - {stream['title']} (ID: {stream['id']})")
                            print(f"    HLS URL: {stream.get('stream_url', 'N/A')}")
                            print(f"    Viewers: {stream.get('viewer_count', 'N/A')}")
                    return data
                else:
                    text = await response.text()
                    print("❌ Failed to list streams:", response.status, text)
                    return None
        except Exception as e:
            print("❌ Error listing streams:", e)
            return None

async def test_proxy():
    """Test proxy endpoints"""
    # Test with a simple URL to check if proxy is working
    test_url = "https://httpbin.org/get"
    encoded_url = quote(test_url, safe='')
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/api/v1/proxy/video/{encoded_url}") as response:
                if response.status == 200:
                    print("✅ Proxy endpoint is working")
                    return True
                else:
                    text = await response.text()
                    print("❌ Proxy test failed:", response.status, text)
                    return False
        except Exception as e:
            print("❌ Proxy test error:", e)
            return False

async def main():
    """Main test function"""
    print("🧪 Testing Wildlife Narration API")
    print("=" * 50)
    
    # Test health
    print("\n1. Testing health endpoint...")
    health_ok = await test_health()
    
    if not health_ok:
        print("❌ API is not healthy, exiting...")
        return
    
    # Add stream
    print("\n2. Adding Namibia Desert stream...")
    stream = await add_stream()
    
    # List streams
    print("\n3. Listing all streams...")
    streams = await list_streams()
    
    # Test proxy
    print("\n4. Testing proxy endpoint...")
    proxy_ok = await test_proxy()
    
    print("\n" + "=" * 50)
    if health_ok and stream and streams and proxy_ok:
        print("✅ All tests passed! API is ready.")
        if streams and 'streams' in streams:
            print(f"\nFound {len(streams['streams'])} stream(s):")
            for s in streams['streams']:
                print(f"  - {s['title']}")
                print(f"    Visit: http://localhost:3001 to view the stream")
    else:
        print("❌ Some tests failed. Check the logs above.")

if __name__ == "__main__":
    asyncio.run(main()) 