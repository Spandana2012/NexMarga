from fastapi import APIRouter, File, UploadFile

from app.models.resume import ResumeAnalysisResponse
from app.services.resume_service import ResumeService


router = APIRouter(tags=["Resume"])
resume_service = ResumeService()


@router.post("/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(file: UploadFile = File(...)) -> ResumeAnalysisResponse:
    """Accept one PDF resume and return Gemini-powered ATS analysis JSON.

    The route delegates validation, temporary upload handling, PDF parsing, and
    agent execution to the service layer to keep the API boundary clean.
    """

    return await resume_service.analyze_uploaded_resume(file)
