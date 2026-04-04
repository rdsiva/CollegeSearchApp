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
    Use Claude to predict 2026 TNEA cutoffs for each branch.
    Returns dict keyed by branch_code -> CourseCutoffs.
    """
    # Build branch summary for prompt
    branch_lines = []
    for c in courses:
        oc_2024 = (c.get("cutoffs") or {}).get("OC")
        oc_2025 = (c.get("cutoffs_2025") or {}).get("OC")
        bc_2024 = (c.get("cutoffs") or {}).get("BC")
        mbc_2024 = (c.get("cutoffs") or {}).get("MBC")
        sc_2024 = (c.get("cutoffs") or {}).get("SC")
        if oc_2024 or oc_2025:
            branch_lines.append(
                f'  Branch: {c["branch_name"]} (Code: {c["branch_code"]})\n'
                f'    2024: OC={oc_2024}, BC={bc_2024}, MBC={mbc_2024}, SC={sc_2024}\n'
                f'    2025 expected OC: {oc_2025 if oc_2025 else "not available"}'
            )

    if not branch_lines:
        return {}

    prompt = f"""You are a TNEA (Tamil Nadu Engineering Admissions) counselling expert predicting 2026 cutoffs.

College: {college_name}

Historical cutoff data:
{chr(10).join(branch_lines)}

TNEA Cutoff Trends (2024 to 2026):
- CSE, IT, Artificial Intelligence, Data Science, Cyber Security: Demand is rising, typically +3 to +5 marks over 2 years
- ECE, EEE: Moderate demand, +1 to +2 marks
- Mechanical, Civil, Chemical: Stable or slight decrease, 0 to -2 marks
- Category gap (BC = OC - 13 to 15, MBC = OC - 17 to 20, SC = OC - 30 to 35, ST = OC - 50, SCA = OC - 37, BCM = OC - 22 to 25)

Based on this data, predict realistic 2026 TNEA cutoffs for each branch.

Return ONLY a JSON array, no other text:
[
  {{
    "branch_code": "CSE",
    "OC": 185.5,
    "BC": 171.0,
    "BCM": 162.0,
    "MBC": 167.0,
    "SC": 152.0,
    "SCA": 148.0,
    "ST": 135.0
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


def _fallback_predict_cutoffs(courses: list[dict]) -> dict[str, CourseCutoffs]:
    """Simple trend-based fallback when Claude API is unavailable."""
    TREND = {"CSE": 3, "IT": 2.5, "AI": 3, "ECE": 1.5, "EEE": 0.5, "MECH": 0, "CIVIL": 0}
    CAT_OFFSETS = {"BC": -14, "BCM": -23, "MBC": -18, "SC": -32, "SCA": -37, "ST": -51}
    result = {}
    for c in courses:
        oc = (c.get("cutoffs_2025") or c.get("cutoffs") or {}).get("OC")
        if not oc:
            continue
        code = c["branch_code"]
        trend = TREND.get(code, 1.0)
        oc_2026 = round(oc + trend, 1)
        result[code] = CourseCutoffs(
            OC=oc_2026,
            BC=round(max(oc_2026 - 14, 80), 1),
            BCM=round(max(oc_2026 - 23, 80), 1),
            MBC=round(max(oc_2026 - 18, 80), 1),
            SC=round(max(oc_2026 - 32, 80), 1),
            SCA=round(max(oc_2026 - 37, 80), 1),
            ST=round(max(oc_2026 - 51, 80), 1),
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
