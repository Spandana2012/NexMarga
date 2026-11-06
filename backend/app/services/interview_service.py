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

from app.models.interview import InterviewPreparationResponse
from app.services.gemini_service import GeminiServiceError, generate_content_with_retries
from app.utils.pdf import extract_pdf_text


load_dotenv()
logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"application/pdf"}
ALLOWED_EXPERIENCE_LEVELS = {"Intern", "Fresher", "1-3 Years", "3-5 Years", "5+ Years"}
EXPERIENCE_LEVEL_ALIASES = {
    "intern": "Intern",
    "fresher": "Fresher",
    "1-3 years": "1-3 Years",
    "3-5 years": "3-5 Years",
    "5+ years": "5+ Years",
}
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


@dataclass
class InterviewRequestCache:
    extracted_text: str | None = None


class InterviewPreparationService:
    """Business service for customized interview preparation."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "").strip()
        logger.info("Interview Gemini API key loaded: %s", bool(self.api_key))
        logger.info("Interview Gemini model configured: %s", self.model or "<missing>")

        if not self.api_key:
            raise GeminiServiceError(status_code=401, detail="Invalid Gemini API key.")
        if not self.model:
            raise GeminiServiceError(status_code=503, detail="GEMINI_MODEL is not configured.")

        self.client = genai.Client(api_key=self.api_key)

    async def analyze_uploaded_resume(
        self,
        resume_file: UploadFile,
        job_description: str,
        experience_level: str,
    ) -> InterviewPreparationResponse:
        self._validate_pdf(resume_file)
        cleaned_job_description = job_description.strip()
        cleaned_experience_level = experience_level.strip()
        normalized_experience_level = normalize_experience_level(experience_level)

        logger.info("Received experience_level: %r", experience_level)
        logger.info("Stripped experience_level: %r", cleaned_experience_level)
        logger.info("Allowed experience levels: %s", ALLOWED_EXPERIENCE_LEVELS)
        logger.info("Normalized experience_level: %r", normalized_experience_level)
        logger.info("Experience level validation result: %s", normalized_experience_level is not None)

        if not cleaned_job_description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description is required.",
            )

        if normalized_experience_level is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unsupported experience level.",
            )

        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        safe_filename = f"{uuid4().hex}_{Path(resume_file.filename or 'resume.pdf').name}"
        saved_path = UPLOAD_DIR / safe_filename
        request_cache = InterviewRequestCache()

        try:
            contents = await resume_file.read()

            if not contents:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded PDF file is empty.",
                )

            saved_path.write_bytes(contents)
            logger.info("Temporarily saved interview resume upload: %s", saved_path.name)

            request_cache.extracted_text = extract_pdf_text(saved_path)
            resume_text = request_cache.extracted_text

            if not resume_text:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No readable text was found in the uploaded resume.",
                )

            logger.info(
                "Interview input prepared. resume_chars=%s job_description_chars=%s experience_level=%s",
                len(resume_text),
                len(cleaned_job_description),
                normalized_experience_level,
            )
            return await run_in_threadpool(
                self.analyze_text,
                resume_text,
                cleaned_job_description,
                normalized_experience_level,
            )
        except HTTPException:
            raise
        except GeminiServiceError as exc:
            logger.exception("Gemini interview preparation failed.")
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except Exception as exc:
            logger.exception("Unexpected interview preparation failure.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to prepare interview analysis.",
            ) from exc
        finally:
            await resume_file.close()
            if saved_path.exists():
                saved_path.unlink()

    def analyze_text(
        self,
        resume_text: str,
        job_description: str,
        experience_level: str,
    ) -> InterviewPreparationResponse:
        prompt = self._build_prompt(resume_text, job_description, experience_level)
        logger.info("Interview Gemini request started. model=%s prompt_chars=%s", self.model, len(prompt))

        try:
            response = generate_content_with_retries(self.client, self.model, prompt)
            logger.info("Interview Gemini response received. model=%s", self.model)
            raw_text = getattr(response, "text", "") or ""
            analysis = self._parse_response(raw_text)
            logger.info("Interview parsing success. overall_readiness=%s", analysis.overall_readiness)
            return analysis
        except GeminiServiceError:
            raise
        except genai_errors.APIError as exc:
            self._handle_api_error(exc)
        except Exception as exc:
            logger.exception("Interview Gemini request failed with unexpected exception.")
            raise GeminiServiceError(status_code=503, detail="Gemini request failed.") from exc

    def _build_prompt(self, resume_text: str, job_description: str, experience_level: str) -> str:
        return f"""
