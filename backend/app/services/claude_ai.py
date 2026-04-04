import os
import json
import anthropic
from app.models.schemas import ReviewSummary, CourseCutoffs

client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global client
    if client is None:
        client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
    return client


async def summarize_reviews(
    college_name: str,
    google_reviews: list[str],
    youtube_descriptions: list[str],
) -> ReviewSummary:
    """Use Claude to summarize reviews and compute sentiment."""
    if not google_reviews and not youtube_descriptions:
        return ReviewSummary()

    reviews_text = "\n".join(f"- {r}" for r in google_reviews) or "No Google reviews available."
    yt_text = "\n".join(f"- {d}" for d in youtube_descriptions) or "No YouTube data available."

    prompt = f"""You are analyzing student reviews of "{college_name}", an engineering college in Tamil Nadu, India.

Google Reviews:
{reviews_text}

YouTube video descriptions:
{yt_text}

Based on the above, return a JSON object with exactly these keys:
{{
  "sentiment_score": <float between 0 and 10>,
  "pros": [<exactly 3 short pros as strings>],
  "cons": [<exactly 3 short cons as strings>],
  "common_complaints": [<up to 4 common complaints as strings>],
  "summary": "<2-sentence plain English summary>"
}}

Return only the JSON, no other text."""

    try:
        resp = await get_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        data = json.loads(raw)
        return ReviewSummary(
            sentiment_score=float(data.get("sentiment_score", 5.0)),
            pros=data.get("pros", []),
            cons=data.get("cons", []),
            common_complaints=data.get("common_complaints", []),
            summary=data.get("summary", ""),
        )
    except Exception:
        return _fallback_summary(google_reviews)


async def predict_cutoffs_2026(
    college_name: str,
    courses: list[dict],
) -> dict[str, CourseCutoffs]:
    """
    Use Claude to predict 2026 TNEA cutoffs using up to 6 years of history.
    Returns dict keyed by branch_code -> CourseCutoffs.
    """
    branch_lines = []
    for c in courses:
        hist = c.get("historical_cutoffs") or {}
        oc_2024 = (c.get("cutoffs") or {}).get("OC")
        oc_2025 = (c.get("cutoffs_2025") or {}).get("OC")

        # Build year-by-year OC trend line from all available data
        year_oc: dict[str, float] = {}
        for yr in ("2020", "2021", "2022", "2023"):
            val = (hist.get(yr) or {}).get("OC")
            if val is not None:
                year_oc[yr] = val
        if oc_2024 is not None:
            year_oc["2024"] = oc_2024
        if oc_2025 is not None:
            year_oc["2025"] = oc_2025

        if not year_oc:
            continue

        trend_str = " | ".join(f"{yr}: {v}" for yr, v in sorted(year_oc.items()))

        # Include 2024 category breakdown so LLM can derive gaps
        cutoffs_2024 = c.get("cutoffs") or {}
        cats = ", ".join(
            f"{cat}={cutoffs_2024.get(cat)}"
            for cat in ("BC", "BCM", "MBC", "SC", "SCA", "ST")
            if cutoffs_2024.get(cat) is not None
        )
        branch_lines.append(
            f'  Branch: {c["branch_name"]} (Code: {c["branch_code"]})\n'
            f'    OC trend: {trend_str}\n'
            f'    2024 categories: {cats if cats else "not available"}'
        )

    if not branch_lines:
        return {}

    prompt = f"""You are a TNEA (Tamil Nadu Engineering Admissions) expert predicting 2026 cutoffs.

College: {college_name}

Historical OC cutoff trends and 2024 category data per branch:
{chr(10).join(branch_lines)}

Instructions:
1. Analyse the year-on-year OC trend for each branch (acceleration, plateau, decline).
2. Branches with consistent upward trend in last 3 years will likely continue rising.
3. Branches near the maximum (200) cannot exceed it — apply ceiling logic.
4. Derive all 7 category cutoffs for 2026 using the 2024 category gaps as baseline.
5. Category gaps (approximate): BC = OC-13 to OC-15, MBC = OC-17 to OC-20,
   BCM = OC-22 to OC-25, SC = OC-30 to OC-35, SCA = OC-36 to OC-40, ST = OC-48 to OC-52.
6. Clamp all values to range [80, 200].

Return ONLY a JSON array, no other text:
[
  {{
    "branch_code": "CS",
    "OC": 200.0,
    "BC": 186.5,
    "BCM": 177.0,
    "MBC": 182.0,
    "SC": 168.0,
    "SCA": 163.0,
    "ST": 150.0
  }}
]"""

    try:
        resp = await get_client().messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        data = json.loads(raw)
        result = {}
        for item in data:
            code = item.get("branch_code")
            if code:
                result[code] = CourseCutoffs(
                    OC=item.get("OC"),
                    BC=item.get("BC"),
                    BCM=item.get("BCM"),
                    MBC=item.get("MBC"),
                    SC=item.get("SC"),
                    SCA=item.get("SCA"),
                    ST=item.get("ST"),
                )
        return result
    except Exception:
        return _fallback_predict_cutoffs(courses)


