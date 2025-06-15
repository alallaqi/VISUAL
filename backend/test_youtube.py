#!/usr/bin/env python3
"""
Test script for YouTube service functionality
"""

import asyncio
from app.services.youtube_service import youtube_service

async def test_youtube():
    print('🧪 Testing YouTube service...')
    
    # Test URL validation
    test_urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/live/abc123',
        'https://invalid-url.com'
    ]
    
    print('\n📋 URL Validation Tests:')
    for url in test_urls:
        is_valid = youtube_service.is_valid_youtube_url(url)
        print(f'  {url}: {"✅ Valid" if is_valid else "❌ Invalid"}')
    
    # Test metadata extraction
    print('\n🔍 Metadata Extraction Test:')
    test_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    try:
        metadata = await youtube_service.get_stream_metadata(test_url)
        if metadata:
            print(f'✅ Metadata extraction successful!')
            print(f'   Title: {metadata.title}')
            print(f'   ID: {metadata.id}')
            print(f'   Is Live: {metadata.is_live}')
            print(f'   Uploader: {metadata.uploader}')
        else:
            print('⚠️  Metadata extraction returned None')
    except Exception as e:
        print(f'⚠️  Metadata extraction error: {e}')
    
    print('\n🎉 YouTube service test completed!')

if __name__ == "__main__":
    asyncio.run(test_youtube()) 