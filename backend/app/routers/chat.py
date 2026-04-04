import json
import re
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from app.services import claude_ai
from app.main import limiter

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
    seed_path = Path(__file__).parent.parent / "data" / "colleges_seed.json"
    with open(seed_path, encoding="utf-8") as f:
        colleges = json.load(f)
    return next((c for c in colleges if c["code"] == code), None)


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
            return "Placement data is not available for this college."
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
        "*(AI summarization is temporarily unavailable. Please update the ANTHROPIC_API_KEY in backend/.env for full AI answers.)*"
    )


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(request: Request, req: ChatRequest):
    college = None
    system_prompt = (
        "You are a helpful Tamil Nadu engineering college counselor assisting students with "
        "TNEA 2026 admissions. Be concise, factual, and friendly.\n\n"
        "Formatting rules (always follow these):\n"
        "- Use ## for section headers\n"
        "- Use bullet points with - for lists\n"
        "- Use **bold** for key numbers and important values\n"
        "- When quoting cutoffs, always clarify whether they are 2024 actual, 2025 expected, or 2026 predicted\n"
        "- Keep answers well-structured with clear sections"
    )

    if req.college_code:
        college = _load_college(req.college_code)
        if not college:
            raise HTTPException(404, f"College {req.college_code} not found")
        context = _build_context(college)
        system_prompt = (
            f"You are a Tamil Nadu engineering college counselor. The student is asking about:\n\n"
            f"{context}\n\n"
            "Answer questions about this college based on the data above.\n\n"
            "Formatting rules (important — always follow these):\n"
            "- Use ## for section headers (e.g., ## Cutoff Marks, ## Fees, ## Placements)\n"
            "- Use bullet points with - for lists\n"
            "- Use **bold** for key numbers, branch names, and important values\n"
            "- Keep answers concise but well-structured\n"
            "- For cutoffs, always clarify the year (2024 actual / 2025 expected / 2026 predicted)\n"
            "- If data is not available, say so honestly\n"
            "- Never use plain paragraphs for data — always use headers and bullets"
        )

    # Build message history for Claude
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})

    try:
        client = claude_ai.get_client()
        resp = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=system_prompt,
            messages=messages,
        )
        reply = resp.content[0].text.strip()
    except Exception:
        # Fallback to data-driven answer
        if college:
            reply = await _fallback_answer(req.message, college)
        else:
            reply = (
                "I can answer questions about specific colleges. "
                "Click **Ask AI** on any college card to chat about it. "
                "*(AI service is temporarily unavailable — please update ANTHROPIC_API_KEY)*"
            )

    suggestions = _build_suggestions(college) if college else []
    return ChatResponse(reply=reply, suggestions=suggestions)