def _linear_trend(year_oc: dict[str, float]) -> float:
    """
    Compute next-year slope using simple linear regression on OC values keyed by year string.
    Returns the predicted increment for one additional year.
    Falls back to mean of last-3-year deltas if fewer than 3 points.
    """
    if not year_oc:
        return 1.0
    pts = sorted((int(yr), v) for yr, v in year_oc.items() if v is not None)
    if len(pts) < 2:
        return 1.0
    # Use last 6 points max
    pts = pts[-6:]
    if len(pts) == 2:
        return round(pts[-1][1] - pts[-2][1], 2)
    n = len(pts)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    x_mean = sum(xs) / n
    y_mean = sum(ys) / n
    num = sum((xs[i] - x_mean) * (ys[i] - y_mean) for i in range(n))
    den = sum((xs[i] - x_mean) ** 2 for i in range(n))
    return round(num / den, 2) if den else 1.0


def _fallback_predict_cutoffs(courses: list[dict]) -> dict[str, CourseCutoffs]:
    """Regression-based fallback when Claude API is unavailable."""
    CAT_OFFSETS = {"BC": -14, "BCM": -23, "MBC": -18, "SC": -32, "SCA": -37, "ST": -51}
    result = {}
    for c in courses:
        hist = c.get("historical_cutoffs") or {}
        year_oc: dict[str, float] = {}
        for yr in ("2020", "2021", "2022", "2023"):
            val = (hist.get(yr) or {}).get("OC")
            if val is not None:
                year_oc[yr] = val
        oc_2024 = (c.get("cutoffs") or {}).get("OC")
        oc_2025 = (c.get("cutoffs_2025") or {}).get("OC")
        if oc_2024:
            year_oc["2024"] = oc_2024
        if oc_2025:
            year_oc["2025"] = oc_2025

        base_oc = oc_2025 or oc_2024
        if not base_oc:
            continue

        slope = _linear_trend(year_oc)
        # Clamp slope: max +5 for high-demand, min -3 for declining
        slope = max(-3.0, min(5.0, slope))
        oc_2026 = round(min(200.0, max(80.0, base_oc + slope)), 1)

        code = c["branch_code"]
        result[code] = CourseCutoffs(
            OC=oc_2026,
            **{
                cat: round(max(80.0, oc_2026 + offset), 1)
                for cat, offset in CAT_OFFSETS.items()
            },
        )
    return result


def _fallback_summary(reviews: list[str]) -> ReviewSummary:
    """Keyword-based fallback when Claude API is unavailable."""
    if not reviews:
        return ReviewSummary()

    text = " ".join(reviews).lower()
    word_count = len(text.split())
    pos_words = ["excellent", "good", "great", "best", "outstanding", "well", "nice",
                 "quality", "helpful", "friendly", "clean", "safe", "recommend",
                 "placement", "campus", "faculty", "infrastructure", "amazing"]
    neg_words = ["bad", "poor", "worst", "terrible", "horrible", "disappoint",
                 "lack", "issue", "problem", "dirty", "overcrowd", "strict",
                 "attendance", "fees", "expensive", "average", "not good"]

    pos_count = sum(text.count(w) for w in pos_words)
    neg_count = sum(text.count(w) for w in neg_words)
    sentiment = round(5.0 + 5.0 * (pos_count - neg_count) / max(pos_count + neg_count, word_count / 20), 1)
    sentiment = max(1.0, min(10.0, sentiment))

    pros, cons = [], []
    for review in reviews[:5]:
        for s in [s.strip() for s in review.replace("\n", ". ").split(".") if len(s.strip()) > 20]:
            if any(w in s.lower() for w in pos_words) and len(pros) < 3:
                pros.append(s[:80])
            elif any(w in s.lower() for w in neg_words) and len(cons) < 3:
                cons.append(s[:80])

    return ReviewSummary(
        sentiment_score=sentiment,
        pros=pros[:3],
        cons=cons[:3],
        common_complaints=[],
        summary=(reviews[0][:160] + "…") if reviews else "",
    )
