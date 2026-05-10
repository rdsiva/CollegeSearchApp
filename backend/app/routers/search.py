import json
import re
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from rapidfuzz import process, fuzz
from app.models.schemas import SearchResponse, CollegeMatch

# Neighboring districts for "in and around" location filtering
_DISTRICT_NEIGHBORS: dict[str, list[str]] = {
    "Chennai": ["Tiruvallur", "Kanchipuram"],
    "Tiruvallur": ["Chennai", "Kanchipuram"],
    "Kanchipuram": ["Chennai", "Tiruvallur", "Vellore", "Villupuram"],
    "Vellore": ["Kanchipuram", "Tiruvannamalai", "Krishnagiri"],
    "Tiruvannamalai": ["Vellore", "Villupuram", "Dharmapuri"],
    "Villupuram": ["Kanchipuram", "Cuddalore", "Tiruvannamalai"],
    "Cuddalore": ["Villupuram", "Nagapattinam", "Thiruvarur"],
    "Nagapattinam": ["Cuddalore", "Thiruvarur", "Thanjavur"],
    "Thiruvarur": ["Cuddalore", "Nagapattinam", "Thanjavur"],
    "Thanjavur": ["Tiruchirappalli", "Nagapattinam", "Thiruvarur", "Pudukkottai"],
    "Tiruchirappalli": ["Thanjavur", "Perambalur", "Ariyalur", "Karur", "Namakkal", "Pudukkottai"],
    "Ariyalur": ["Tiruchirappalli", "Perambalur"],
    "Perambalur": ["Tiruchirappalli", "Ariyalur", "Namakkal"],
    "Karur": ["Tiruchirappalli", "Erode", "Namakkal", "Dindigul", "Tirupur"],
    "Namakkal": ["Salem", "Erode", "Karur", "Tiruchirappalli"],
    "Salem": ["Dharmapuri", "Namakkal", "Erode", "Krishnagiri"],
    "Dharmapuri": ["Salem", "Krishnagiri", "Tiruvannamalai"],
    "Krishnagiri": ["Dharmapuri", "Salem", "Vellore"],
    "Erode": ["Salem", "Namakkal", "Coimbatore", "Tirupur", "Karur"],
    "Coimbatore": ["Tirupur", "Erode"],
    "Tirupur": ["Coimbatore", "Erode", "Karur", "Dindigul"],
    "Dindigul": ["Madurai", "Theni", "Karur", "Tirupur"],
    "Madurai": ["Dindigul", "Theni", "Sivaganga", "Virudhunagar", "Ramanathapuram"],
    "Theni": ["Madurai", "Dindigul", "Virudhunagar"],
    "Virudhunagar": ["Madurai", "Theni", "Thoothukudi", "Tirunelveli", "Sivaganga", "Ramanathapuram"],
    "Sivaganga": ["Madurai", "Ramanathapuram", "Pudukkottai"],
    "Pudukkottai": ["Tiruchirappalli", "Thanjavur", "Sivaganga"],
    "Ramanathapuram": ["Sivaganga", "Virudhunagar", "Thoothukudi"],
    "Thoothukudi": ["Tirunelveli", "Virudhunagar", "Ramanathapuram"],
    "Tirunelveli": ["Thoothukudi", "Kanyakumari", "Virudhunagar"],
    "Kanyakumari": ["Tirunelveli"],
}

# Words to strip when doing fuzzy name matching so generic terms don't inflate scores
_STOP_WORDS = {
    "college", "of", "engineering", "technology", "institute", "and",
    "the", "for", "sciences", "science", "school", "faculty",
}

def _normalize_name(name: str) -> str:
    """Lowercase, remove dots/punctuation, strip stop words."""
    name = name.lower()
    name = re.sub(r"[.\-,']", " ", name)   # remove dots so s.a. → s a
    tokens = [t for t in name.split() if t not in _STOP_WORDS]
    return " ".join(tokens) if tokens else name


