from calculators.tax import calculate_tax
from llm.mistral import call_llm


def run_tax_agent(data: dict) -> dict:
    """
    Step 1: Run tax calculation.
    Step 2: Build Gemini prompt and get AI advice.

    Returns:
    {
      "tax_calc": { ...calculate_tax output... },
      "ai_advice": "..."
    }
    """
    # ── Step 1: Calculate tax ──────────────────────────────────────────────
    tax_calc = calculate_tax(data)

    # ── Step 2: Build missed deductions summary for prompt ─────────────────
    missed = tax_calc.get("missed_deductions", [])
    if missed:
        missed_lines = []
        for m in missed:
            line = (
                f"  - {m['section']}: invested ₹{m['currently_invested']:,.0f} of "
                f"₹{m['max_limit']:,.0f} limit → can save ₹{m['potential_tax_saving']:,.0f} more"
            )
            missed_lines.append(line)
        missed_summary = "\n".join(missed_lines)
    else:
        missed_summary = "  - All major deductions are fully utilised."

    gross          = float(data.get("gross_salary", 0) or 0)
    old_tax        = tax_calc["old_regime_tax"]
    new_tax        = tax_calc["new_regime_tax"]
    recommended    = tax_calc["recommended_regime"].upper()
    savings        = tax_calc["savings_amount"]

    # ── Step 3: Build prompt ───────────────────────────────────────────────
    prompt = f"""You are an expert Indian tax advisor for FY 2025-26. Analyse the tax data below and respond using EXACTLY this markdown structure.

TAX DATA:
- Gross Salary: ₹{gross:,.0f}
- Old Regime Tax: ₹{old_tax:,.0f}
- New Regime Tax: ₹{new_tax:,.0f}
- Recommended Regime: {recommended} (saves ₹{savings:,.0f})
- Missed Deductions:
{missed_summary}

REQUIRED OUTPUT FORMAT (use this exactly):

## Regime Recommendation
Write 2 sentences. State which regime to choose, the exact ₹ amount saved, and why.

## Missed Deductions to Claim
- **Section 80C** — Invest in [instrument], save ₹[amount] in tax
- **Section 80D** — Invest in [instrument], save ₹[amount] in tax
- **Section 80CCD(1B)** — Invest in [instrument], save ₹[amount] in tax
(Only list sections that have unclaimed potential. Skip fully utilised ones.)

## Top 3 Tax-Saving Investments
**1. [Investment Name]**
Section: [section] | Max Benefit: ₹[amount] | Risk: Low/Medium/High | Liquidity: Low/Medium/High
Why: One sentence reason why this ranks #1.

**2. [Investment Name]**
Section: [section] | Max Benefit: ₹[amount] | Risk: Low/Medium/High | Liquidity: Low/Medium/High
Why: One sentence reason.

**3. [Investment Name]**
Section: [section] | Max Benefit: ₹[amount] | Risk: Low/Medium/High | Liquidity: Low/Medium/High
Why: One sentence reason.

Use ₹ amounts throughout. Be specific."""

    ai_advice = call_llm(prompt)

    return {
        "tax_calc": tax_calc,
        "ai_advice": ai_advice,
    }
