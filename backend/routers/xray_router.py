from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from parsers.cams_parser import parse_cams
from agents.xray_agent import run_xray_agent

router = APIRouter()

_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/api/xray")
async def xray_upload(file: UploadFile = File(...)):
    """
    Accept a CAMS / KFintech PDF statement and return full X-Ray analysis.

    Validates:
      - File must be a PDF
      - File size must be < 10 MB

    Returns analysis dict or { "error": "clear error message" }
    """
    # ── Validate file type ────────────────────────────────────────────────
    filename = file.filename or ""
    content_type = file.content_type or ""

    is_pdf = filename.lower().endswith(".pdf") or "pdf" in content_type.lower()
    if not is_pdf:
        raise HTTPException(
            status_code=415,
            detail="Only PDF files are accepted. Please upload your CAMS or KFintech statement.",
        )

    # ── Read and validate size ────────────────────────────────────────────
    pdf_bytes = await file.read()

    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(pdf_bytes) > _MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds 10 MB. Please upload a smaller statement.",
        )

    # ── Parse + Analyse ───────────────────────────────────────────────────
    try:
        parsed = parse_cams(pdf_bytes)
    except Exception as e:
        return JSONResponse(
            status_code=422,
            content={"error": f"Could not read the PDF: {str(e)}. Please ensure it is a valid CAMS statement."},
        )

    if not parsed.get("funds"):
        error_msg = "No mutual fund holdings found in this PDF."
        if parsed.get("parse_errors"):
            error_msg += " " + parsed["parse_errors"][0]
        return JSONResponse(
            status_code=422,
            content={"error": error_msg},
        )

    try:
        result = run_xray_agent(parsed)
        result["parse_errors"] = parsed.get("parse_errors", [])
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Analysis failed: {str(e)}. Please try again."},
        )
