from fastapi import APIRouter, File, Form, UploadFile

from app.agents.skill_gap_agent import SkillGapAgent
from app.models.skill_gap import SkillGapAnalysisResponse


router = APIRouter(tags=["Skill Gap"])
skill_gap_agent = SkillGapAgent()


@router.post("/skill-gap-analysis", response_model=SkillGapAnalysisResponse)
async def analyze_skill_gap(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
) -> SkillGapAnalysisResponse:
    """Compare one PDF resume against a job description."""

    return await skill_gap_agent.analyze(resume_file, job_description)
