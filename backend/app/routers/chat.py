import json
import re
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from app.services import llm
from app.cache import research_cache
from app.limiter import limiter

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str = Field(..., max_length=2000)

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("user", "assistant"):
            raise ValueError("role must be 'user' or 'assistant'")
        return v


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    college_code: Optional[str] = Field(None, max_length=10)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)

    @field_validator("college_code")
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not re.match(r"^[A-Za-z0-9]+$", v):
            raise ValueError("Invalid college code")
        return v


class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str] = []


def _load_college(code: str) -> dict | None:
    # Prefer cached research result — it has LLM-predicted 2026 cutoffs filled in.
    cached = research_cache.get(code)
    if cached is not None:
        return cached.model_dump()

    seed_path = Path(__file__).parent.parent / "data" / "colleges_seed.json"
    with open(seed_path, encoding="utf-8") as f:
        colleges = json.load(f)
    college = next((c for c in colleges if c["code"] == code), None)
    if college is None:
        return None

    # Fill in heuristic 2026 predictions for any course that lacks them, so the
    # chat can answer "what's the predicted 2026 cutoff?" without requiring a
    # prior /research call. Skipped courses (no 2024/2025 OC) stay empty.
    missing = [c for c in college.get("courses", []) if not c.get("cutoffs_2026_predicted")]
    if missing:
        predicted = llm._fallback_predict_cutoffs(missing)
        for c in college["courses"]:
            if not c.get("cutoffs_2026_predicted") and c["branch_code"] in predicted:
                c["cutoffs_2026_predicted"] = predicted[c["branch_code"]].model_dump()
    return college


def _build_context(college: dict) -> str:
    lines = [
        f"College: {college['name']} (TNEA Code: {college['code']})",
        f"Location: {college['city']}, {college['district']}",
        f"Affiliation: {college['affiliation']}",
    ]
    if college.get("nirf_rank"):
        lines.append(f"NIRF Rank: #{college['nirf_rank']}")

    # Branches with multi-year cutoffs
    courses = college.get("courses", [])
    if courses:
        lines.append("\nBranch-wise Cutoffs (OC Category):")
        for c in courses:
            oc_2024 = (c.get("cutoffs") or {}).get("OC", "—")
            oc_2025 = (c.get("cutoffs_2025") or {}).get("OC", "—")
            oc_2026 = (c.get("cutoffs_2026_predicted") or {}).get("OC", "—")
            lines.append(
                f"  {c['branch_name']}: 2024={oc_2024}, 2025={oc_2025}, 2026(pred)={oc_2026}"
            )

    # Fees
    fees = college.get("fees")
    if fees:
        lines.append("\nFees (Annual):")
        if fees.get("tnea"):
            lines.append(f"  Government/TNEA Quota: Rs.{fees['tnea']:,}")
        if fees.get("management"):
            lines.append(f"  Management Quota: Rs.{fees['management']:,}")
        if fees.get("hostel"):
            lines.append(f"  Hostel: Rs.{fees['hostel']:,}")

    # Placement
    placement = college.get("placement")
    if placement:
        lines.append("\nPlacements:")
        if placement.get("avg_lpa"):
            lines.append(f"  Average Package: {placement['avg_lpa']} LPA")
        if placement.get("highest_lpa"):
            lines.append(f"  Highest Package: {placement['highest_lpa']} LPA")
        if placement.get("placement_percentage"):
            lines.append(f"  Placement Rate: {placement['placement_percentage']}%")
        if placement.get("top_companies"):
            lines.append(f"  Top Recruiters: {', '.join(placement['top_companies'][:6])}")

    return "\n".join(lines)


def _build_suggestions(college: dict) -> list[str]:
    name = college["name"].split()[0]
    suggestions = [
        "What is the expected CSE cutoff for 2026?",
        f"How are placements at {name}?",
        "Which branch has the lowest cutoff?",
    ]
    if college.get("fees"):
        suggestions.append("What are the annual fees?")
    if college.get("nirf_rank"):
        suggestions.append(f"What is the NIRF ranking of {name}?")
    suggestions.append("What courses are offered here?")
    return suggestions[:5]


