"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { AnalysisResponse } from "@/lib/api";
import { ANALYSIS_STORAGE_KEYS } from "@/lib/analysis-storage";

type AnalysisContextValue = {
  analysis: AnalysisResponse | null;
  isAnalysisLoading: boolean;
  setAnalysis: (analysis: AnalysisResponse | null) => void;
};

const AnalysisContext = createContext<AnalysisContextValue | null>(null);
const ANALYSIS_STORAGE_KEY = ANALYSIS_STORAGE_KEYS.resume;

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AnalysisResponse>;

  return (
    typeof candidate.ats_score === "number" &&
    candidate.ats_score >= 0 &&
    candidate.ats_score <= 100 &&
    isStringList(candidate.strengths) &&
    isStringList(candidate.weaknesses) &&
    isStringList(candidate.missing_skills) &&
    isStringList(candidate.recommendations) &&
    (candidate.source === "gemini" || candidate.source === "fallback")
  );
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(true);

  useEffect(() => {
    try {
      const storedAnalysis = window.localStorage.getItem(ANALYSIS_STORAGE_KEY);

      if (!storedAnalysis) {
        return;
      }

      const parsedAnalysis: unknown = JSON.parse(storedAnalysis);

      if (isAnalysisResponse(parsedAnalysis)) {
        setAnalysis(parsedAnalysis);
      } else {
        window.localStorage.removeItem(ANALYSIS_STORAGE_KEY);
      }
    } catch {
      window.localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    } finally {
      setIsAnalysisLoading(false);
    }
  }, []);

  const updateAnalysis = useCallback((nextAnalysis: AnalysisResponse | null) => {
    setAnalysis(nextAnalysis);

    if (nextAnalysis) {
      window.localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(nextAnalysis));
    } else {
      window.localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({ analysis, isAnalysisLoading, setAnalysis: updateAnalysis }),
    [analysis, isAnalysisLoading, updateAnalysis],
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);

  if (!context) {
    throw new Error("useAnalysis must be used inside AnalysisProvider.");
  }

  return context;
}
