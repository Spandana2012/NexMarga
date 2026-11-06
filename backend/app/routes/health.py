from fastapi import APIRouter

from app.models.resume import HealthResponse


# API routing stays grouped by feature. This keeps main.py focused on app
# startup, middleware, and router registration instead of endpoint details.
router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="NexMarga Backend")
