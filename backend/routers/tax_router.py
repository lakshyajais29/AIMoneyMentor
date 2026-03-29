import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional

from parsers.form16_parser import parse_form16
from agents.tax_agent import run_tax_agent

router = APIRouter()

_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/api/tax")
async def tax_analysis(
    file: Optional[UploadFile] = File(default=None),
    # Manual fields — all optional, sent as form fields alongside optional PDF
    gross_salary:       Optional[str] = Form(default=None),
    hra_received:       Optional[str] = Form(default=None),
    standard_deduction: Optional[str] = Form(default=None),
    section_80c:        Optional[str] = Form(default=None),
    section_80d:        Optional[str] = Form(default=None),
    section_80ccd:      Optional[str] = Form(default=None),
    tds_deducted:       Optional[str] = Form(default=None),
):
    """
    Accepts either:
      A) A Form 16 PDF upload  → parse → calculate → AI advice
      B) Manual JSON fields    → calculate → AI advice
      C) Both                  → PDF values take priority; manual values fill gaps

    Returns full tax analysis or { "error": "..." }
    """

    data: dict = {}

    # ── Path A: PDF provided ───────────────────────────────────────────────
    if file is not None and file.filename:
        filename = file.filename or ""
        content_type = file.content_type or ""
        is_pdf = filename.lower().endswith(".pdf") or "pdf" in content_type.lower()

        if not is_pdf:
            raise HTTPException(
                status_code=415,
                detail="Only PDF files are accepted. Please upload your Form 16.",
            )

        pdf_bytes = await file.read()

        if len(pdf_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        if len(pdf_bytes) > _MAX_BYTES:
            raise HTTPException(
                status_code=413,
                detail="File size exceeds 10 MB.",
            )

        try:
            parsed = parse_form16(pdf_bytes)
        except Exception as e:
            return JSONResponse(
                status_code=422,
                content={"error": f"Could not read Form 16 PDF: {str(e)}"},
            )

        if parsed.get("parse_errors"):
            # Non-fatal — use what was parsed, note errors
            data["_parse_warnings"] = parsed["parse_errors"]

        # Populate data from PDF
        data.update({
            "gross_salary":       parsed.get("gross_salary", 0),
            "hra_received":       parsed.get("hra_received", 0),
            "standard_deduction": parsed.get("standard_deduction", 0),
            "section_80c":        parsed.get("section_80c", 0),
            "section_80d":        parsed.get("section_80d", 0),
            "section_80ccd":      parsed.get("section_80ccd", 0),
            "tds_deducted":       parsed.get("tds_deducted", 0),
        })

    # ── Path B / fill gaps: manual fields ─────────────────────────────────
    manual_map = {
        "gross_salary":       gross_salary,
        "hra_received":       hra_received,
        "standard_deduction": standard_deduction,
        "section_80c":        section_80c,
        "section_80d":        section_80d,
        "section_80ccd":      section_80ccd,
        "tds_deducted":       tds_deducted,
    }

    for key, val in manual_map.items():
        if val is not None:
            try:
                parsed_val = float(str(val).replace(",", "").strip())
                # Manual value fills gaps (or overrides if PDF wasn't uploaded)
                if data.get(key, 0) == 0:
                    data[key] = parsed_val
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid value for '{key}': '{val}'. Must be a number.",
                )

    # ── Validate we have at least a gross salary ───────────────────────────
    if not data.get("gross_salary") or data["gross_salary"] <= 0:
        raise HTTPException(
            status_code=422,
            detail=(
                "Gross salary is required. "
                "Upload a Form 16 PDF or enter your salary manually."
            ),
        )

    # ── Validate individual field ranges ──────────────────────────────────
    _validate_fields(data)

    # ── Run agent ─────────────────────────────────────────────────────────
    try:
        result = run_tax_agent(data)
        # Surface any PDF parse warnings
        if data.get("_parse_warnings"):
            result["warnings"] = data["_parse_warnings"]
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Tax analysis failed: {str(e)}. Please try again."},
        )


def _validate_fields(data: dict) -> None:
    """Raise HTTPException if any field is out of reasonable range."""
    checks = [
        ("gross_salary",       0,       100_000_000, "Gross salary"),
        ("hra_received",       0,       50_000_000,  "HRA received"),
        ("standard_deduction", 0,       100_000,     "Standard deduction"),
        ("section_80c",        0,       150_000,     "Section 80C investments"),
        ("section_80d",        0,       25_000,      "Section 80D premium"),
        ("section_80ccd",      0,       50_000,      "Section 80CCD(1B) NPS"),
        ("tds_deducted",       0,       100_000_000, "TDS deducted"),
    ]
    for key, lo, hi, label in checks:
        val = float(data.get(key, 0) or 0)
        if val < lo or val > hi:
            raise HTTPException(
                status_code=422,
                detail=f"{label} must be between ₹{lo:,} and ₹{hi:,}. Got: ₹{val:,.0f}.",
            )
