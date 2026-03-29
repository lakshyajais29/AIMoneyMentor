import re
import fitz  # PyMuPDF
from datetime import datetime


def parse_cams(pdf_bytes: bytes) -> dict:
    """
    Parse a CAMS or KFintech mutual fund statement PDF.

    Returns:
    {
      "funds": [
        {
          "name": "SBI Bluechip Fund",
          "transactions": [
            { "date": "15-Jan-2023", "type": "purchase", "amount": 5000, "units": 12.5, "nav": 400.0 }
          ],
          "current_units": 45.2,
          "current_nav": 420.0
        }
      ],
      "total_invested": 150000,
      "parse_errors": []
    }
    Never crashes — always returns a dict even on partial failure.
    """
    result = {
        "funds": [],
        "total_invested": 0.0,
        "parse_errors": [],
    }

    # ── Step 1: Extract text from PDF ──────────────────────────────────────
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text("text") + "\n"
        doc.close()
    except Exception as e:
        result["parse_errors"].append(f"Could not read PDF: {str(e)}")
        return result

    if not full_text.strip():
        result["parse_errors"].append("PDF appears to be empty or scanned (no extractable text).")
        return result

    # ── Step 2: Split into per-fund blocks ─────────────────────────────────
    # Fund blocks in CAMS typically start with an all-caps or title-case fund name
    # followed by "Folio No." on the same or next line.
    fund_blocks = _split_into_fund_blocks(full_text)

    if not fund_blocks:
        result["parse_errors"].append(
            "No fund holdings detected. Please upload a valid CAMS / KFintech statement."
        )
        return result

    # ── Step 3: Parse each fund block ─────────────────────────────────────
    total_invested = 0.0
    for block_name, block_text in fund_blocks:
        try:
            fund_data = _parse_fund_block(block_name, block_text)
            result["funds"].append(fund_data)
            # Sum purchases only
            for txn in fund_data["transactions"]:
                if txn["type"] == "purchase":
                    total_invested += txn["amount"]
        except Exception as e:
            result["parse_errors"].append(f"Error parsing fund '{block_name}': {str(e)}")

    result["total_invested"] = round(total_invested, 2)
    return result


# ── Helpers ────────────────────────────────────────────────────────────────

# Regex for a DD-MMM-YYYY date
_DATE_RE = re.compile(r"\b(\d{2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4})\b", re.I)

# Regex for an amount with optional commas
_AMOUNT_RE = re.compile(r"[\d,]+\.\d{2}")

# Transaction type keywords
_TXN_TYPE_MAP = {
    "purchase": "purchase",
    "sip": "purchase",
    "systematic investment": "purchase",
    "redemption": "redemption",
    "redeem": "redemption",
    "switch in": "switch_in",
    "switch-in": "switch_in",
    "switch out": "switch_out",
    "switch-out": "switch_out",
    "dividend": "dividend",
    "reinvestment": "purchase",
}

# Fund header: line that looks like a fund name (has "Fund" / "Scheme" / "Plan" etc.)
_FUND_NAME_RE = re.compile(
    r"^([A-Z][A-Za-z &\-()]+(?:Fund|Scheme|Plan|Growth|IDCW|Direct|ELSS|ETF)[^\n]*)",
    re.MULTILINE,
)


def _split_into_fund_blocks(text: str) -> list[tuple[str, str]]:
    """
    Split the full PDF text into (fund_name, block_text) tuples.
    Uses detected fund-name lines as block boundaries.
    """
    matches = list(_FUND_NAME_RE.finditer(text))
    if not matches:
        return []

    blocks = []
    for i, m in enumerate(matches):
        name = m.group(1).strip()
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block_text = text[start:end]
        blocks.append((name, block_text))

    return blocks


def _parse_fund_block(fund_name: str, block_text: str) -> dict:
    """Parse one fund's text block into a structured dict."""
    transactions = []

    # Find all date occurrences — each date likely anchors a transaction line
    for date_match in _DATE_RE.finditer(block_text):
        date_str = date_match.group(1)

        # Take the next 300 chars after the date to look for txn fields
        snippet = block_text[date_match.start(): date_match.start() + 300]

        txn_type = _detect_txn_type(snippet)
        amounts = _AMOUNT_RE.findall(snippet)
        numbers = [_to_float(a) for a in amounts]

        # Typical CAMS column order after date: Amount, Units, NAV, Balance Units
        amount = numbers[0] if len(numbers) > 0 else 0.0
        units  = numbers[1] if len(numbers) > 1 else 0.0
        nav    = numbers[2] if len(numbers) > 2 else 0.0

        # Skip lines that look like closing-balance rows (no type keyword)
        if txn_type is None and amount == 0.0:
            continue

        transactions.append({
            "date": date_str,
            "type": txn_type or "purchase",
            "amount": amount,
            "units": units,
            "nav": nav,
        })

    # Current holding: look for "Closing Balance" or "Units Balance"
    current_units, current_nav = _extract_closing_balance(block_text)

    return {
        "name": fund_name,
        "transactions": transactions,
        "current_units": current_units,
        "current_nav": current_nav,
    }


def _detect_txn_type(snippet: str) -> str | None:
    lower = snippet.lower()
    for keyword, txn_type in _TXN_TYPE_MAP.items():
        if keyword in lower:
            return txn_type
    return None


def _extract_closing_balance(block_text: str) -> tuple[float, float]:
    """
    Extract current_units and current_nav from closing balance line.
    Returns (0.0, 0.0) if not found.
    """
    # Look for "Closing Balance" or "Units Balance"
    cb_re = re.compile(r"(?:Closing Balance|Units Balance)[^\n]*", re.I)
    m = cb_re.search(block_text)
    if not m:
        return 0.0, 0.0

    amounts = _AMOUNT_RE.findall(m.group())
    nums = [_to_float(a) for a in amounts]
    current_units = nums[0] if len(nums) > 0 else 0.0
    current_nav   = nums[1] if len(nums) > 1 else 0.0
    return current_units, current_nav


def _to_float(s: str) -> float:
    try:
        return float(s.replace(",", ""))
    except ValueError:
        return 0.0
