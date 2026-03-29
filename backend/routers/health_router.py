"""
/api/health — Money Health Score router.

Endpoints:
  POST /api/health/score  — compute score from 6 slider inputs
  GET  /api/health/sample — return sample score for demo

The Money Health Score is computed entirely in Python (no LLM call needed)
using a weighted rubric across 6 financial wellness dimensions.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["Money Health Score"])


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class HealthScoreRequest(BaseModel):
    # All sliders: 1 (worst) to 10 (best)
    emergency_fund: int = Field(..., ge=1, le=10,
        description="Months of expenses as emergency fund (1=none, 10=6+ months)")
    debt_burden: int = Field(..., ge=1, le=10,
        description="EMI as % of income (1=very high >50%, 10=zero debt)")
    savings_rate: int = Field(..., ge=1, le=10,
        description="Monthly savings rate (1=<5%, 10=>30%)")
    investment_diversity: int = Field(..., ge=1, le=10,
        description="Asset classes invested in (1=only FD, 10=equity+debt+gold+RE)")
    insurance_coverage: int = Field(..., ge=1, le=10,
        description="Life+health insurance coverage (1=none, 10=fully covered)")
    retirement_readiness: int = Field(..., ge=1, le=10,
        description="On track for retirement corpus (1=no plan, 10=on track)")

    # Optional context for better tips
    age: int = Field(30, ge=18, le=80)
    monthly_income: float = Field(0.0, ge=0)


# ---------------------------------------------------------------------------
# Dimension config
# ---------------------------------------------------------------------------

_DIMENSIONS = [
    {
        "key": "emergency_fund",
        "label": "Emergency Fund",
        "weight": 20,
        "icon": "🛡️",
        "tips": {
            "low": [
                "Start with a ₹10,000 liquid fund as your emergency seed.",
                "Set up auto-transfer of ₹2,000/month to a separate savings account.",
                "Target 3 months of expenses before investing elsewhere.",
            ],
            "mid": [
                "Aim for 6 months of expenses in a liquid/overnight fund.",
                "Use a sweep-in FD for better returns while keeping liquidity.",
            ],
            "high": [
                "Great emergency fund! Now focus on optimising returns on this buffer.",
                "Consider moving half to a liquid mutual fund for better yields than savings account.",
            ],
        },
    },
    {
        "key": "debt_burden",
        "label": "Debt Burden",
        "weight": 20,
        "icon": "💳",
        "tips": {
            "low": [
                "High EMI burden is your #1 financial risk. Prioritise debt repayment.",
                "Use the avalanche method — pay highest-interest debt first.",
                "Avoid new credit card debt; use UPI/debit instead.",
            ],
            "mid": [
                "Debt is manageable but aim to reduce EMI below 30% of income.",
                "Consider part-prepayment of home loan to reduce interest outgo.",
            ],
            "high": [
                "Excellent debt position! You're saving more of what you earn.",
                "Consider leveraging low-cost home loan for tax benefits under 24(b).",
            ],
        },
    },
    {
        "key": "savings_rate",
        "label": "Savings Rate",
        "weight": 20,
        "icon": "💰",
        "tips": {
            "low": [
                "Track every rupee for 1 month — awareness is the first step.",
                "Cancel unused subscriptions — ₹500/month saved = ₹1.2L in 20 years.",
                "Automate savings on salary day — pay yourself first.",
            ],
            "mid": [
                "Good savings habit! Try the 50-30-20 rule: needs, wants, savings.",
                "Increase savings by 1% every 6 months — it compounds significantly.",
            ],
            "high": [
                "Excellent savings rate! Focus now on putting this to work via SIPs.",
                "Avoid over-saving in low-yield instruments — invest in equity for long-term.",
            ],
        },
    },
    {
        "key": "investment_diversity",
        "label": "Investment Diversity",
        "weight": 15,
        "icon": "📊",
        "tips": {
            "low": [
                "FD alone loses to inflation — start a ₹500/month ELSS SIP today.",
                "Diversify across equity, debt, and gold for better risk-adjusted returns.",
                "Index funds are the easiest first step into equity investing.",
            ],
            "mid": [
                "Good start! Add international exposure via global ETFs.",
                "Consider Sovereign Gold Bonds (2.5% interest + gold appreciation).",
            ],
            "high": [
                "Well-diversified portfolio! Review asset allocation annually.",
                "Rebalance to target allocation every year — buy low, sell high automatically.",
            ],
        },
    },
    {
        "key": "insurance_coverage",
        "label": "Insurance Coverage",
        "weight": 15,
        "icon": "🏥",
        "tips": {
            "low": [
                "Life insurance is urgent if you have dependents — term plan first.",
                "Buy a ₹10L family floater mediclaim — premium is <₹1,000/month.",
                "Never mix insurance with investment — avoid ULIPs and endowment plans.",
            ],
            "mid": [
                "Top up your health insurance with a super top-up plan for catastrophic cover.",
                "Critical illness rider costs ~₹1,500/year and covers 36+ conditions.",
            ],
            "high": [
                "Fully insured — great! Review sum assured every 5 years as income grows.",
                "Ensure health insurance has no sub-limits and includes modern treatment.",
            ],
        },
    },
    {
        "key": "retirement_readiness",
        "label": "Retirement Readiness",
        "weight": 10,
        "icon": "🎯",
        "tips": {
            "low": [
                "Start a ₹1,000/month NPS contribution today — it compounds powerfully.",
                "Use our FIRE Planner to calculate your retirement corpus target.",
                "Even 10 years of equity SIP can fund a comfortable retirement.",
            ],
            "mid": [
                "You're on track — increase SIP by 10% every year (step-up SIP).",
                "Maximise EPF voluntary contribution for risk-free 8.25% p.a. return.",
            ],
            "high": [
                "Retirement is well covered! Focus on estate planning and will creation.",
                "Consider creating a passive income stream — rental property or REITs.",
            ],
        },
    },
]


# ---------------------------------------------------------------------------
# Score computation
# ---------------------------------------------------------------------------

def _compute_score(request: HealthScoreRequest) -> dict:
    """Compute Money Health Score (0–100) with dimension breakdown and tips."""
    scores = {
        "emergency_fund": request.emergency_fund,
        "debt_burden": request.debt_burden,
        "savings_rate": request.savings_rate,
        "investment_diversity": request.investment_diversity,
        "insurance_coverage": request.insurance_coverage,
        "retirement_readiness": request.retirement_readiness,
    }

    total_weighted = 0.0
    total_weight = sum(d["weight"] for d in _DIMENSIONS)
    dimension_results = []

    for dim in _DIMENSIONS:
        key = dim["key"]
        raw_score = scores[key]  # 1–10
        weight = dim["weight"]
        weighted_contribution = (raw_score / 10) * weight
        total_weighted += weighted_contribution

        # Determine tip tier
        if raw_score <= 3:
            tier = "low"
        elif raw_score <= 7:
            tier = "mid"
        else:
            tier = "high"

        tips = dim["tips"][tier][:2]  # max 2 tips per dimension
        pct_of_max = round(raw_score / 10 * 100, 0)

        dimension_results.append({
            "key": key,
            "label": dim["label"],
            "icon": dim["icon"],
            "score": raw_score,
            "max_score": 10,
            "weight": weight,
            "weighted_score": round(weighted_contribution, 2),
            "pct_of_max": pct_of_max,
            "tips": tips,
        })

    overall_score = round(total_weighted, 1)

    # Grade
    if overall_score >= 80:
        grade, grade_label = "A", "Excellent"
        color = "#22c55e"  # green
    elif overall_score >= 65:
        grade, grade_label = "B", "Good"
        color = "#84cc16"  # lime
    elif overall_score >= 50:
        grade, grade_label = "C", "Needs Work"
        color = "#f59e0b"  # amber
    elif overall_score >= 35:
        grade, grade_label = "D", "At Risk"
        color = "#f97316"  # orange
    else:
        grade, grade_label = "F", "Critical"
        color = "#ef4444"  # red

    # Priority action: lowest-scoring dimension
    weakest = min(dimension_results, key=lambda d: d["score"])
    strongest = max(dimension_results, key=lambda d: d["score"])

    # Age-adjusted insights
    age_insights = _age_insights(request.age, scores)

    return {
        "overall_score": overall_score,
        "grade": grade,
        "grade_label": grade_label,
        "color": color,
        "dimensions": dimension_results,
        "weakest_dimension": weakest["label"],
        "strongest_dimension": strongest["label"],
        "priority_action": weakest["tips"][0] if weakest["tips"] else "Focus on your finances today.",
        "age_insights": age_insights,
        "summary": _build_summary(overall_score, grade_label, weakest["label"]),
    }


def _build_summary(score: float, grade_label: str, weakest: str) -> str:
    return (
        f"Your Money Health Score is {score}/100 — {grade_label}. "
        f"Your weakest area is {weakest}. "
        "Small, consistent improvements across all dimensions can dramatically improve your financial wellbeing."
    )


def _age_insights(age: int, scores: dict) -> list[str]:
    insights = []
    if age < 30:
        insights.append("You're in your 20s — time is your superpower. Even small SIPs started now will dwarf larger ones started later.")
        if scores.get("investment_diversity", 5) < 5:
            insights.append("At your age, 80%+ equity allocation is appropriate. Shift from FDs to equity MFs.")
    elif age < 40:
        insights.append("Your 30s are peak earning years — maximise savings rate and invest aggressively.")
        if scores.get("insurance_coverage", 5) < 7:
            insights.append("With a growing family, ensure ₹1 crore+ term plan and ₹10L+ health cover.")
    elif age < 50:
        insights.append("In your 40s, begin shifting 20-30% to debt instruments for capital protection.")
        if scores.get("retirement_readiness", 5) < 7:
            insights.append("Retirement is 15-20 years away — run a FIRE calculation today.")
    else:
        insights.append("In your 50s, capital preservation matters. Reduce equity to 50-60% of portfolio.")
        insights.append("Create a will and nominate beneficiaries for all financial instruments.")
    return insights


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/score", summary="Compute Money Health Score from slider inputs")
async def compute_health_score(request: HealthScoreRequest) -> JSONResponse:
    """
    Accept 6 financial wellness slider inputs (1-10 each) and return:
    - Overall score out of 100
    - Dimension-wise breakdown
    - Personalised improvement tips
    - Financial grade (A–F)
    """
    try:
        result = _compute_score(request)
        return JSONResponse(content={"success": True, "data": result})
    except Exception as exc:
        logger.exception("Health score computation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Score computation failed: {exc}",
        )


@router.get("/sample", summary="Get a sample Money Health Score for demo")
async def get_sample_score() -> JSONResponse:
    """Return a pre-computed sample health score for demo/UI testing."""
    sample_request = HealthScoreRequest(
        emergency_fund=6,
        debt_burden=7,
        savings_rate=5,
        investment_diversity=4,
        insurance_coverage=8,
        retirement_readiness=4,
        age=32,
        monthly_income=120000,
    )
    result = _compute_score(sample_request)
    return JSONResponse(content={"success": True, "data": result})
