import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors
from pydantic import ValidationError

from app.models.resume import ResumeAnalysisResponse


load_dotenv()
logger = logging.getLogger(__name__)
RETRY_DELAYS_SECONDS = (2, 4, 8)
RETRYABLE_STATUS_CODES = {429, 503}
MAX_RETRIES = len(RETRY_DELAYS_SECONDS)


@dataclass
class GeminiServiceError(Exception):
    status_code: int
    detail: str

    def __str__(self) -> str:
        return self.detail


def generate_content_with_retries(client: genai.Client, model: str, contents: str) -> Any:
    """Run a Gemini generateContent request with one shared retry policy.

    Only temporary provider conditions are retried: HTTP 429, HTTP 503,
    timeouts, and network interruptions. Permanent request/configuration
    failures are returned immediately to the caller for normal error mapping.
    """

    total_attempts = MAX_RETRIES + 1

    for attempt_index in range(total_attempts):
        attempt_number = attempt_index + 1
        logger.info("Gemini request attempt %s/%s", attempt_number, total_attempts)

        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
            )

            if attempt_index:
                logger.info("Gemini request succeeded after %s retries.", attempt_index)

            return response
        except genai_errors.APIError as exc:
            status_code = getattr(exc, "code", None)
            logger.warning("Gemini returned %s", status_code, exc_info=True)

            if status_code not in RETRYABLE_STATUS_CODES:
                raise

            if attempt_index == MAX_RETRIES:
                logger.exception("Gemini failed after %s retries.", MAX_RETRIES)
                raise

            retry_delay = RETRY_DELAYS_SECONDS[attempt_index]
            logger.warning("Retrying in %s seconds...", retry_delay)
            time.sleep(retry_delay)
        except Exception as exc:
            if not _is_timeout_error(exc) and not _is_network_error(exc):
                raise

            failure_type = "timeout" if _is_timeout_error(exc) else "network"
            logger.warning("Gemini temporary %s failure.", failure_type, exc_info=True)

            if attempt_index == MAX_RETRIES:
                logger.exception("Gemini failed after %s retries.", MAX_RETRIES)

                if failure_type == "timeout":
                    raise GeminiServiceError(
                        status_code=503,
                        detail="Gemini request timed out. Please retry.",
                    ) from exc

                raise GeminiServiceError(
                    status_code=503,
                    detail="Unable to connect to Gemini.",
                ) from exc

            retry_delay = RETRY_DELAYS_SECONDS[attempt_index]
            logger.warning("Retrying in %s seconds...", retry_delay)
            time.sleep(retry_delay)


