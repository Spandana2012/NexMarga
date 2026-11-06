export type AnalysisResponse = {
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  recommendations: string[];
  source: "gemini" | "fallback";
};

export type UploadState = "idle" | "uploading" | "analyzing" | "completed" | "failed";

export type SkillGapAnalysisResponse = {
  overall_match: number;
  matching_skills: string[];
  missing_skills: string[];
  experience_gap: string[];
  ats_keywords_missing: string[];
  recommended_courses: string[];
  interview_focus: string[];
  resume_improvements: string[];
  source: "gemini";
};

export type ExperienceLevel = "Intern" | "Fresher" | "1-3 Years" | "3-5 Years" | "5+ Years";

export type TechnicalQuestion = {
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  why_asked: string;
};

export type ProjectQuestion = {
  project: string;
  question: string;
  expected_points: string[];
};

export type HrQuestion = {
  question: string;
  tips: string;
};

export type TopicPriority = {
  topic: string;
  priority: "High" | "Medium" | "Low";
};

export type StudyPlanDay = {
  day: number;
  focus: string;
};

export type InterviewPreparationResponse = {
  overall_readiness: number;
  technical_questions: TechnicalQuestion[];
  project_questions: ProjectQuestion[];
  hr_questions: HrQuestion[];
  coding_topics: TopicPriority[];
  system_design_topics: TopicPriority[];
  behavioral_topics: string[];
  resume_based_focus: string[];
  interview_tips: string[];
  study_plan: StudyPlanDay[];
  source: "gemini";
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type ApiErrorPayload = {
  detail?: unknown;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function analyzeResume(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/analyze-resume`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw new ApiError("Backend unavailable. Please make sure FastAPI is running on port 8000.");
  }

  if (!response.ok) {
    let payload: ApiErrorPayload = {};

    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    throw new ApiError(resolveErrorMessage(response.status, detailToString(payload.detail)), response.status);
  }

  return response.json() as Promise<AnalysisResponse>;
}

export async function analyzeSkillGap(
  resumeFile: File,
  jobDescription: string,
): Promise<SkillGapAnalysisResponse> {
  const formData = new FormData();
  formData.append("resume_file", resumeFile);
  formData.append("job_description", jobDescription);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/skill-gap-analysis`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the NexMarga backend. Please make sure the backend is running.",
    );
  }

  if (!response.ok) {
    let payload: ApiErrorPayload = {};

    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    throw new ApiError(resolveSkillGapErrorMessage(response.status, detailToString(payload.detail)), response.status);
  }

  const payload: unknown = await response.json();

  if (!isSkillGapAnalysisResponse(payload)) {
    throw new ApiError("The Skill Gap Agent returned an unexpected response format.");
  }

  return payload;
}

