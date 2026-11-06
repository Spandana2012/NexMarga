from fastapi import UploadFile

from app.models.interview import InterviewPreparationResponse
from app.services.interview_service import InterviewPreparationService


class InterviewPreparationAgent:
    """Thin orchestration layer for interview preparation."""

    async def analyze(
        self,
        resume_file: UploadFile,
        job_description: str,
        experience_level: str,
    ) -> InterviewPreparationResponse:
        return await InterviewPreparationService().analyze_uploaded_resume(
            resume_file,
            job_description,
            experience_level,
        )
