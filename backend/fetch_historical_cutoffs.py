"""
fetch_historical_cutoffs.py
────────────────────────────
Fetches 6 years of TNEA cutoff data (2020-2025) from tneacutoff.com API
and enriches colleges_seed.json with:
  - Accurate 2024 cutoffs (course["cutoffs"])
  - Real 2025 cutoffs   (course["cutoffs_2025"])
  - Historical data     (course["historical_cutoffs"]["2020".."2023"])
  - New branches from API that don't yet exist in seed

Run once locally then commit the updated seed:
    cd backend
    python fetch_historical_cutoffs.py
"""

import json
import httpx
from pathlib import Path

YEAR_ENDPOINTS = {
    "2020": "https://www.tneacutoff.com/api/c0.json",
    "2021": "https://www.tneacutoff.com/api/c1.json",
    "2022": "https://www.tneacutoff.com/api/c2.json",
    "2023": "https://www.tneacutoff.com/api/c3.json",
    "2024": "https://www.tneacutoff.com/api/c4.json",
    "2025": "https://www.tneacutoff.com/api/c5.json",
}

CATEGORIES = ["OC", "BC", "BCM", "MBC", "SC", "SCA", "ST"]
SEED_PATH = Path(__file__).parent / "app" / "data" / "colleges_seed.json"


def _parse_val(v) -> float | None:
    """Convert API value to float or None (empty string / 0 / None → None)."""
    if v == "" or v is None:
        return None
    try:
        f = float(v)
        return f if f > 0 else None
    except (ValueError, TypeError):
        return None


def _make_cutoffs(record: dict) -> dict:
    return {cat: _parse_val(record.get(cat)) for cat in CATEGORIES}


def fetch_all_years() -> dict:
    """
    Returns nested dict:
      { college_code_str: { branch_code: { year: {OC, BC, ...} } } }
    """
    lookup: dict[str, dict[str, dict[str, dict]]] = {}

    with httpx.Client(timeout=30) as client:
        for year, url in YEAR_ENDPOINTS.items():
            print(f"  Fetching {year} from {url} ...", end=" ", flush=True)
            try:
                resp = client.get(url)
                resp.raise_for_status()
                records = resp.json()
                count = 0
                for rec in records:
                    coc = str(rec.get("coc", "")).strip()
                    brc = str(rec.get("brc", "")).strip().upper()
                    if not coc or not brc:
                        continue
                    cutoffs = _make_cutoffs(rec)
                    # Only store if at least OC is present
                    if cutoffs.get("OC") is None:
                        continue
                    lookup.setdefault(coc, {}).setdefault(brc, {})[year] = cutoffs
                    # Also store branch name for potential new-course creation
                    lookup[coc][brc]["_brn"] = rec.get("brn", "").strip().title()
                    count += 1
                print(f"{count} records loaded.")
            except Exception as e:
                print(f"ERROR: {e}")

    return lookup


def enrich_seed(lookup: dict) -> None:
    with open(SEED_PATH, encoding="utf-8") as f:
        colleges = json.load(f)

    updated_colleges = 0
    updated_courses = 0
    new_courses = 0

    for college in colleges:
        code = str(college.get("code", "")).strip()
        if code not in lookup:
            continue

        branch_data = lookup[code]
        existing_branch_codes = {c["branch_code"].upper() for c in college.get("courses", [])}

        # Update existing courses
        for course in college.get("courses", []):
            brc = course["branch_code"].upper()
            if brc not in branch_data:
                continue

            year_map = branch_data[brc]

            # 2024 → course["cutoffs"]
            if "2024" in year_map:
                course["cutoffs"] = year_map["2024"]
                updated_courses += 1

            # 2025 → course["cutoffs_2025"]
            if "2025" in year_map:
                course["cutoffs_2025"] = year_map["2025"]

            # 2020–2023 → course["historical_cutoffs"]
            hist = {}
            for yr in ("2020", "2021", "2022", "2023"):
                if yr in year_map:
                    hist[yr] = year_map[yr]
            if hist:
                course["historical_cutoffs"] = hist

        # Add new branches found in API that don't exist in seed yet
        for brc, year_map in branch_data.items():
            if brc in existing_branch_codes:
                continue
            if "2024" not in year_map:
                continue  # only add if we have current data
            branch_name = year_map.get("_brn", brc)
            new_course = {
                "branch_code": brc,
                "branch_name": branch_name,
                "cutoffs": year_map.get("2024", {}),
                "cutoffs_2025": year_map.get("2025"),
                "cutoffs_2026_predicted": None,
                "historical_cutoffs": {
                    yr: year_map[yr]
                    for yr in ("2020", "2021", "2022", "2023")
                    if yr in year_map
                },
            }
            college.setdefault("courses", []).append(new_course)
            new_courses += 1

        updated_colleges += 1

    with open(SEED_PATH, "w", encoding="utf-8") as f:
        json.dump(colleges, f, ensure_ascii=False, indent=2)

    print(f"\nOK Updated {updated_colleges} colleges, "
          f"{updated_courses} existing courses enriched, "
          f"{new_courses} new branches added.")
    print(f"OK Saved → {SEED_PATH}")


def verify_sample(code: str = "1") -> None:
    with open(SEED_PATH, encoding="utf-8") as f:
        colleges = json.load(f)
    college = next((c for c in colleges if c["code"] == code), None)
    if not college:
        print(f"College {code} not found.")
        return
    print(f"\nSample — {college['name']} (code {code}):")
    for course in college.get("courses", [])[:3]:
        print(f"  {course['branch_code']:6} | "
              f"2024 OC={course.get('cutoffs', {}).get('OC')} | "
              f"2025 OC={(course.get('cutoffs_2025') or {}).get('OC')} | "
              f"hist years={list(course.get('historical_cutoffs', {}).keys())}")


if __name__ == "__main__":
    print("Fetching TNEA historical cutoffs (2020–2025)...\n")
    lookup = fetch_all_years()
    print(f"\nAPI lookup built: {len(lookup)} colleges found.\n")
    print("Enriching colleges_seed.json...")
    enrich_seed(lookup)
    verify_sample("1")
    verify_sample("1234")