export async function prepareInterview(
  resumeFile: File,
  jobDescription: string,
  experienceLevel: ExperienceLevel,
): Promise<InterviewPreparationResponse> {
  const formData = new FormData();
  formData.append("resume_file", resumeFile);
  formData.append("job_description", jobDescription);
  formData.append("experience_level", experienceLevel);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/interview-preparation`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError("Unable to connect to the backend. Make sure the NexMarga backend is running.");
  }

  if (!response.ok) {
    let payload: ApiErrorPayload = {};

    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    throw new ApiError(resolveInterviewErrorMessage(response.status, detailToString(payload.detail)), response.status);
  }

  const payload: unknown = await response.json();

  if (!isInterviewPreparationResponse(payload)) {
    throw new ApiError("The Interview Preparation Agent returned an unexpected response format.");
  }

  return payload;
}

function resolveErrorMessage(status: number, detail?: string) {
  if (status === 400 || status === 422) {
    return "Invalid PDF. Please upload a readable resume file.";
  }

  if (status === 429) {
    return "Gemini quota exceeded.\nPlease try again later.";
  }

  if (detail === "Gemini request timed out. Please retry." || detail === "Unable to connect to Gemini.") {
    return detail;
  }

  if (status === 503) {
    return "Gemini servers are busy.\nPlease try again in a minute.";
  }

  if (detail) {
    return detail;
  }

  if (status >= 500) {
    return "Resume analysis service failed. Please retry.";
  }

  return "Upload failed. Please try again.";
}

function resolveSkillGapErrorMessage(status: number, detail?: string) {
  if (status === 400) {
    return safeDetail(detail) ?? "Please upload a PDF resume and enter a job description.";
  }

  if (status === 401) {
    return "The AI service is not authorized. Please check the backend configuration.";
  }

  if (status === 403) {
    return "The AI service rejected this request. Please check backend access settings.";
  }

  if (status === 404) {
    return "The Skill Gap Agent endpoint or configured Gemini model could not be found.";
  }

  if (status === 422) {
    return safeDetail(detail) ?? "Please check the resume and job description fields.";
  }

  if (status === 429) {
    return "Gemini quota is temporarily unavailable. Please try again later.";
  }

  if (status === 503) {
    return safeDetail(detail) ?? "The AI service is temporarily unavailable. Please try again in a moment.";
  }

  if (status >= 500) {
    return safeDetail(detail) ?? "The Skill Gap Agent failed while processing this request. Please try again.";
  }

  return safeDetail(detail) ?? "Skill gap analysis failed. Please try again.";
}

function resolveInterviewErrorMessage(status: number, detail?: string) {
  if (status === 400) {
    return safeDetail(detail) ?? "Please upload a resume, enter a job description, and select your experience level.";
  }

  if (status === 401) {
    return "The AI service is not authorized. Please check the backend configuration.";
  }

  if (status === 403) {
    return "The AI service rejected this request. Please check backend access settings.";
  }

  if (status === 404) {
    return "The Interview Preparation endpoint or configured Gemini model could not be found.";
  }

  if (status === 422) {
    return safeDetail(detail) ?? "Please check the resume, job description, and experience level fields.";
  }

  if (status === 429) {
    return "Gemini quota is temporarily unavailable. Please try again later.";
  }

  if (status === 503) {
    return safeDetail(detail) ?? "Interview preparation is temporarily unavailable. Please try again in a few moments.";
  }

  if (status >= 500) {
    return safeDetail(detail) ?? "Interview preparation failed while processing this request. Please try again.";
  }

  return safeDetail(detail) ?? "Interview preparation failed. Please try again.";
}

function safeDetail(detail?: string) {
  if (!detail) {
    return undefined;
  }

  const normalized = detail.trim();

  if (
    !normalized ||
    normalized.length > 220 ||
    /traceback|api[_ -]?key|secret|token|password/i.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

function detailToString(detail: unknown) {
  return typeof detail === "string" ? detail : undefined;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSkillGapAnalysisResponse(value: unknown): value is SkillGapAnalysisResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SkillGapAnalysisResponse>;

  return (
    typeof candidate.overall_match === "number" &&
    candidate.overall_match >= 0 &&
    candidate.overall_match <= 100 &&
    isStringList(candidate.matching_skills) &&
    isStringList(candidate.missing_skills) &&
    isStringList(candidate.experience_gap) &&
    isStringList(candidate.ats_keywords_missing) &&
    isStringList(candidate.recommended_courses) &&
    isStringList(candidate.interview_focus) &&
    isStringList(candidate.resume_improvements) &&
    candidate.source === "gemini"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function hasString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isDifficulty(value: unknown): value is TechnicalQuestion["difficulty"] {
  return value === "Easy" || value === "Medium" || value === "Hard";
}

function isPriority(value: unknown): value is TopicPriority["priority"] {
  return value === "High" || value === "Medium" || value === "Low";
}

function isTechnicalQuestion(value: unknown): value is TechnicalQuestion {
  if (!isRecord(value)) {
    return false;
  }

  return (
    hasString(value.question) &&
    isDifficulty(value.difficulty) &&
    hasString(value.topic) &&
    hasString(value.why_asked)
  );
}

function isProjectQuestion(value: unknown): value is ProjectQuestion {
  if (!isRecord(value)) {
    return false;
  }

  return hasString(value.project) && hasString(value.question) && isStringList(value.expected_points);
}

function isHrQuestion(value: unknown): value is HrQuestion {
  if (!isRecord(value)) {
    return false;
  }

  return hasString(value.question) && hasString(value.tips);
}

function isTopicPriority(value: unknown): value is TopicPriority {
  if (!isRecord(value)) {
    return false;
  }

  return hasString(value.topic) && isPriority(value.priority);
}

function isStudyPlanDay(value: unknown): value is StudyPlanDay {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.day === "number" && value.day >= 1 && value.day <= 7 && hasString(value.focus);
}

function isInterviewPreparationResponse(value: unknown): value is InterviewPreparationResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.overall_readiness === "number" &&
    value.overall_readiness >= 0 &&
    value.overall_readiness <= 100 &&
    Array.isArray(value.technical_questions) &&
    value.technical_questions.every(isTechnicalQuestion) &&
    Array.isArray(value.project_questions) &&
    value.project_questions.every(isProjectQuestion) &&
    Array.isArray(value.hr_questions) &&
    value.hr_questions.every(isHrQuestion) &&
    Array.isArray(value.coding_topics) &&
    value.coding_topics.every(isTopicPriority) &&
    Array.isArray(value.system_design_topics) &&
    value.system_design_topics.every(isTopicPriority) &&
    isStringList(value.behavioral_topics) &&
    isStringList(value.resume_based_focus) &&
    isStringList(value.interview_tips) &&
    Array.isArray(value.study_plan) &&
    value.study_plan.every(isStudyPlanDay) &&
    value.source === "gemini"
  );
}
