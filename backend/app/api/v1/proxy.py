"""
Video Proxy API

Handles proxying video streams and segments to bypass CORS restrictions
"""

import aiohttp
import asyncio
from fastapi import APIRouter, Request, Response, HTTPException, Query
from fastapi.responses import StreamingResponse
from urllib.parse import unquote
from loguru import logger

router = APIRouter(tags=["Video Proxy"])


# Enhanced YouTube-specific headers for better compatibility
YOUTUBE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'DNT': '1'
}


async def stream_content(session: aiohttp.ClientSession, url: str):
    """Stream content from URL with error handling"""
    try:
        async with session.get(url, headers=YOUTUBE_HEADERS, timeout=aiohttp.ClientTimeout(total=30)) as response:
            if response.status != 200:
                logger.error(f"Failed to fetch {url}: HTTP {response.status}")
                return
            
            async for chunk in response.content.iter_chunked(8192):
                yield chunk
                
    except asyncio.TimeoutError:
        logger.error(f"Timeout fetching {url}")
        return
    except Exception as e:
        logger.error(f"Error streaming {url}: {e}")
        return


@router.get("/proxy/video/")
@router.head("/proxy/video/")
async def proxy_video_with_query(url: str = Query(..., description="URL to proxy")):
    """
    Proxy video segments using query parameter (preferred method for frontend)
    """
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Proxying video via query param (attempt {attempt + 1}/{max_retries}): {url}")
            
            # Create aiohttp session with proper configuration
            connector = aiohttp.TCPConnector(
                limit=100, 
                limit_per_host=10,
                force_close=True,
                enable_cleanup_closed=True
            )
            timeout = aiohttp.ClientTimeout(total=45, connect=15, sock_read=15)
            
            async with aiohttp.ClientSession(
                connector=connector, 
                timeout=timeout,
                headers=YOUTUBE_HEADERS
            ) as session:
                
                # Try to get content info first
                content_type = 'video/mp2t'
                content_length = None
                
                try:
                    async with session.head(url) as head_response:
                        if head_response.status == 200:
                            content_type = head_response.headers.get('Content-Type', 'video/mp2t')
                            content_length = head_response.headers.get('Content-Length')
                        elif head_response.status in [403, 404]:
                            logger.warning(f"HEAD request failed with {head_response.status}, trying GET directly")
                except Exception as head_error:
                    logger.debug(f"HEAD request failed: {head_error}, proceeding with GET")
                
                # Now get the actual content
                async def generate_stream():
                    # Create a new session for streaming to avoid session conflicts
                    stream_connector = aiohttp.TCPConnector(
                        limit=100, 
                        limit_per_host=10,
                        force_close=True,
                        enable_cleanup_closed=True
                    )
                    stream_timeout = aiohttp.ClientTimeout(total=60, connect=15, sock_read=30)
                    
                    try:
                        async with aiohttp.ClientSession(
                            connector=stream_connector, 
                            timeout=stream_timeout,
                            headers=YOUTUBE_HEADERS
                        ) as stream_session:
                            async with stream_session.get(url) as response:
                                if response.status == 200:
                                    logger.debug(f"Successfully fetching segment: {response.status}")
                                    async for chunk in response.content.iter_chunked(8192):
                                        yield chunk
                                elif response.status == 403:
                                    logger.error(f"Access forbidden (403) for URL: {url}")
                                    # Return empty stream to avoid breaking the video player
                                    return
                                elif response.status == 404:
                                    logger.error(f"Segment not found (404) for URL: {url}")
                                    return
                                else:
                                    logger.error(f"Failed to fetch video segment: HTTP {response.status}")
                                    return
                    except Exception as stream_error:
                        logger.error(f"Error in stream generation: {stream_error}")
                        return
                
                # Set enhanced response headers
                headers = {
                    'Content-Type': content_type,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Expose-Headers': '*',
                    'Cache-Control': 'public, max-age=3600',
                    'Accept-Ranges': 'bytes'
                }
                
                if content_length:
                    headers['Content-Length'] = content_length
                
                return StreamingResponse(
                    generate_stream(),
                    media_type=content_type,
                    headers=headers
                )
                        
        except Exception as e:
            logger.error(f"Proxy attempt {attempt + 1} failed for {url}: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (attempt + 1))
            else:
                raise HTTPException(status_code=500, detail=f"Proxy error after {max_retries} attempts: {str(e)}")


@router.get("/proxy/video/{path:path}")
@router.head("/proxy/video/{path:path}")
async def proxy_video_segment(path: str, request: Request):
    """
    Proxy video segments (.ts files) from YouTube with proper headers (legacy path-based method)
    """
    try:
        # Decode the URL-encoded path
        decoded_path = unquote(path)
        logger.info(f"Proxying video segment: {decoded_path}")
        
        # Create aiohttp session with proper configuration
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=10)
        timeout = aiohttp.ClientTimeout(total=30, connect=10, sock_read=10)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            async with session.get(decoded_path, headers=YOUTUBE_HEADERS) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch video segment: HTTP {response.status}")
                    raise HTTPException(status_code=response.status, detail="Failed to fetch video segment")
                
                # Get content type and length
                content_type = response.headers.get('Content-Type', 'video/mp2t')
                content_length = response.headers.get('Content-Length')
                
                # Set response headers
                headers = {
                    'Content-Type': content_type,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    'Cache-Control': 'public, max-age=3600'
                }
                
                if content_length:
                    headers['Content-Length'] = content_length
                
                # Stream the content
                return StreamingResponse(
                    stream_content(session, decoded_path),
                    media_type=content_type,
                    headers=headers
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Proxy error for {path}: {e}")
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


@router.get("/proxy/playlist/{path:path}")
async def proxy_playlist(path: str, request: Request):
    """
    Proxy playlist files (.m3u8) from YouTube with proper headers
    """
    try:
        # Decode the URL-encoded path
        decoded_path = unquote(path)
        logger.info(f"Proxying playlist: {decoded_path}")
        
        # Create aiohttp session
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=10)
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            async with session.get(decoded_path, headers=YOUTUBE_HEADERS) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch playlist: HTTP {response.status}")
                    raise HTTPException(status_code=response.status, detail="Failed to fetch playlist")
                
                # Read the playlist content
                content = await response.text()
                
                # Set proper headers for m3u8 content
                headers = {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    'Cache-Control': 'no-cache'
                }
                
                return StreamingResponse(
                    iter([content.encode()]),
                    media_type='application/vnd.apple.mpegurl',
                    headers=headers
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Playlist proxy error for {path}: {e}")
        raise HTTPException(status_code=500, detail=f"Playlist proxy error: {str(e)}")


@router.options("/proxy/{path:path}")
async def proxy_options(path: str):
    """Handle CORS preflight requests for proxy endpoints"""
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*"
    } 