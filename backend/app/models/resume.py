from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ResumeAnalysisResponse(BaseModel):
    """Public ATS-style response contract returned to the frontend."""

    ats_score: int = Field(..., ge=0, le=100, examples=[82])
    strengths: list[str]
    weaknesses: list[str]
    missing_skills: list[str]
    recommendations: list[str]
    source: Literal["gemini", "fallback"] = Field(..., examples=["gemini"])

    @field_validator("strengths", "weaknesses", "missing_skills", "recommendations")
    @classmethod
    def require_populated_lists(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if isinstance(value, str) and value.strip()]

        if not cleaned:
            raise ValueError("analysis lists must contain at least one non-empty item")

        return cleaned


class HealthResponse(BaseModel):
    status: str
    service: str