You are a Senior Technical Interviewer.

Analyze the candidate resume, job description, and experience level.
Generate interview preparation completely customized for that candidate.

Return STRICT JSON only.
Do not include markdown, explanations, code fences, or extra text.

Return exactly this JSON shape:
{{
  "overall_readiness": number,
  "technical_questions": [
    {{
      "question": "",
      "difficulty": "Easy",
      "topic": "",
      "why_asked": ""
    }}
  ],
  "project_questions": [
    {{
      "project": "",
      "question": "",
      "expected_points": []
    }}
  ],
  "hr_questions": [
    {{
      "question": "",
      "tips": ""
    }}
  ],
  "coding_topics": [
    {{
      "topic": "",
      "priority": "High"
    }}
  ],
  "system_design_topics": [
    {{
      "topic": "",
      "priority": "Medium"
    }}
  ],
  "behavioral_topics": [],
  "resume_based_focus": [],
  "interview_tips": [],
  "study_plan": [
    {{
      "day": 1,
      "focus": ""
    }}
  ]
}}

Rules:
- overall_readiness must be a realistic number from 0 to 100.
- Generate exactly 15 technical_questions.
- Technical questions must depend on the resume, projects, skills, job description, and experience level.
- Technical question difficulty must vary across Easy, Medium, and Hard.
- Generate project_questions for every project present in the resume.
- Each project question must include expected_points that describe strong answer points.
- Generate exactly 10 realistic hr_questions.
- coding_topics must be based on the job description.
- system_design_topics must match the job type: backend gets beginner system design, frontend skips advanced backend design, AI gets AI system design.
- behavioral_topics must include relevant soft-skill themes.
- resume_based_focus must identify resume areas likely to be questioned.
- interview_tips must contain personalized advice based on the resume and job description.
- study_plan must be a 7-day interview preparation plan.
- Each study_plan focus must include topic, practice goal, and revision goal in one clear string.

Resume:
{resume_text}

Job Description:
{job_description}

Experience Level:
{experience_level}
""".strip()

    def _parse_response(self, raw_text: str) -> InterviewPreparationResponse:
        raw_text = raw_text.strip()

        if not raw_text:
            logger.error("Gemini returned an empty interview response.")
            raise GeminiServiceError(status_code=500, detail="Gemini returned an empty response.")

        try:
            json_text = self._extract_json(raw_text)
            payload = json.loads(json_text)
            payload["source"] = "gemini"
            return InterviewPreparationResponse.model_validate(payload)
        except json.JSONDecodeError as exc:
            logger.exception("Gemini returned malformed interview JSON.")
            raise GeminiServiceError(status_code=500, detail="Gemini returned malformed JSON.") from exc
        except ValidationError as exc:
            logger.exception("Gemini interview JSON failed response validation.")
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

        logger.error("Interview Gemini HTTP status: %s", status_code)
        logger.error("Interview Gemini API error response: %s", raw_error)
        logger.exception("Interview Gemini API exception traceback.")

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


def normalize_experience_level(value: str) -> str | None:
    """Return a canonical interview experience level, or None if invalid."""

    stripped = value.strip()

    if stripped in ALLOWED_EXPERIENCE_LEVELS:
        return stripped

    normalized_key = (
        stripped.casefold()
        .replace("–", "-")
        .replace("—", "-")
        .replace("\u00a0", " ")
    )
    normalized_key = " ".join(normalized_key.split())

    return EXPERIENCE_LEVEL_ALIASES.get(normalized_key)
