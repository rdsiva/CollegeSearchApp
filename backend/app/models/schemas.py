from pydantic import BaseModel, Field, field_validator
from typing import Optional


class CourseCutoffs(BaseModel):
    OC: Optional[float] = None
    BC: Optional[float] = None
    BCM: Optional[float] = None
    MBC: Optional[float] = None
    SC: Optional[float] = None
    ST: Optional[float] = None
    SCA: Optional[float] = None


class Course(BaseModel):
    branch_code: str
    branch_name: str
    cutoffs: CourseCutoffs                                   # 2024 actual
    cutoffs_2025: Optional[CourseCutoffs] = None             # 2025 actual
    cutoffs_2026_predicted: Optional[CourseCutoffs] = None   # 2026 LLM prediction
    historical_cutoffs: dict[str, CourseCutoffs] = {}        # "2020"–"2023" keyed by year


class Fees(BaseModel):
    tnea: Optional[int] = None
    management: Optional[int] = None
    hostel: Optional[int] = None
    transport: Optional[int] = None


class Placement(BaseModel):
    avg_lpa: Optional[float] = None
    highest_lpa: Optional[float] = None
    top_companies: list[str] = []
    placement_percentage: Optional[float] = None


class CollegeSeed(BaseModel):
    code: str
    anna_university_code: str
    name: str
    city: str
    district: str
    affiliation: str
    approved_by: list[str] = []
    courses: list[Course] = []
    google_place_id: Optional[str] = None
    nirf_rank: Optional[int] = None
    fees: Optional[Fees] = None
    placement: Optional[Placement] = None


class CollegeMatch(BaseModel):
    code: str
    name: str
    city: str
    district: str
    affiliation: str
    courses: list[str] = []


class SearchResponse(BaseModel):
    matches: list[CollegeMatch]
    exact: bool = False


class ReviewSummary(BaseModel):
    google_rating: Optional[float] = None
    sentiment_score: Optional[float] = None
    pros: list[str] = []
    cons: list[str] = []
    common_complaints: list[str] = []
    summary: Optional[str] = None
    review_texts: list[str] = []


class ScoreBreakdown(BaseModel):
    placement: float = 0
    fees_affordability: float = 0
    reviews_sentiment: float = 0
    infrastructure: float = 0
    location: float = 0
    total: float = 0


class YouTubeVideo(BaseModel):
    title: str
    url: str
    description: Optional[str] = None


class CollegeDetail(BaseModel):
    code: str
    anna_university_code: str
    name: str
    city: str
    district: str
    affiliation: str
    approved_by: list[str] = []
    nirf_rank: Optional[int] = None
    courses: list[Course] = []
    fees: Optional[Fees] = None
    placement: Optional[Placement] = None
    reviews: Optional[ReviewSummary] = None
    score: Optional[float] = None
    score_breakdown: Optional[ScoreBreakdown] = None
    youtube_videos: list[YouTubeVideo] = []


class ResearchRequest(BaseModel):
    college_codes: list[str] = Field(..., min_length=1, max_length=20)

    @field_validator("college_codes")
    @classmethod
    def validate_codes(cls, v: list[str]) -> list[str]:
        for code in v:
            if not code.isalnum() or len(code) > 10:
                raise ValueError(f"Invalid college code: {code!r}")
        return v


class ExportRequest(BaseModel):
    colleges: list[CollegeDetail] = Field(..., max_length=50)
