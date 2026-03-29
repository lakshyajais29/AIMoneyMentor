import re
import fitz  # PyMuPDF


def parse_form16(pdf_bytes: bytes) -> dict:
    """
    Parse a Form 16 PDF and extract salary and deduction fields.

    Returns:
    {
      "gross_salary":        0.0,
      "hra_received":        0.0,
      "standard_deduction":  0.0,
      "section_80c":         0.0,
      "section_80d":         0.0,
      "section_80ccd":       0.0,
      "tds_deducted":        0.0,
      "parse_errors":        []
    }
    Never crashes — all fields default to 0 if not found.
    """
    result = {
        "gross_salary":       0.0,
        "hra_received":       0.0,
        "standard_deduction": 0.0,
        "section_80c":        0.0,
        "section_80d":        0.0,
        "section_80ccd":      0.0,
        "tds_deducted":       0.0,
        "parse_errors":       [],
    }

    # ── Extract text ───────────────────────────────────────────────────────
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
        result["parse_errors"].append("PDF appears to be empty or image-based (no extractable text).")
        return result

    # ── Extract each field ─────────────────────────────────────────────────
    result["gross_salary"]       = _find_amount(full_text, [
        r"Gross Salary",
        r"Total Salary",
        r"Total Income from Salary",
    ])

    result["hra_received"]       = _find_amount(full_text, [
        r"House Rent Allowance",
        r"HRA",
    ])

    result["standard_deduction"] = _find_amount(full_text, [
        r"Standard Deduction",
        r"Deduction u/s 16",
    ])

    result["section_80c"]        = _find_amount(full_text, [
        r"80C",
        r"80 ?C\b",
        r"Life Insurance|LIC|PPF|ELSS|NSC",
    ])

    result["section_80d"]        = _find_amount(full_text, [
        r"80D",
        r"80 ?D\b",
        r"Mediclaim|Health Insurance",
    ])

    result["section_80ccd"]      = _find_amount(full_text, [
        r"80CCD",
        r"NPS|National Pension",
    ])

    result["tds_deducted"]       = _find_amount(full_text, [
        r"Tax Deducted at Source",
        r"TDS",
        r"Total Tax Deducted",
        r"Tax Deducted",
    ])

    return result


# ── Helper ─────────────────────────────────────────────────────────────────

_AMOUNT_RE = re.compile(r"([\d,]+\.?\d{0,2})")


def _find_amount(text: str, keyword_patterns: list[str]) -> float:
    """
    Search for the first keyword pattern match and return the first
    numeric amount found in the next 200 characters after the match.
    Returns 0.0 if not found.
    """
    for pattern in keyword_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if not match:
            continue

        snippet = text[match.start(): match.start() + 200]
        amounts = _AMOUNT_RE.findall(snippet)
        for raw in amounts:
            val = _to_float(raw)
            if val > 100:   # filter out noise like page numbers, dates
                return val

    return 0.0


def _to_float(s: str) -> float:
    try:
        return float(s.replace(",", "").strip())
    except ValueError:
        return 0.0
