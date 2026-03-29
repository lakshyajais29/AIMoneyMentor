from calculators.xirr import calculate_xirr
from calculators.overlap import detect_overlap
from llm.mistral import call_llm

# ── Hardcoded expense ratios for top 50 Indian MFs (direct plans, %) ──────
EXPENSE_RATIOS: dict[str, float] = {
    # Large Cap
    "mirae asset large cap fund":          0.54,
    "axis bluechip fund":                  0.45,
    "sbi bluechip fund":                   0.85,
    "hdfc top 100 fund":                   0.97,
    "icici prudential bluechip fund":      1.07,
    "nippon india large cap fund":         0.94,
    "kotak bluechip fund":                 0.65,
    "dsp top 100 equity fund":             0.99,
    # Mid Cap
    "axis midcap fund":                    0.51,
    "kotak emerging equity fund":          0.39,
    "dsp midcap fund":                     0.77,
    "hdfc mid-cap opportunities fund":     0.84,
    "nippon india growth fund":            0.92,
    "sbi magnum midcap fund":              0.86,
    # Small Cap
    "sbi small cap fund":                  0.67,
    "axis small cap fund":                 0.53,
    "nippon india small cap fund":         0.77,
    "kotak small cap fund":                0.41,
    "hdfc small cap fund":                 0.62,
    "quant small cap fund":                0.62,
    # Flexi Cap
    "parag parikh flexi cap fund":         0.63,
    "axis flexi cap fund":                 0.71,
    "hdfc flexi cap fund":                 0.80,
    "sbi flexicap fund":                   0.88,
    "kotak flexi cap fund":                0.50,
    # ELSS
    "axis long term equity fund":          0.49,
    "mirae asset elss tax saver fund":     0.47,
    "quant elss tax saver fund":           0.57,
    "sbi long term equity fund":           0.90,
    # Index
    "uti nifty 50 index fund":             0.10,
    "hdfc index fund nifty 50 plan":       0.10,
    "sbi nifty index fund":                0.10,
    "motilal oswal nifty 50 index fund":   0.10,
    "icici prudential nifty 50 index":     0.10,
    # Hybrid
    "hdfc balanced advantage fund":        0.76,
    "icici prudential balanced advantage": 0.95,
    "sbi equity hybrid fund":              0.83,
    # Debt
    "hdfc short term debt fund":           0.35,
    "icici prudential corporate bond":     0.37,
    "sbi magnum medium duration fund":     0.78,
    # International
    "motilal oswal nasdaq 100 fund":       0.58,
    # Liquid
    "sbi liquid fund":                     0.20,
    "hdfc liquid fund":                    0.27,
    "nippon india liquid fund":            0.22,
}

_BENCHMARK_XIRR = 14.2  # Nifty 50 5-year annualised return


def _lookup_expense_ratio(fund_name: str) -> float:
    """Return expense ratio for a fund name (case-insensitive). Default 1.0%."""
    lower = fund_name.lower().strip()
    if lower in EXPENSE_RATIOS:
        return EXPENSE_RATIOS[lower]
    for key, er in EXPENSE_RATIOS.items():
        if key in lower or lower in key:
            return er
    return 1.0  # generic default for unknown funds


def run_xray_agent(parsed_cams: dict) -> dict:
    """
    Orchestrate the full X-Ray analysis pipeline.

    Steps:
      1. Calculate XIRR per fund
      2. Detect overlap
      3. Calculate average expense ratio
      4. Call Gemini for AI rebalancing advice

    Returns:
    {
      "xirr": 11.2,
      "fund_xirrs": [{"name": "...", "xirr": 12.1}, ...],
      "overlap": [...],
      "avg_expense_ratio": 1.4,
      "fund_count": 5,
      "total_invested": 150000,
      "total_current_value": 180000,
      "ai_advice": "..."
    }
    """
    funds = parsed_cams.get("funds", [])
    total_invested = parsed_cams.get("total_invested", 0.0)

    # ── Step 1: Per-fund XIRR ─────────────────────────────────────────────
    fund_xirrs = []
    all_xirr_values = []
    total_current_value = 0.0

    for fund in funds:
        xirr_val = calculate_xirr(fund)
        current_value = (fund.get("current_units") or 0.0) * (fund.get("current_nav") or 0.0)
        total_current_value += current_value
        fund_xirrs.append({
            "name": fund.get("name", "Unknown Fund"),
            "xirr": xirr_val,
            "current_value": round(current_value, 2),
            "expense_ratio": _lookup_expense_ratio(fund.get("name", "")),
        })
        if xirr_val > 0:
            all_xirr_values.append(xirr_val)

    # Portfolio-level XIRR = simple average of positive fund XIRRs
    portfolio_xirr = round(sum(all_xirr_values) / len(all_xirr_values), 2) if all_xirr_values else 0.0

    # ── Step 2: Overlap detection ─────────────────────────────────────────
    fund_names = [f.get("name", "") for f in funds]
    overlap = detect_overlap(fund_names)

    overlap_summary = "None detected"
    if overlap:
        parts = [
            f"{o['category_label']} ({', '.join(o['funds'][:2])}{'...' if len(o['funds']) > 2 else ''})"
            for o in overlap
        ]
        overlap_summary = "; ".join(parts)

    # ── Step 3: Average expense ratio ─────────────────────────────────────
    expense_ratios = [f["expense_ratio"] for f in fund_xirrs]
    avg_expense_ratio = round(sum(expense_ratios) / len(expense_ratios), 2) if expense_ratios else 0.0

    # ── Step 4: Mistral AI advice ─────────────────────────────────────────
    prompt = f"""You are an expert Indian mutual fund advisor. Analyse the portfolio data below and respond using EXACTLY this markdown structure — no deviations.

PORTFOLIO DATA:
- Overall XIRR: {portfolio_xirr}%
- Nifty 50 benchmark (5-year): {_BENCHMARK_XIRR}%
- Total Funds: {len(funds)}
- Fund Names: {', '.join(fund_names)}
- Overlap Detected: {overlap_summary}
- Average Expense Ratio: {avg_expense_ratio}%
- Total Invested: ₹{total_invested:,.0f}
- Current Value: ₹{total_current_value:,.0f}

REQUIRED OUTPUT FORMAT (use this exactly):

## Portfolio Health
Write 2-3 direct, honest sentences about the portfolio's overall performance vs the benchmark.

## Key Problems Found
- Problem 1 with specific ₹ or % figures
- Problem 2 with specific ₹ or % figures
- Problem 3 with specific ₹ or % figures
- Problem 4 with specific ₹ or % figures (max 4 bullets)

## Action Plan
**Priority 1:** Specific action with exact fund name or category and ₹ amount
**Priority 2:** Specific action with exact fund name or category and ₹ amount
**Priority 3:** Specific action with exact fund name or category and ₹ amount
**Priority 4:** Specific action with exact fund name or category and ₹ amount

Use simple language. Retail investor audience. Always use ₹ symbol."""

    ai_advice = call_llm(prompt)

    return {
        "xirr": portfolio_xirr,
        "fund_xirrs": fund_xirrs,
        "overlap": overlap,
        "avg_expense_ratio": avg_expense_ratio,
        "fund_count": len(funds),
        "total_invested": round(total_invested, 2),
        "total_current_value": round(total_current_value, 2),
        "ai_advice": ai_advice,
    }
