from datetime import date, datetime
from pyxirr import xirr as pyxirr_compute


def calculate_xirr(fund: dict) -> float:
    """
    Calculate XIRR for a single fund.

    Purchases  → negative cashflows
    Redemptions → positive cashflows
    Current value (current_units × current_nav) → final positive cashflow at today's date

    Returns XIRR as a percentage rounded to 2 decimal places.
    Returns 0.0 on any edge case (single transaction, zero units/NAV, computation failure).
    Never crashes.
    """
    transactions = fund.get("transactions", [])
    current_units = fund.get("current_units", 0.0) or 0.0
    current_nav   = fund.get("current_nav", 0.0) or 0.0

    # Edge cases
    if not transactions:
        return 0.0
    if current_units <= 0 or current_nav <= 0:
        return 0.0

    dates   = []
    amounts = []

    for txn in transactions:
        txn_date = _parse_date(txn.get("date", ""))
        if txn_date is None:
            continue

        amount = float(txn.get("amount", 0) or 0)
        if amount == 0:
            continue

        txn_type = str(txn.get("type", "purchase")).lower()

        if txn_type in ("purchase", "switch_in"):
            dates.append(txn_date)
            amounts.append(-abs(amount))           # outflow
        elif txn_type in ("redemption", "switch_out"):
            dates.append(txn_date)
            amounts.append(abs(amount))            # inflow

    # Add current market value as terminal inflow at today's date
    current_value = current_units * current_nav
    dates.append(date.today())
    amounts.append(current_value)

    # Need at least one negative and one positive cashflow
    if not any(a < 0 for a in amounts) or not any(a > 0 for a in amounts):
        return 0.0

    # Need at least 2 datapoints
    if len(dates) < 2:
        return 0.0

    try:
        result = pyxirr_compute(dates, amounts)
        if result is None or result != result:   # NaN check
            return 0.0
        return round(float(result) * 100, 2)     # convert decimal to %
    except Exception:
        return 0.0


def _parse_date(date_str: str) -> date | None:
    """Parse DD-MMM-YYYY into a date object. Returns None on failure."""
    for fmt in ("%d-%b-%Y", "%d/%b/%Y", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except (ValueError, AttributeError):
            continue
    return None
