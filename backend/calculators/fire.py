from datetime import datetime

ANNUAL_RETURN = 0.12        # 12% per annum assumed
MONTHLY_RATE  = ANNUAL_RETURN / 12   # 1% per month
RULE_OF_25    = 25          # retirement corpus = 25× annual expenses


def calculate_fire(inputs: dict) -> dict:
    """
    Calculate FIRE projections.

    Input keys:
      age                  (int)   — current age
      monthly_income       (float) — take-home per month ₹
      monthly_expenses     (float) — total expenses per month ₹
      existing_investments (float) — current invested corpus ₹
      goals                (list)  — [{ "name": str, "target_amount": float, "years": int }]

    Returns:
    {
      "fire_age": 48,
      "fire_date": "2043",
      "monthly_sip_total": 25000,
      "retirement_corpus_needed": 18000000,
      "corpus_at_fire": 18500000,
      "yearly_projection": [
        { "year": 2025, "age": 30, "corpus": 500000 },
        ...
      ],
      "goal_sips": [
        { "goal_name": "Child education", "target_amount": 2000000, "years": 10, "monthly_sip": 8000 }
      ],
      "monthly_surplus": 40000,
    }
    Never crashes — defaults all missing inputs to 0 / sensible values.
    """
    # ── Parse inputs ──────────────────────────────────────────────────────
    age                  = int(inputs.get("age", 30) or 30)
    monthly_income       = float(inputs.get("monthly_income", 0) or 0)
    monthly_expenses     = float(inputs.get("monthly_expenses", 0) or 0)
    existing_investments = float(inputs.get("existing_investments", 0) or 0)
    goals                = inputs.get("goals") or []

    monthly_surplus = max(0.0, monthly_income - monthly_expenses)

    # ── Retirement corpus needed (25× rule on annual expenses) ────────────
    annual_expenses          = monthly_expenses * 12
    retirement_corpus_needed = annual_expenses * RULE_OF_25

    # ── Per-goal SIP calculation ───────────────────────────────────────────
    goal_sips = []
    total_goal_sip = 0.0

    for goal in goals:
        name          = goal.get("name", "Goal")
        target_amount = float(goal.get("target_amount", 0) or 0)
        years         = float(goal.get("years", 10) or 10)
        months        = years * 12

        if target_amount <= 0 or months <= 0:
            continue

        sip = _sip_required(target_amount, MONTHLY_RATE, months)
        goal_sips.append({
            "goal_name":     name,
            "target_amount": round(target_amount, 2),
            "years":         years,
            "monthly_sip":   round(sip, 2),
        })
        total_goal_sip += sip

    # ── Monthly SIP for FIRE corpus ────────────────────────────────────────
    # We allocate whatever surplus remains after goals toward FIRE
    sip_for_fire = max(0.0, monthly_surplus - total_goal_sip)

    # ── Year-by-year projection until corpus ≥ retirement_corpus_needed ───
    current_year     = datetime.now().year
    corpus           = existing_investments
    fire_age         = None
    fire_year        = None
    yearly_projection = []

    for yr in range(0, 60):   # max 60 years to avoid infinite loop
        proj_age  = age + yr
        proj_year = current_year + yr

        # Record the snapshot at the start of this year
        yearly_projection.append({
            "year":   proj_year,
            "age":    proj_age,
            "corpus": round(corpus, 2),
        })

        # Check FIRE condition
        if corpus >= retirement_corpus_needed and fire_age is None:
            fire_age  = proj_age
            fire_year = str(proj_year)

        if proj_age >= 80:
            break

        # Grow corpus: compound monthly for 12 months + add SIP contributions
        corpus = _grow_corpus_one_year(corpus, sip_for_fire, MONTHLY_RATE)

    # If FIRE was never reached, estimate via formula
    if fire_age is None:
        fire_age  = age + 60
        fire_year = str(current_year + 60)
        corpus_at_fire = yearly_projection[-1]["corpus"] if yearly_projection else 0.0
    else:
        corpus_at_fire = retirement_corpus_needed  # crossed threshold

    # Total monthly SIP needed = goal SIPs + FIRE SIP
    monthly_sip_total = round(total_goal_sip + sip_for_fire, 2)

    return {
        "fire_age":                  fire_age,
        "fire_date":                 fire_year,
        "monthly_sip_total":         monthly_sip_total,
        "monthly_sip_for_fire":      round(sip_for_fire, 2),
        "monthly_surplus":           round(monthly_surplus, 2),
        "retirement_corpus_needed":  round(retirement_corpus_needed, 2),
        "corpus_at_fire":            round(corpus_at_fire, 2),
        "existing_investments":      round(existing_investments, 2),
        "yearly_projection":         yearly_projection,
        "goal_sips":                 goal_sips,
        "assumed_annual_return_pct": ANNUAL_RETURN * 100,
    }


# ── Helpers ───────────────────────────────────────────────────────────────

def _sip_required(future_value: float, monthly_rate: float, months: float) -> float:
    """
    Monthly SIP needed to accumulate future_value in `months` months
    at `monthly_rate` per month.

    Formula: SIP = FV × r / ((1+r)^n - 1)
    """
    if monthly_rate == 0:
        return future_value / months if months else 0.0
    n = months
    r = monthly_rate
    return future_value * r / (((1 + r) ** n) - 1)


def _grow_corpus_one_year(corpus: float, monthly_sip: float, monthly_rate: float) -> float:
    """
    Compound the corpus monthly for 12 months, adding monthly_sip each month.
    Models end-of-month SIP investment.
    """
    for _ in range(12):
        corpus = corpus * (1 + monthly_rate) + monthly_sip
    return corpus
