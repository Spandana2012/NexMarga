import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import HTTPException, UploadFile, status
from google import genai
from google.genai import errors as genai_errors
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.models.skill_gap import SkillGapAnalysisResponse
from app.services.gemini_service import GeminiServiceError, generate_content_with_retries
from app.utils.pdf import extract_pdf_text


load_dotenv()
logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"application/pdf"}
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


@dataclass
class SkillGapRequestCache:
    extracted_text: str | None = None


class SkillGapService:
    """Business service for comparing a resume against a job description."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "").strip()
        logger.info("Skill gap Gemini API key loaded: %s", bool(self.api_key))
        logger.info("Skill gap Gemini model configured: %s", self.model or "<missing>")

        if not self.api_key:
            raise GeminiServiceError(status_code=401, detail="Invalid Gemini API key.")
        if not self.model:
            raise GeminiServiceError(status_code=503, detail="GEMINI_MODEL is not configured.")

        self.client = genai.Client(api_key=self.api_key)

    async def analyze_uploaded_resume(
        self,
        resume_file: UploadFile,
        job_description: str,
    ) -> SkillGapAnalysisResponse:
        self._validate_pdf(resume_file)
        cleaned_job_description = job_description.strip()

        if not cleaned_job_description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description is required.",
            )

        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        safe_filename = f"{uuid4().hex}_{Path(resume_file.filename or 'resume.pdf').name}"
        saved_path = UPLOAD_DIR / safe_filename
        request_cache = SkillGapRequestCache()

        try:
            contents = await resume_file.read()

            if not contents:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded PDF file is empty.",
                )

            saved_path.write_bytes(contents)
            logger.info("Temporarily saved skill gap resume upload: %s", saved_path.name)

            request_cache.extracted_text = extract_pdf_text(saved_path)
            resume_text = request_cache.extracted_text

            if not resume_text:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No readable text was found in the uploaded resume.",
                )

            logger.info(
                "Skill gap input prepared. resume_chars=%s job_description_chars=%s",
                len(resume_text),
                len(cleaned_job_description),
            )
            return await run_in_threadpool(self.analyze_text, resume_text, cleaned_job_description)
        except HTTPException:
            raise
        except GeminiServiceError as exc:
            logger.exception("Gemini skill gap analysis failed.")
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except Exception as exc:
            logger.exception("Unexpected skill gap analysis failure.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to analyze the skill gap.",
            ) from exc
        finally:
            await resume_file.close()
            if saved_path.exists():
                saved_path.unlink()

    def analyze_text(self, resume_text: str, job_description: str) -> SkillGapAnalysisResponse:
        prompt = self._build_prompt(resume_text, job_description)
        logger.info("Skill gap Gemini request started. model=%s prompt_chars=%s", self.model, len(prompt))

        try:
            response = generate_content_with_retries(self.client, self.model, prompt)
            logger.info("Skill gap Gemini response received. model=%s", self.model)
            raw_text = getattr(response, "text", "") or ""
            analysis = self._parse_response(raw_text)
            logger.info("Skill gap parsing success. overall_match=%s", analysis.overall_match)
            return analysis
        except GeminiServiceError:
            raise
        except genai_errors.APIError as exc:
            self._handle_api_error(exc)
        except Exception as exc:
            logger.exception("Skill gap Gemini request failed with unexpected exception.")
            raise GeminiServiceError(status_code=503, detail="Gemini request failed.") from exc

    def _build_prompt(self, resume_text: str, job_description: str) -> str:
        return f"""
You are a Skill Gap Analysis Agent.

Compare the candidate resume against the job description and return STRICT JSON only.
Do not include markdown, explanations, code fences, or extra text.

Return exactly this JSON shape:
{{
  "overall_match": number,
  "matching_skills": [],
  "missing_skills": [],
  "experience_gap": [],
  "ats_keywords_missing": [],
  "recommended_courses": [],
  "interview_focus": [],
  "resume_improvements": []
}}

