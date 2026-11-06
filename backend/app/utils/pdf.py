from pathlib import Path

from fastapi import HTTPException, status
from pypdf import PdfReader
from pypdf.errors import PdfReadError


def extract_pdf_text(file_path: Path) -> str:
    """Extract text from a PDF file using PyPDF.

    This utility is intentionally isolated from the route so the upload API can
    focus on HTTP concerns while PDF parsing can later be improved or replaced.
    """

    try:
        reader = PdfReader(str(file_path))
        pages: list[str] = []

        for page in reader.pages:
            pages.append(page.extract_text() or "")
    except (PdfReadError, ValueError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or unreadable PDF file.",
        ) from exc

    return "\n".join(pages).strip()