async def _fallback_answer(message: str, college: dict) -> str:
    """Return a data-driven answer when Claude API is unavailable."""
    msg = message.lower()
    context = _build_context(college)

    if any(w in msg for w in ["cutoff", "cut off", "mark", "2026", "2025", "2024"]):
        courses = college.get("courses", [])
        if not courses:
            return "No cutoff data is available for this college yet."
        lines = [f"Cutoffs for {college['name']}:\n"]
        for c in courses:
            oc24 = (c.get("cutoffs") or {}).get("OC", "—")
            oc25 = (c.get("cutoffs_2025") or {}).get("OC", "—")
            oc26 = (c.get("cutoffs_2026_predicted") or {}).get("OC", "—")
            lines.append(f"**{c['branch_name']}**\n  2024: {oc24} | 2025 expected: {oc25} | 2026 predicted: {oc26}")
        return "\n".join(lines)

    if any(w in msg for w in ["hostel", "dorm", "accommodation", "stay", "room", "mess"]):
        fees = college.get("fees") or {}
        hostel_fee = fees.get("hostel")
        if hostel_fee:
            return (
                f"Hostel at {college['name']}:\n"
                f"  Annual fee: ₹{hostel_fee:,}\n"
                f"\nDetailed facility info (rooms, mess, amenities) hasn't been "
                f"collected for this college yet."
            )
        return (
            f"Hostel facility details haven't been collected for {college['name']} yet. "
            f"I can share cutoffs, course fees, or placements if that helps."
        )

    if any(w in msg for w in ["fee", "cost", "price", "money", "rupee"]):
        fees = college.get("fees")
        if not fees:
            return "Fee details are not available for this college."
        parts = []
        if fees.get("tnea"):
            parts.append(f"TNEA/Govt quota: ₹{fees['tnea']:,}/year")
        if fees.get("management"):
            parts.append(f"Management quota: ₹{fees['management']:,}/year")
        if fees.get("hostel"):
            parts.append(f"Hostel: ₹{fees['hostel']:,}/year")
        return f"Fees at {college['name']}:\n" + "\n".join(parts)

    if any(w in msg for w in ["placement", "package", "salary", "lpa", "job", "recruit", "company"]):
        p = college.get("placement")
        if not p:
            return (
                "Placement data hasn't been collected for this college yet. "
                "I can share cutoffs, fees, or courses if that helps."
            )
        lines = [f"Placements at {college['name']}:"]
        if p.get("avg_lpa"):
            lines.append(f"  Average package: {p['avg_lpa']} LPA")
        if p.get("highest_lpa"):
            lines.append(f"  Highest package: {p['highest_lpa']} LPA")
        if p.get("placement_percentage"):
            lines.append(f"  Placement rate: {p['placement_percentage']}%")
        if p.get("top_companies"):
            lines.append(f"  Top recruiters: {', '.join(p['top_companies'])}")
        return "\n".join(lines)

    if any(w in msg for w in ["branch", "course", "department", "offered"]):
        courses = college.get("courses", [])
        if not courses:
            return "Course data is not available for this college."
        names = [c["branch_name"] for c in courses]
        return f"Courses offered at {college['name']}:\n" + "\n".join(f"  • {n}" for n in names)

    # Generic fallback
    return (
        f"Here is what I know about {college['name']}:\n\n{context}\n\n"
        "*(Conversational replies are temporarily unavailable — showing raw data instead.)*"
    )


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(request: Request, req: ChatRequest):
    college = None
    system_prompt = "You are a friendly counselor for Tamil Nadu engineering admissions (TNEA 2026). Answer concisely."

    if req.college_code:
        college = _load_college(req.college_code)
        if not college:
            raise HTTPException(404, f"College {req.college_code} not found")
        context = _build_context(college)
        system_prompt = (
            "You are a TNEA 2026 counselor. Use only the data below to answer the student's question. "
            "Be concise. If specific data the student asks about isn't in the table below, say it "
            "hasn't been collected for this college yet, and offer to share what is available "
            "(cutoffs, fees, courses, NIRF rank).\n\n"
            f"{context}"
        )

    # Build message history for Claude
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    try:
        reply = await llm.chat(messages=messages, system=system_prompt)
        if not reply:
            raise RuntimeError("empty reply")
    except Exception:
        # Fallback to data-driven answer
        if college:
            reply = await _fallback_answer(req.message, college)
        else:
            reply = (
                "I can answer questions about specific colleges. "
                "Click **Ask AI** on any college card to chat about it.\n\n"
                "*(The AI assistant didn't return a reply just now — please try again "
                "in a moment.)*"
            )

    suggestions = _build_suggestions(college) if college else []
    return ChatResponse(reply=reply, suggestions=suggestions)