def _normalize_branch(name: str) -> str:
    """Lowercase, strip pure-variant suffixes (Ss, Tamil Medium, Sandwich) so they
    fold into the base discipline, then drop remaining punctuation and collapse
    whitespace. Specialisation suffixes like "(Cyber Security)" or "(Data Science)"
    are preserved and survive into the normalized form, so they do NOT match the
    plain branch name."""
    s = name.lower()
    s = re.sub(r"\s*\((ss|sandwich|tamil medium|tamil)\)\s*", " ", s)
    s = re.sub(r"[(),.\-/]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def _branch_matches_courses(branch_name: str, selected: list[str]) -> bool:
    """True if branch's normalized name exactly equals any selected course's
    normalized name. Variants like '(Ss)' or '(Tamil Medium)' fold into the base
    name; specialisations stay distinct."""
    bn = _normalize_branch(branch_name)
    for sel in selected:
        s = _normalize_branch(sel)
        if s and bn == s:
            return True
    return False

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
        nirf_rank=c.get("nirf_rank"),
    )


def _sort_by_rank(colleges: list[dict]) -> list[dict]:
    """Sort colleges by NIRF rank ascending (ranked colleges first, unranked last)."""
    return sorted(colleges, key=lambda c: (c.get("nirf_rank") is None, c.get("nirf_rank") or 0))


def _filter_by_district(colleges: list[dict], district: str) -> list[dict]:
    """Keep colleges whose district matches the selected district or a neighboring district."""
    target = district.strip().title()
    allowed = {target} | set(_DISTRICT_NEIGHBORS.get(target, []))
    return [c for c in colleges if c.get("district", "") in allowed]


@router.get("/districts", response_model=list[str])
async def list_districts():
    """Return the sorted list of distinct districts that have at least one college."""
    colleges = load_seed()
    districts = sorted(
        {c.get("district", "") for c in colleges if c.get("district") and c.get("district") != "Tamil Nadu"},
        key=str.lower,
    )
    return districts


@router.get("/search", response_model=SearchResponse)
async def search_colleges(
    q: Optional[str] = Query(None),
    type: str = Query("name", regex="^(name|code|cutoff)$"),
    mark: Optional[float] = Query(None),
    category: Optional[str] = Query(None, regex="^(OC|BC|BCM|MBC|SC|ST|SCA)$"),
    courses: Optional[list[str]] = Query(None),
    year: str = Query("2026", regex="^(2024|2025|2026)$"),
    district: Optional[str] = Query(None, max_length=50),
):
    colleges = load_seed()

    if type == "code":
        if not q:
            raise HTTPException(400, "q is required for code search")
        matches = [c for c in colleges if c["code"] == q.strip()]
        if district:
            matches = _filter_by_district(matches, district)
        matches = _sort_by_rank(matches)
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
        if district:
            matched = _filter_by_district(matched, district)
        matched = _sort_by_rank(matched)
        exact = len(matched) == 1
        return SearchResponse(matches=[_to_match(c) for c in matched], exact=exact)

    if type == "cutoff":
        if mark is None or not category:
            raise HTTPException(400, "mark and category are required for cutoff search")
        course_filter = [c for c in (courses or []) if c and c.strip()]
        matched = []
        for college in colleges:
            for branch in college.get("courses", []):
                if course_filter and not _branch_matches_courses(branch["branch_name"], course_filter):
                    continue
                # Pick cutoff table based on requested year, fall back if unavailable
                if year == "2026":
                    cutoffs = branch.get("cutoffs_2026_predicted") or branch.get("cutoffs_2025") or branch.get("cutoffs", {})
                elif year == "2025":
                    cutoffs = branch.get("cutoffs_2025") or branch.get("cutoffs", {})
                else:
                    cutoffs = branch.get("cutoffs", {})
                cutoff_val = (cutoffs or {}).get(category)
                if cutoff_val is not None and cutoff_val <= mark:
                    matched.append(college)
                    break  # one match per college is enough
        if district:
            matched = _filter_by_district(matched, district)
        matched = _sort_by_rank(matched)
        return SearchResponse(matches=[_to_match(c) for c in matched], exact=False)

    raise HTTPException(400, "Invalid search type")
