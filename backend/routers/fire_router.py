from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
from typing import Optional

from agents.fire_agent import run_fire_agent

router = APIRouter()


# ── Request schema ─────────────────────────────────────────────────────────

class GoalItem(BaseModel):
    name:          str   = Field(..., min_length=1, max_length=60)
    target_amount: float = Field(..., gt=0)
    years:         float = Field(..., gt=0, le=50)


class FIRERequest(BaseModel):
    age:                  int   = Field(..., ge=18, le=60)
    monthly_income:       float = Field(..., gt=0)
    monthly_expenses:     float = Field(..., gt=0)
    existing_investments: float = Field(0.0, ge=0)
    goals:                list[GoalItem] = Field(default_factory=list)

    @model_validator(mode="after")
    def income_must_exceed_expenses(self) -> "FIRERequest":
        if self.monthly_income <= self.monthly_expenses:
            raise ValueError(
                f"Monthly income (₹{self.monthly_income:,.0f}) must be greater than "
                f"monthly expenses (₹{self.monthly_expenses:,.0f})."
            )
        return self


# ── Endpoint ───────────────────────────────────────────────────────────────

@router.post("/api/fire")
async def fire_plan(request: FIRERequest):
    """
    Accept investor profile and return a full FIRE projection + AI roadmap.

    Validates:
      - age between 18 and 60
      - monthly_income > monthly_expenses
      - goals list can be empty but each goal must have name, target_amount, years

    Returns FIRE analysis or { "error": "..." }
    """
    inputs = {
        "age":                  request.age,
        "monthly_income":       request.monthly_income,
        "monthly_expenses":     request.monthly_expenses,
        "existing_investments": request.existing_investments,
        "goals":                [g.model_dump() for g in request.goals],
    }

    try:
        result = run_fire_agent(inputs)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"FIRE calculation failed: {str(e)}. Please try again."},
        )
