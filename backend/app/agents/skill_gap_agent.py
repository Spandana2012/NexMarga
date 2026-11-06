from fastapi import UploadFile

from app.models.skill_gap import SkillGapAnalysisResponse
from app.services.skill_gap_service import SkillGapService


class SkillGapAgent:
    """Thin orchestration layer for skill gap analysis."""

    async def analyze(
        self,
        resume_file: UploadFile,
        job_description: str,
    ) -> SkillGapAnalysisResponse:
        return await SkillGapService().analyze_uploaded_resume(resume_file, job_description)
