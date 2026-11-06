from pathlib import Path
from uuid import uuid4

import logging
from fastapi import HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.agents.resume_analyzer import ResumeAnalyzerAgent
from app.models.resume import ResumeAnalysisResponse
from app.services.gemini_service import GeminiServiceError
from app.utils.pdf import extract_pdf_text


ALLOWED_CONTENT_TYPES = {"application/pdf"}
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
logger = logging.getLogger(__name__)


class ResumeRequestCache:
    """Per-request cache for extracted resume text.

    This avoids repeated PDF extraction if later steps in the same request need
    the text again, without introducing cross-request storage or a database.
    """

    def __init__(self) -> None:
        self.extracted_text: str | None = None


class ResumeService:
    """Services layer for upload validation, temporary storage, and analysis.

    Routes should stay small: they receive HTTP input and return HTTP output.
    This service owns the business workflow so validation, upload handling, PDF
    extraction, and agent execution can evolve independently.
    """

    def __init__(self) -> None:
        self.agent = ResumeAnalyzerAgent()

    async def analyze_uploaded_resume(self, file: UploadFile) -> ResumeAnalysisResponse:
        self._validate_pdf(file)
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        safe_filename = f"{uuid4().hex}_{Path(file.filename or 'resume.pdf').name}"
        saved_path = UPLOAD_DIR / safe_filename
        request_cache = ResumeRequestCache()

        try:
            # Upload handling is temporary for now: save to disk, parse the PDF,
            # send extracted text to the single Resume Analyzer Agent, then
            # remove the file before returning structured ATS JSON.
            contents = await file.read()

            if not contents:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded PDF file is empty.",
                )

            saved_path.write_bytes(contents)
            logger.info("Temporarily saved resume upload: %s", saved_path.name)

            request_cache.extracted_text = extract_pdf_text(saved_path)
            resume_text = request_cache.extracted_text

            if not resume_text:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No readable text was found in the uploaded resume.",
                )

            logger.info("Extracted resume text cached for request: %s chars", len(resume_text))
            return await run_in_threadpool(self.agent.analyze, resume_text)
        except HTTPException:
            raise
        except GeminiServiceError as exc:
            logger.exception("Gemini resume analysis failed.")
            raise HTTPException(
                status_code=exc.status_code,
                detail=exc.detail,
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected resume analysis failure.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to analyze the uploaded resume.",
            ) from exc
        finally:
            await file.close()
            if saved_path.exists():
                saved_path.unlink()

    def _validate_pdf(self, file: UploadFile) -> None:
        filename = file.filename or ""

        if file.content_type not in ALLOWED_CONTENT_TYPES or not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF resume uploads are supported.",
            )
