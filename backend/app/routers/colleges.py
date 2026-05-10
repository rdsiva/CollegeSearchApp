import json
import asyncio
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import ResearchRequest, CollegeDetail, CollegeSeed
from app.services import google_places, youtube, llm, scoring, research_jobs
from app.cache import research_cache
from app.limiter import limiter

router = APIRouter()


def load_college(code: str) -> dict | None:
    seed_path = Path(__file__).parent.parent / "data" / "colleges_seed.json"
    with open(seed_path, encoding="utf-8") as f:
        colleges = json.load(f)
    for c in colleges:
        if c["code"] == code:
            return c
    return None


async def research_one(code: str) -> CollegeDetail:
    if code in research_cache:
        return research_cache[code]

    raw = load_college(code)
    if not raw:
        raise HTTPException(404, f"College with code {code} not found")

    seed = CollegeSeed(**raw)

    detail = CollegeDetail(
        code=seed.code,
        anna_university_code=seed.anna_university_code,
        name=seed.name,
        city=seed.city,
        district=seed.district,
        affiliation=seed.affiliation,
        approved_by=seed.approved_by,
        nirf_rank=seed.nirf_rank,
        courses=seed.courses,
        fees=seed.fees,
        placement=seed.placement,
    )

    # Resolve Google Place ID if not in seed
    place_id = seed.google_place_id
    if not place_id:
        place_id = await google_places.search_place_id(seed.name)

    # Cutoff prediction depends only on seed data — kick it off immediately
    courses_need_prediction = [
        c.model_dump() for c in seed.courses
        if not c.cutoffs_2026_predicted and (c.cutoffs or c.cutoffs_2025)
    ]
    predict_task = (
        asyncio.create_task(llm.predict_cutoffs_2026(seed.name, courses_need_prediction))
        if courses_need_prediction else None
    )

    # In parallel: fetch Google reviews + YouTube videos
    google_data, yt_videos = await asyncio.gather(
        google_places.fetch_reviews(place_id or ""),
        youtube.fetch_videos(seed.name),
    )
    google_rating = google_data.get("rating")
    google_reviews = google_data.get("reviews", [])
    yt_descriptions = [v.description or "" for v in yt_videos if v.description]

    # Now summarize_reviews can run; let it race with the prediction task to finish
    summary_task = asyncio.create_task(
        llm.summarize_reviews(seed.name, google_reviews, yt_descriptions)
    )
    review_summary = await summary_task
    review_summary.google_rating = google_rating
    review_summary.review_texts = google_reviews[:5]
    detail.reviews = review_summary
    detail.youtube_videos = yt_videos

    if predict_task is not None:
        predictions = await predict_task
        for course in detail.courses:
            if course.branch_code in predictions and not course.cutoffs_2026_predicted:
                course.cutoffs_2026_predicted = predictions[course.branch_code]

    breakdown = scoring.calculate_score(detail)
    detail.score = breakdown.total
    detail.score_breakdown = breakdown

    research_cache[code] = detail
    return detail


@router.post("/colleges/research", response_model=list[CollegeDetail])
@limiter.limit("30/minute")
async def research_colleges(request: Request, req: ResearchRequest):
    """Synchronous research — kept for backward compatibility (CLI, exports, etc.)."""
    if not req.college_codes:
        raise HTTPException(400, "college_codes must not be empty")
    if len(req.college_codes) > 20:
        raise HTTPException(400, "Cannot research more than 20 colleges at once")

    results = await asyncio.gather(
        *[research_one(code) for code in req.college_codes],
        return_exceptions=True,
    )

    details = []
    for r in results:
        if isinstance(r, Exception):
            raise r
        details.append(r)

    return details


@router.post("/colleges/research/start")
@limiter.limit("30/minute")
async def start_research_job(request: Request, req: ResearchRequest):
    """Async start — returns a job_id immediately; results are available via /job/{id}."""
    if not req.college_codes:
        raise HTTPException(400, "college_codes must not be empty")
    if len(req.college_codes) > 20:
        raise HTTPException(400, "Cannot research more than 20 colleges at once")
    return research_jobs.start_job(req.college_codes)


@router.get("/colleges/research/job/{job_id}")
async def get_research_job(job_id: str):
    job = research_jobs.get_job(job_id)
    if job is None:
        raise HTTPException(404, "job not found")
    return job
