from fastapi import APIRouter, File, Form, UploadFile

from app.agents.interview_agent import InterviewPreparationAgent
from app.models.interview import InterviewPreparationResponse


router = APIRouter(tags=["Interview Preparation"])
interview_agent = InterviewPreparationAgent()


@router.post("/interview-preparation", response_model=InterviewPreparationResponse)
async def prepare_interview(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    experience_level: str = Form(...),
) -> InterviewPreparationResponse:
    """Prepare customized interview guidance from a resume and job description."""

    return await interview_agent.analyze(resume_file, job_description, experience_level)
