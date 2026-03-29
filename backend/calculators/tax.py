"""
Indian Income Tax Calculator — FY 2025-26

Old Regime slabs (with deductions):
  0 – 2.5L    → 0%
  2.5L – 5L   → 5%
  5L – 10L    → 20%
  > 10L       → 30%
  Rebate 87A: if taxable ≤ ₹5L → tax = 0
  Cess: 4% on tax

New Regime slabs (standard deduction ₹75,000; no other deductions):
  0 – 3L      → 0%
  3L – 6L     → 5%
  6L – 9L     → 10%
  9L – 12L    → 15%
  12L – 15L   → 20%
  > 15L       → 30%
  Rebate 87A: if taxable ≤ ₹7L → tax = 0
  Cess: 4% on tax
"""


# ── Slab engines ───────────────────────────────────────────────────────────

def _apply_slabs(income: float, slabs: list[tuple[float, float]]) -> float:
    """
    Progressive slab tax calculation.
    slabs = [(upper_limit, rate), ...] where last limit is infinity.
    """
    tax = 0.0
    prev = 0.0
    for limit, rate in slabs:
        if income <= prev:
            break
        taxable_in_band = min(income, limit) - prev
        tax += taxable_in_band * rate
        prev = limit
    return tax


_OLD_SLABS = [
    (250000,    0.00),
    (500000,    0.05),
    (1000000,   0.20),
    (float("inf"), 0.30),
]

_NEW_SLABS = [
    (300000,    0.00),
    (600000,    0.05),
    (900000,    0.10),
    (1200000,   0.15),
    (1500000,   0.20),
    (float("inf"), 0.30),
]

_CESS = 0.04


def _add_cess(tax: float) -> float:
    return round(tax * (1 + _CESS), 2)


def _old_regime_tax(taxable_income: float) -> float:
    slab_tax = _apply_slabs(taxable_income, _OLD_SLABS)
    if taxable_income <= 500000:   # Rebate 87A
        slab_tax = 0.0
    return _add_cess(slab_tax)


def _new_regime_tax(taxable_income: float) -> float:
    slab_tax = _apply_slabs(taxable_income, _NEW_SLABS)
    if taxable_income <= 700000:   # Rebate 87A
        slab_tax = 0.0
    return _add_cess(slab_tax)


# ── Main function ──────────────────────────────────────────────────────────

def calculate_tax(data: dict) -> dict:
    """
    Calculate income tax under both regimes and identify missed deductions.

    Input dict keys (all optional, default 0):
      gross_salary, hra_received, standard_deduction,
      section_80c, section_80d, section_80ccd, tds_deducted

    Returns:
    {
      "old_regime_tax": 85000,
      "new_regime_tax": 62000,
      "recommended_regime": "new",
      "savings_amount": 23000,
      "taxable_income_old": 720000,
      "taxable_income_new": 845000,
      "missed_deductions": [...]
    }
    """
    gross      = float(data.get("gross_salary", 0) or 0)
    hra        = float(data.get("hra_received", 0) or 0)
    std_ded    = float(data.get("standard_deduction", 0) or 0)
    s80c       = min(float(data.get("section_80c", 0) or 0), 150000.0)
    s80d       = min(float(data.get("section_80d", 0) or 0), 25000.0)
    s80ccd     = min(float(data.get("section_80ccd", 0) or 0), 50000.0)
    tds        = float(data.get("tds_deducted", 0) or 0)

    # ── Old Regime ─────────────────────────────────────────────────────────
    # Deductions: HRA + standard deduction + 80C + 80D + 80CCD
    # Standard deduction in old regime = ₹50,000 (unless user-provided)
    old_std_ded = std_ded if std_ded > 0 else 50000.0
    old_total_deductions = old_std_ded + hra + s80c + s80d + s80ccd
    taxable_old = max(0.0, gross - old_total_deductions)
    old_tax = _old_regime_tax(taxable_old)

    # ── New Regime ─────────────────────────────────────────────────────────
    # Only standard deduction of ₹75,000; no other deductions
    new_std_ded = 75000.0
    taxable_new = max(0.0, gross - new_std_ded)
    new_tax = _new_regime_tax(taxable_new)

    # ── Recommendation ─────────────────────────────────────────────────────
    if old_tax <= new_tax:
        recommended = "old"
        savings = round(new_tax - old_tax, 2)
    else:
        recommended = "new"
        savings = round(old_tax - new_tax, 2)

    # ── Missed deductions ──────────────────────────────────────────────────
    missed = []

    # 80C: max ₹1,50,000
    if s80c < 150000:
        gap = 150000 - s80c
        # Tax saving = gap × 20% (conservative mid-bracket estimate) × 1.04 cess
        saving = round(gap * 0.20 * 1.04, 2)
        missed.append({
            "section": "80C",
            "description": "ELSS, PPF, LIC, EPF, NSC, 5-yr FD, Home Loan Principal",
            "max_limit": 150000,
            "currently_invested": s80c,
            "potential_tax_saving": saving,
        })

    # 80D: max ₹25,000
    if s80d < 25000:
        gap = 25000 - s80d
        saving = round(gap * 0.20 * 1.04, 2)
        missed.append({
            "section": "80D",
            "description": "Health insurance premium (self, spouse, children)",
            "max_limit": 25000,
            "currently_invested": s80d,
            "potential_tax_saving": saving,
        })

    # 80CCD(1B) NPS: max ₹50,000
    if s80ccd < 50000:
        gap = 50000 - s80ccd
        saving = round(gap * 0.20 * 1.04, 2)
        missed.append({
            "section": "80CCD(1B)",
            "description": "Additional NPS contribution (over 80C limit)",
            "max_limit": 50000,
            "currently_invested": s80ccd,
            "potential_tax_saving": saving,
        })

    return {
        "old_regime_tax":     round(old_tax, 2),
        "new_regime_tax":     round(new_tax, 2),
        "recommended_regime": recommended,
        "savings_amount":     savings,
        "taxable_income_old": round(taxable_old, 2),
        "taxable_income_new": round(taxable_new, 2),
        "tds_deducted":       round(tds, 2),
        "refund_or_due":      round(tds - (old_tax if recommended == "old" else new_tax), 2),
        "missed_deductions":  missed,
    }
