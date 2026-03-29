from calculators.fire import calculate_fire
from llm.mistral import call_llm


def run_fire_agent(inputs: dict) -> dict:
    """
    Step 1: Run FIRE calculation.
    Step 2: Build Gemini prompt and get AI roadmap.

    Returns:
    {
      "fire_calc": { ...calculate_fire output... },
      "ai_roadmap": "..."
    }
    """
    # ── Step 1: Calculate FIRE ────────────────────────────────────────────
    fire_calc = calculate_fire(inputs)

    # ── Step 2: Build prompt data ─────────────────────────────────────────
    age                 = inputs.get("age", 30)
    monthly_income      = float(inputs.get("monthly_income", 0) or 0)
    monthly_expenses    = float(inputs.get("monthly_expenses", 0) or 0)
    existing            = float(inputs.get("existing_investments", 0) or 0)
    goals               = inputs.get("goals") or []

    monthly_surplus     = fire_calc["monthly_surplus"]
    fire_age            = fire_calc["fire_age"]
    fire_date           = fire_calc["fire_date"]
    sip_total           = fire_calc["monthly_sip_total"]
    corpus_needed       = fire_calc["retirement_corpus_needed"]

    # Goals summary line
    if goals:
        goals_lines = [
            f"  - {g.get('name', 'Goal')}: ₹{float(g.get('target_amount', 0)):,.0f} in {g.get('years', '?')} years"
            for g in goals
        ]
        goals_summary = "\n".join(goals_lines)
    else:
        goals_summary = "  - No specific goals entered"

    # ── Step 3: Build prompt ──────────────────────────────────────────────
    prompt = f"""You are an expert Indian financial planner. Create a motivating FIRE roadmap using EXACTLY this markdown structure.

USER PROFILE:
- Age: {age} | Income: ₹{monthly_income:,.0f}/month | Expenses: ₹{monthly_expenses:,.0f}/month
- Monthly Surplus: ₹{monthly_surplus:,.0f} | Existing Investments: ₹{existing:,.0f}
- Goals:
{goals_summary}

CALCULATED RESULTS:
- FIRE Age: {fire_age} | FIRE Date: {fire_date} | Monthly SIP Needed: ₹{sip_total:,.0f}
- Retirement Corpus Needed: ₹{corpus_needed:,.0f} (25× annual expenses rule)

REQUIRED OUTPUT FORMAT (use this exactly):

## Your FIRE Summary
Write 2-3 exciting but realistic sentences. Highlight the FIRE date and monthly SIP required boldly.

## 6-Month Action Plan
- **Month 1:** Specific action with ₹ amount (e.g. open NPS account, start SIP of ₹X)
- **Month 2:** Specific action with ₹ amount
- **Month 3:** Specific action with ₹ amount
- **Month 4:** Specific action with ₹ amount
- **Month 5:** Specific action with ₹ amount
- **Month 6:** Specific action with ₹ amount

## Asset Allocation by Life Stage
**In Your 20s:** X% Equity | Y% Debt | Z% Gold — one sentence rationale
**In Your 30s:** X% Equity | Y% Debt | Z% Gold — one sentence rationale
**In Your 40s:** X% Equity | Y% Debt | Z% Gold — one sentence rationale
**In Your 50s:** X% Equity | Y% Debt | Z% Gold — one sentence rationale

Tone: motivating but realistic. Use ₹ symbol. Indian market context only."""

    ai_roadmap = call_llm(prompt)

    return {
        "fire_calc": fire_calc,
        "ai_roadmap": ai_roadmap,
    }
