from typing import Literal

from pydantic import BaseModel, Field, field_validator


class TechnicalQuestion(BaseModel):
    question: str
    difficulty: Literal["Easy", "Medium", "Hard"]
    topic: str
    why_asked: str


class ProjectQuestion(BaseModel):
    project: str
    question: str
    expected_points: list[str]

    @field_validator("expected_points")
    @classmethod
    def require_expected_points(cls, values: list[str]) -> list[str]:
        return _clean_non_empty_list(values, "expected_points")


class HrQuestion(BaseModel):
    question: str
    tips: str


class CodingTopic(BaseModel):
    topic: str
    priority: Literal["High", "Medium", "Low"]


class SystemDesignTopic(BaseModel):
    topic: str
    priority: Literal["High", "Medium", "Low"]


class StudyPlanDay(BaseModel):
    day: int = Field(..., ge=1, le=7)
    focus: str


class InterviewPreparationResponse(BaseModel):
    """Public response contract for the Interview Preparation Agent."""

    overall_readiness: int = Field(..., ge=0, le=100, examples=[84])
    technical_questions: list[TechnicalQuestion]
    project_questions: list[ProjectQuestion]
    hr_questions: list[HrQuestion]
    coding_topics: list[CodingTopic]
    system_design_topics: list[SystemDesignTopic]
    behavioral_topics: list[str]
    resume_based_focus: list[str]
    interview_tips: list[str]
    study_plan: list[StudyPlanDay]
    source: Literal["gemini"] = Field(..., examples=["gemini"])

    @field_validator(
        "technical_questions",
        "project_questions",
        "hr_questions",
        "coding_topics",
        "study_plan",
    )
    @classmethod
    def require_populated_objects(cls, values: list) -> list:
        if not values:
            raise ValueError("interview preparation sections must not be empty")

        return values

    @field_validator("behavioral_topics", "resume_based_focus", "interview_tips")
    @classmethod
    def require_populated_strings(cls, values: list[str]) -> list[str]:
        return _clean_non_empty_list(values, "interview preparation list")


def _clean_non_empty_list(values: list[str], field_name: str) -> list[str]:
    cleaned = [value.strip() for value in values if isinstance(value, str) and value.strip()]

    if not cleaned:
        raise ValueError(f"{field_name} must contain at least one non-empty item")

    return cleaned
