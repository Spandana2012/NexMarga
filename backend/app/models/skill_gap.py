from typing import Literal

from pydantic import BaseModel, Field, field_validator


class SkillGapAnalysisResponse(BaseModel):
    """Public response contract for resume-to-job skill gap analysis."""

    overall_match: int = Field(..., ge=0, le=100, examples=[86])
    matching_skills: list[str]
    missing_skills: list[str]
    experience_gap: list[str]
    ats_keywords_missing: list[str]
    recommended_courses: list[str]
    interview_focus: list[str]
    resume_improvements: list[str]
    source: Literal["gemini"] = Field(..., examples=["gemini"])

    @field_validator(
        "matching_skills",
        "missing_skills",
        "experience_gap",
        "ats_keywords_missing",
        "recommended_courses",
        "interview_focus",
        "resume_improvements",
    )
    @classmethod
    def require_populated_lists(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if isinstance(value, str) and value.strip()]

        if not cleaned:
            raise ValueError("skill gap analysis lists must contain at least one non-empty item")

        return cleaned
