import os
import httpx
from typing import Optional

PLACES_BASE = "https://maps.googleapis.com/maps/api/place"


async def fetch_reviews(place_id: str) -> dict:
    """Fetch rating and top reviews from Google Places Details API."""
    api_key = os.getenv("GOOGLE_PLACES_API_KEY", "")
    if not api_key or not place_id:
        return {"rating": None, "reviews": []}

    params = {
        "place_id": place_id,
        "fields": "name,rating,user_ratings_total,reviews",
        "key": api_key,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{PLACES_BASE}/details/json", params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return {"rating": None, "reviews": []}

    result = data.get("result", {})
    reviews_raw = result.get("reviews", [])
    reviews = [r.get("text", "") for r in reviews_raw[:10] if r.get("text")]

    return {
        "rating": result.get("rating"),
        "reviews": reviews,
    }


async def search_place_id(college_name: str) -> Optional[str]:
    """Find a Google Place ID by college name + 'Tamil Nadu'."""
    api_key = os.getenv("GOOGLE_PLACES_API_KEY", "")
    if not api_key:
        return None

    params = {
        "input": f"{college_name} Tamil Nadu",
        "inputtype": "textquery",
        "fields": "place_id",
        "key": api_key,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{PLACES_BASE}/findplacefromtext/json", params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return None

    candidates = data.get("candidates", [])
    if candidates:
        return candidates[0].get("place_id")
    return None
