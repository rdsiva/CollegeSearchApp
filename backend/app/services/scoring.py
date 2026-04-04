from app.models.schemas import CollegeDetail, ScoreBreakdown

# Tier mapping for TN cities (score 0-100)
CITY_TIER: dict[str, float] = {
    "Chennai": 100,
    "Coimbatore": 90,
    "Trichy": 85,
    "Madurai": 80,
    "Salem": 75,
    "Vellore": 80,
    "Thanjavur": 70,
    "Tirunelveli": 68,
    "Erode": 65,
    "Tirupur": 65,
    "Dindigul": 60,
    "Cuddalore": 58,
    "Villupuram": 55,
    "Kanchipuram": 72,
    "Tiruvallur": 70,
    "Namakkal": 62,
    "Karur": 60,
    "Pudukkottai": 55,
    "Ramanathapuram": 50,
    "Virudhunagar": 55,
    "Thoothukudi": 60,
    "Kanniyakumari": 58,
}

# Average LPA range across TN colleges (for normalization)
AVG_LPA_MIN = 2.5
AVG_LPA_MAX = 18.0

# TNEA fee range across TN colleges (for normalization)
TNEA_FEE_MIN = 35_000
TNEA_FEE_MAX = 1_50_000


def _normalize(value: float, lo: float, hi: float) -> float:
    """Normalize value to 0-100 range."""
    if hi == lo:
        return 50.0
    return max(0.0, min(100.0, (value - lo) / (hi - lo) * 100))


def calculate_score(college: CollegeDetail) -> ScoreBreakdown:
    # --- Placement (40%) ---
    avg_lpa = college.placement.avg_lpa if college.placement and college.placement.avg_lpa else AVG_LPA_MIN
    placement_score = _normalize(avg_lpa, AVG_LPA_MIN, AVG_LPA_MAX) * 0.40

    # --- Fees affordability (20%) — lower fee = higher score ---
    tnea_fee = college.fees.tnea if college.fees and college.fees.tnea else TNEA_FEE_MAX
    fees_score = _normalize(TNEA_FEE_MAX - tnea_fee, 0, TNEA_FEE_MAX - TNEA_FEE_MIN) * 0.20

    # --- Reviews sentiment (20%) ---
    sentiment = 0.0
    infra = 50.0  # default mid
    if college.reviews:
        if college.reviews.sentiment_score is not None:
            sentiment = college.reviews.sentiment_score  # already 0-10
        # Estimate infra from pros/cons count ratio
        pro_count = len(college.reviews.pros)
        con_count = len(college.reviews.cons)
        if pro_count + con_count > 0:
            infra = (pro_count / (pro_count + con_count)) * 100
    reviews_score = (sentiment / 10.0) * 100 * 0.20

    # --- Infrastructure/faculty (10%) ---
    infra_score = infra * 0.10

    # --- Location/exposure (10%) ---
    city_score = CITY_TIER.get(college.city, 55.0)
    location_score = city_score * 0.10

    total = placement_score + fees_score + reviews_score + infra_score + location_score

    return ScoreBreakdown(
        placement=round(placement_score, 2),
        fees_affordability=round(fees_score, 2),
        reviews_sentiment=round(reviews_score, 2),
        infrastructure=round(infra_score, 2),
        location=round(location_score, 2),
        total=round(total, 2),
    )
