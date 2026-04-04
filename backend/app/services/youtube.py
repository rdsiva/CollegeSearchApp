import os
import httpx
from app.models.schemas import YouTubeVideo

YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3"


async def fetch_videos(college_name: str) -> list[YouTubeVideo]:
    """Search YouTube for student review videos of the college."""
    api_key = os.getenv("YOUTUBE_API_KEY", "")
    if not api_key:
        return []

    params = {
        "part": "snippet",
        "q": f"{college_name} Tamil Nadu review students",
        "type": "video",
        "maxResults": 5,
        "relevanceLanguage": "ta",
        "key": api_key,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(f"{YOUTUBE_BASE}/search", params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    videos = []
    for item in data.get("items", []):
        video_id = item.get("id", {}).get("videoId", "")
        snippet = item.get("snippet", {})
        if video_id:
            videos.append(YouTubeVideo(
                title=snippet.get("title", ""),
                url=f"https://www.youtube.com/watch?v={video_id}",
                description=snippet.get("description", "")[:300],
            ))
    return videos