class ResumeAnalyzer:
    """Gemini-backed resume analyzer service.

    This service owns the provider integration for resume analysis only:
    prompt creation, Gemini request execution, JSON cleanup/parsing, response
    validation, model availability diagnostics, and meaningful error mapping.
    The agent layer can stay modular while future agents get their own services.
    """

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "").strip()
        logger.info("Gemini API key loaded: %s", bool(self.api_key))
        logger.info("Gemini model configured: %s", self.model or "<missing>")

        if not self.api_key:
            raise GeminiServiceError(status_code=401, detail="GEMINI_API_KEY is not configured.")
        if not self.model:
            raise GeminiServiceError(status_code=503, detail="GEMINI_MODEL is not configured.")

        self.client = genai.Client(api_key=self.api_key)

    def analyze(self, resume_text: str) -> ResumeAnalysisResponse:
        prompt = self._build_prompt(resume_text)
        logger.info("Gemini prompt length: %s", len(prompt))
        logger.info("Gemini request started. model=%s", self.model)

        try:
            response = generate_content_with_retries(self.client, self.model, prompt)
            logger.info("Gemini response received. model=%s", self.model)
            raw_text = getattr(response, "text", "") or ""
            analysis = self._parse_response(raw_text)
            logger.info("Gemini final success. model=%s score=%s", self.model, analysis.ats_score)
            return analysis
        except GeminiServiceError:
            raise
        except genai_errors.APIError as exc:
            self._handle_api_error(exc)
        except Exception as exc:
            logger.exception("Gemini request failed with unexpected exception.")
            raise GeminiServiceError(status_code=503, detail="Gemini request failed.") from exc

    def _build_prompt(self, resume_text: str) -> str:
        return f"""
You are an ATS resume analysis engine.

Analyze the resume deeply and return STRICT JSON only.
Do not include markdown, explanations, code fences, or extra text.

Return exactly this JSON shape:
{{
  "ats_score": number,
  "strengths": [],
  "weaknesses": [],
  "missing_skills": [],
  "recommendations": []
}}

Rules:
- ats_score must be a realistic number from 0 to 100.
- Score must change based on resume quality, specificity, quantified impact, relevant skills, and ATS keyword coverage.
- strengths must contain actual resume-specific strengths.
- weaknesses must contain actual resume-specific weaknesses.
- missing_skills must contain missing technologies, tools, methods, or role keywords.
- recommendations must contain concrete improvements for this resume.
- Every list must contain at least 3 strings.

Resume:
{resume_text}
""".strip()

    def _parse_response(self, raw_text: str) -> ResumeAnalysisResponse:
        raw_text = raw_text.strip()

        if not raw_text:
            logger.error("Gemini returned an empty response.")
            raise GeminiServiceError(status_code=500, detail="Gemini returned an empty response.")

        try:
            json_text = self._extract_json(raw_text)
            payload = json.loads(json_text)
            payload["source"] = "gemini"
            analysis = ResumeAnalysisResponse.model_validate(payload)
        except json.JSONDecodeError as exc:
            logger.exception("Gemini returned malformed JSON.")
            raise GeminiServiceError(status_code=500, detail="Gemini returned malformed JSON.") from exc
        except ValidationError as exc:
            logger.exception("Gemini JSON failed response validation.")
            raise GeminiServiceError(status_code=500, detail="Gemini response failed validation.") from exc

        logger.info("Gemini parsing success. ATS score=%s", analysis.ats_score)
        return analysis

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

        logger.error("Gemini HTTP status: %s", status_code)
        logger.error("Gemini API error response: %s", raw_error)
        logger.exception("Gemini API exception traceback.")

        combined = f"{status_name} {message} {raw_error}".lower()

        if self._is_invalid_api_key(status_code, combined):
            raise GeminiServiceError(status_code=401, detail="Invalid Gemini API key.") from exc

        if self._is_quota_exceeded(status_code, combined):
            raise GeminiServiceError(status_code=429, detail="Gemini quota exceeded. Please try again later.") from exc

        if status_code == 400:
            raise GeminiServiceError(status_code=400, detail="Gemini rejected the request.") from exc

        if self._is_model_unavailable(status_code, combined):
            supported_models = self._list_generate_content_models()
            if supported_models:
                logger.error(
                    "Configured Gemini model unavailable. configured_model=%s generateContent_models=%s",
                    self.model,
                    supported_models,
                )
            raise GeminiServiceError(
                status_code=404,
                detail="Configured Gemini model is unavailable.",
            ) from exc

        if status_code == 503:
            raise GeminiServiceError(
                status_code=503,
                detail="Gemini is currently experiencing high demand. Please try again in a few moments.",
            ) from exc

        raise GeminiServiceError(
            status_code=503,
            detail=f"Gemini request failed with status {status_code or 'unknown'}.",
        ) from exc

    def _list_generate_content_models(self) -> list[str]:
        try:
            models = list(self.client.models.list())
        except Exception:
            logger.exception("Unable to list Gemini models after model availability failure.")
            return []

        supported_models: list[str] = []

        for model in models:
            name = str(getattr(model, "name", "") or "")
            actions = getattr(model, "supported_actions", None)
            methods = getattr(model, "supported_generation_methods", None)
            capabilities = list(actions or methods or [])

            if "generateContent" in capabilities:
                supported_models.append(name)

        logger.error("Gemini models supporting generateContent: %s", supported_models)
        return supported_models

    def _is_invalid_api_key(self, status_code: int | None, combined_error: str) -> bool:
        return (
            status_code in {400, 401, 403}
            and ("api key" in combined_error or "apikey" in combined_error or "unauthenticated" in combined_error)
        )

    def _is_quota_exceeded(self, status_code: int | None, combined_error: str) -> bool:
        return status_code == 429 or "resource_exhausted" in combined_error or "quota" in combined_error

    def _is_model_unavailable(self, status_code: int | None, combined_error: str) -> bool:
        return (
            status_code == 404
            or "model not found" in combined_error
            or "not found for api version" in combined_error
            or "not supported" in combined_error
            or "unsupported" in combined_error
        )

    def _safe_json(self, value: Any) -> str | None:
        if value is None:
            return None

        try:
            return json.dumps(value, ensure_ascii=True)
        except TypeError:
            return str(value)


def _is_timeout_error(exc: Exception) -> bool:
    class_name = exc.__class__.__name__.lower()
    module_name = exc.__class__.__module__.lower()
    text = str(exc).lower()

    return "timeout" in class_name or "timeout" in module_name or "timed out" in text


def _is_network_error(exc: Exception) -> bool:
    class_name = exc.__class__.__name__.lower()
    module_name = exc.__class__.__module__.lower()
    text = str(exc).lower()

    return (
        "connection" in class_name
        or "network" in class_name
        or "connect" in text
        or "connection" in text
        or "name resolution" in text
        or "dns" in text
        or "httpx" in module_name
        or "requests" in module_name
    )