Rules:
- overall_match must be a realistic number from 0 to 100.
- matching_skills must list skills clearly present in both the resume and job description.
- missing_skills must list important job-description skills and certifications not evidenced in the resume.
- experience_gap must list missing years, domains, project scope, seniority, or responsibility gaps.
- ats_keywords_missing must list exact role keywords from the job description that are absent or weak in the resume.
- recommended_courses must list concrete learning areas, course topics, or certification preparation paths.
- interview_focus must list topics the candidate should prepare for.
- resume_improvements must list concrete resume edits that improve alignment.
- Every list must contain at least 2 strings.

Resume:
{resume_text}

Job Description:
{job_description}
""".strip()

    def _parse_response(self, raw_text: str) -> SkillGapAnalysisResponse:
        raw_text = raw_text.strip()

        if not raw_text:
            logger.error("Gemini returned an empty skill gap response.")
            raise GeminiServiceError(status_code=500, detail="Gemini returned an empty response.")

        try:
            json_text = self._extract_json(raw_text)
            payload = json.loads(json_text)
            payload["source"] = "gemini"
            return SkillGapAnalysisResponse.model_validate(payload)
        except json.JSONDecodeError as exc:
            logger.exception("Gemini returned malformed skill gap JSON.")
            raise GeminiServiceError(status_code=500, detail="Gemini returned malformed JSON.") from exc
        except ValidationError as exc:
            logger.exception("Gemini skill gap JSON failed response validation.")
            raise GeminiServiceError(status_code=500, detail="Gemini response failed validation.") from exc

    def _extract_json(self, raw_text: str) -> str:
        cleaned = raw_text.strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned.removeprefix("```json").strip()
        elif cleaned.startswith("```"):
            cleaned = cleaned.removeprefix("```").strip()

        if cleaned.endswith("```"):
            cleaned = cleaned.removesuffix("```").strip()

        decoder = json.JSONDecoder()
        start = cleaned.find("{")

        if start == -1:
            raise json.JSONDecodeError("No JSON object found in Gemini response.", cleaned, 0)

        parsed, end = decoder.raw_decode(cleaned[start:])

        if not isinstance(parsed, dict):
            raise json.JSONDecodeError("Gemini response JSON must be an object.", cleaned, start)

        return cleaned[start : start + end]

    def _handle_api_error(self, exc: genai_errors.APIError) -> None:
        status_code = getattr(exc, "code", None)
        status_name = str(getattr(exc, "status", "") or "")
        message = str(getattr(exc, "message", "") or exc)
        raw_error = self._safe_json(getattr(exc, "details", None)) or str(exc)
        combined = f"{status_name} {message} {raw_error}".lower()

        logger.error("Skill gap Gemini HTTP status: %s", status_code)
        logger.error("Skill gap Gemini API error response: %s", raw_error)
        logger.exception("Skill gap Gemini API exception traceback.")

        if status_code in {400, 401, 403} and (
            "api key" in combined or "apikey" in combined or "unauthenticated" in combined
        ):
            raise GeminiServiceError(status_code=401, detail="Invalid Gemini API key.") from exc

        if status_code == 429 or "resource_exhausted" in combined or "quota" in combined:
            raise GeminiServiceError(status_code=429, detail="Gemini quota exceeded. Please try again later.") from exc

        if status_code == 404 or "model not found" in combined or "unsupported" in combined:
            raise GeminiServiceError(status_code=404, detail="Configured Gemini model is unavailable.") from exc

        if status_code == 503:
            raise GeminiServiceError(
                status_code=503,
                detail="Gemini is currently experiencing high demand. Please try again in a few moments.",
            ) from exc

        raise GeminiServiceError(
            status_code=503,
            detail=f"Gemini request failed with status {status_code or 'unknown'}.",
        ) from exc

    def _validate_pdf(self, file: UploadFile) -> None:
        filename = file.filename or ""

        if file.content_type not in ALLOWED_CONTENT_TYPES or not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF resume uploads are supported.",
            )

    def _safe_json(self, value: Any) -> str | None:
        if value is None:
            return None

        try:
            return json.dumps(value, ensure_ascii=True)
        except TypeError:
            return str(value)
