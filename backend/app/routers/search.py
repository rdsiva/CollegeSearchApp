import json
import re
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from rapidfuzz import process, fuzz
from app.models.schemas import SearchResponse, CollegeMatch

# Words to strip when doing fuzzy name matching so generic terms don't inflate scores
_STOP_WORDS = {
    "college", "of", "engineering", "technology", "institute", "and",
    "the", "for", "sciences", "science", "school", "faculty",
}

# Common branch abbreviation → keywords that appear in full branch names
_BRANCH_ALIASES: dict[str, list[str]] = {
    "cse": ["computer science"],
    "it": ["information technology"],
    "ece": ["electronics", "communication"],
    "eee": ["electrical", "electronics"],
    "mech": ["mechanical"],
    "civil": ["civil"],
    "chem": ["chemical"],
    "bio": ["bio"],
    "aiml": ["artificial intelligence"],
    "aids": ["data science"],
    "csbs": ["computer science and business"],
}

def _normalize_name(name: str) -> str:
    """Lowercase, remove dots/punctuation, strip stop words."""
    name = name.lower()
    name = re.sub(r"[.\-,']", " ", name)   # remove dots so s.a. → s a
    tokens = [t for t in name.split() if t not in _STOP_WORDS]
    return " ".join(tokens) if tokens else name

router = APIRouter()

_seed_data: list[dict] | None = None


def load_seed() -> list[dict]:
    global _seed_data
    if _seed_data is None:
        seed_path = Path(__file__).parent.parent / "data" / "colleges_seed.json"
        with open(seed_path, encoding="utf-8") as f:
            _seed_data = json.load(f)
    return _seed_data


def _to_match(c: dict) -> CollegeMatch:
    return CollegeMatch(
        code=c["code"],
        name=c["name"],
        city=c["city"],
        district=c["district"],
        affiliation=c["affiliation"],
        courses=[course["branch_name"] for course in c.get("courses", [])],
    )


@router.get("/search", response_model=SearchResponse)
async def search_colleges(
    q: Optional[str] = Query(None),
    type: str = Query("name", regex="^(name|code|cutoff)$"),
    mark: Optional[float] = Query(None),
    category: Optional[str] = Query(None, regex="^(OC|BC|BCM|MBC|SC|ST|SCA)$"),
    course: Optional[str] = Query(None),
    year: str = Query("2026", regex="^(2024|2025|2026)$"),
):
    colleges = load_seed()

    if type == "code":
        if not q:
            raise HTTPException(400, "q is required for code search")
        matches = [c for c in colleges if c["code"] == q.strip()]
        return SearchResponse(matches=[_to_match(c) for c in matches], exact=len(matches) == 1)

    if type == "name":
        if not q:
            raise HTTPException(400, "q is required for name search")
        query_norm = _normalize_name(q.strip())
        # If normalization collapses query to ≤3 chars (e.g. "s.a." → "s a"),
        # match against full names without stop-word stripping for better precision
        if len(query_norm.replace(" ", "")) < 3:
            search_query = q.strip().lower()
            search_names = [c["name"].lower() for c in colleges]
        else:
            search_query = query_norm
            search_names = [_normalize_name(c["name"]) for c in colleges]
        # Use WRatio for robust matching (handles abbreviations, partial words)
        results = process.extract(search_query, search_names, scorer=fuzz.WRatio, limit=20)
        matched = [colleges[idx] for _, score, idx in results if score >= 70]
        exact = len(matched) == 1
        return SearchResponse(matches=[_to_match(c) for c in matched], exact=exact)

    if type == "cutoff":
        if mark is None or not category:
            raise HTTPException(400, "mark and category are required for cutoff search")
        matched = []
        for college in colleges:
            for branch in college.get("courses", []):
                # Filter by course keyword if provided
                if course:
                    branch_name_lower = branch["branch_name"].lower()
                    course_lower = course.lower().strip()
                    # Expand known abbreviations (e.g. "cse" → check for "computer science")
                    aliases = _BRANCH_ALIASES.get(course_lower, [course_lower])
                    if not any(alias in branch_name_lower for alias in aliases):
                        continue
                # Pick cutoff table based on requested year
                # Fall back to 2024 if the requested year isn't available for this branch
                if year == "2026":
                    cutoffs = branch.get("cutoffs_2026_predicted") or branch.get("cutoffs_2025") or branch.get("cutoffs", {})
                elif year == "2025":
                    cutoffs = branch.get("cutoffs_2025") or branch.get("cutoffs", {})
                else:
                    cutoffs = branch.get("cutoffs", {})
                cutoff_val = cutoffs.get(category)
                if cutoff_val is not None and cutoff_val <= mark:
                    matched.append(college)
                    break  # one match per college is enough
        return SearchResponse(matches=[_to_match(c) for c in matched], exact=False)

    raise HTTPException(400, "Invalid search type")
