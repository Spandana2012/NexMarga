import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

from app.routes.health import router as health_router  # noqa: E402
from app.routes.interview import router as interview_router  # noqa: E402
from app.routes.resume import router as resume_router  # noqa: E402
from app.routes.skill_gap import router as skill_gap_router  # noqa: E402

app = FastAPI(
    title=os.getenv("APP_NAME", "NexMarga Backend"),
    version="0.1.0",
    description="FastAPI foundation for the NexMarga resume analysis pipeline.",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# FastAPI request flow:
# 1. main.py receives the request and matches it to a router.
# 2. route handlers validate HTTP-level inputs and call services.
# 3. services coordinate uploads, PDF extraction, and the analyzer agent.
# 4. agents call AI services and return the Pydantic response model.
app.include_router(health_router)
app.include_router(resume_router)
app.include_router(skill_gap_router)
app.include_router(interview_router)
