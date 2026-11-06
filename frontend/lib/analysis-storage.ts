export type ResumeAnalysisSnapshot = {
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  recommendations: string[];
  source: "gemini" | "fallback";
};

export type SkillGapSnapshot = {
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

export type InterviewSnapshot = {
  overall_readiness: number;
  technical_questions: unknown[];
  project_questions: unknown[];
  hr_questions: unknown[];
  coding_topics: unknown[];
  system_design_topics: unknown[];
  behavioral_topics: string[];
  resume_based_focus: string[];
  interview_tips: string[];
  study_plan: unknown[];
  source: "gemini";
};

export const ANALYSIS_STORAGE_KEYS = {
  resume: "nexmarga.latestAnalysis",
  skillGap: "nexmarga.latestSkillGapAnalysis",
  interview: "nexmarga.latestInterviewPreparation",
} as const;

export function saveSkillGapAnalysis(analysis: SkillGapSnapshot) {
  window.localStorage.setItem(ANALYSIS_STORAGE_KEYS.skillGap, JSON.stringify(analysis));
}

export function saveInterviewPreparation(analysis: InterviewSnapshot) {
  window.localStorage.setItem(ANALYSIS_STORAGE_KEYS.interview, JSON.stringify(analysis));
}

export function loadResumeAnalysis(): ResumeAnalysisSnapshot | null {
  return loadAnalysis(ANALYSIS_STORAGE_KEYS.resume, isResumeAnalysisSnapshot);
}

export function loadSkillGapAnalysis(): SkillGapSnapshot | null {
  return loadAnalysis(ANALYSIS_STORAGE_KEYS.skillGap, isSkillGapSnapshot);
}

export function loadInterviewPreparation(): InterviewSnapshot | null {
  return loadAnalysis(ANALYSIS_STORAGE_KEYS.interview, isInterviewSnapshot);
}

function loadAnalysis<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const storedValue = window.localStorage.getItem(key);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (isValid(parsedValue)) {
      return parsedValue;
    }

    window.localStorage.removeItem(key);
    return null;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isResumeAnalysisSnapshot(value: unknown): value is ResumeAnalysisSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ResumeAnalysisSnapshot>;

  return (
    typeof candidate.ats_score === "number" &&
    isStringList(candidate.strengths) &&
    isStringList(candidate.weaknesses) &&
    isStringList(candidate.missing_skills) &&
    isStringList(candidate.recommendations)
  );
}

function isSkillGapSnapshot(value: unknown): value is SkillGapSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SkillGapSnapshot>;

  return (
    typeof candidate.overall_match === "number" &&
    isStringList(candidate.matching_skills) &&
    isStringList(candidate.missing_skills) &&
    isStringList(candidate.recommended_courses)
  );
}

function isInterviewSnapshot(value: unknown): value is InterviewSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<InterviewSnapshot>;

  return (
    typeof candidate.overall_readiness === "number" &&
    Array.isArray(candidate.technical_questions) &&
    Array.isArray(candidate.hr_questions)
  );
}
