from app.models.resume import ResumeAnalysisResponse
from app.services.gemini_service import ResumeAnalyzer


class ResumeAnalyzerAgent:
    """Single high-quality resume analyzer agent.

    This is intentionally not a multi-agent or LangGraph workflow yet. The
    agent owns resume-analysis intent and delegates provider-specific API calls
    to the Gemini service function.
    """

    def analyze(self, resume_text: str) -> ResumeAnalysisResponse:
        return ResumeAnalyzer().analyze(resume_text)
