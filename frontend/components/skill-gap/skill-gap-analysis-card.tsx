"use client";

import { type FormEvent, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  FileText,
  GraduationCap,
  Keyboard,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { analyzeSkillGap, type SkillGapAnalysisResponse } from "@/lib/api";
import { saveSkillGapAnalysis } from "@/lib/analysis-storage";

type SkillGapStatus = "idle" | "analyzing" | "completed" | "failed";

const resultSections = [
  { key: "matching_skills", title: "Matching Skills", icon: CheckCircle2 },
  { key: "missing_skills", title: "Missing Skills", icon: FileSearch },
  { key: "experience_gap", title: "Experience Gap", icon: BriefcaseBusiness },
  { key: "ats_keywords_missing", title: "ATS Missing Keywords", icon: Keyboard },
  { key: "recommended_courses", title: "Recommended Learning", icon: GraduationCap },
  { key: "interview_focus", title: "Interview Focus", icon: MessageSquareText },
  { key: "resume_improvements", title: "Resume Improvements", icon: BookOpenCheck },
] as const;

export function SkillGapAnalysisCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const jobDescriptionId = useId();
  const errorId = useId();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [status, setStatus] = useState<SkillGapStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SkillGapAnalysisResponse | null>(null);
  const isAnalyzing = status === "analyzing";

  function formatBytes(bytes: number) {
    if (bytes === 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function chooseFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug("[Skill Gap] file selected", file.name);
    }

    if (!isPdf(file)) {
      setSelectedFile(null);
      setStatus("failed");
      setErrorMessage("Please upload a PDF resume.");
      clearNativeInput();
      toast({
        title: "Invalid file",
        description: "Only PDF resumes are supported for Skill Gap analysis.",
        variant: "error",
      });
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);

    if (status === "failed") {
      setStatus("idle");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isAnalyzing) {
      return;
    }

    if (!selectedFile || !jobDescription.trim()) {
      setErrorMessage("Please upload a PDF resume and enter a job description.");
      return;
    }

    if (!isPdf(selectedFile)) {
      setErrorMessage("Please upload a PDF resume.");
      return;
    }

    setStatus("analyzing");
    setErrorMessage(null);
    setAnalysis(null);

    try {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[Skill Gap] analyze started");
      }

      const result = await analyzeSkillGap(selectedFile, jobDescription.trim());

      if (process.env.NODE_ENV !== "production") {
        console.debug("[Skill Gap] API response", result);
      }

      saveSkillGapAnalysis(result);
      setAnalysis(result);
      setStatus("completed");
      toast({
        title: "Skill gap analysis complete",
        description: `Overall match: ${result.overall_match}%`,
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Skill gap analysis failed. Please try again.";
      setStatus("failed");
      setErrorMessage(message);
      toast({
        title: "Analysis failed",
        description: message,
        variant: "error",
      });
    }
  }

  function resetForm() {
    setSelectedFile(null);
    setJobDescription("");
    setStatus("idle");
    setErrorMessage(null);
    setAnalysis(null);
    clearNativeInput();
  }

  function clearSelectedFile() {
    setSelectedFile(null);
    clearNativeInput();

    if (status === "failed") {
      setStatus("idle");
      setErrorMessage(null);
    }
  }

  function clearNativeInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <GlassCard className="overflow-hidden rounded-[2rem] p-0 before:pointer-events-none">
        <div className="min-w-0">
          <form
            onSubmit={handleSubmit}
            className="relative z-10 min-w-0 border-b border-white/10 bg-white/[0.03] p-6 sm:p-8"
          >
            <p className="text-sm uppercase tracking-[0.28em] text-blue-200/80">
              Skill gap agent
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Compare a resume with a target role
            </h2>
            <p className="mt-4 text-slate-300">
              Upload a PDF resume, paste a job description, and get a structured gap analysis from Gemini.
            </p>

            <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="min-w-0">
                <label htmlFor={fileInputId} className="mb-2 block text-sm font-medium text-slate-200">
                  Resume PDF
                </label>
                <input
                  id={fileInputId}
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="peer sr-only"
                  disabled={isAnalyzing}
                  aria-describedby={errorMessage ? errorId : undefined}
                  onChange={(event) => chooseFile(event.target.files?.[0])}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: isAnalyzing ? 1 : 1.01 }}
                  disabled={isAnalyzing}
                  onClick={() => inputRef.current?.click()}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    if (!isAnalyzing) {
                      setIsDragging(true);
                    }
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!isAnalyzing) {
                      setIsDragging(true);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);

                    if (!isAnalyzing) {
                      chooseFile(event.dataTransfer.files[0]);
                    }
                  }}
                  className={[
                    "flex w-full cursor-pointer items-center gap-4 rounded-[1.5rem] border border-dashed bg-black/20 p-5 text-left transition",
                    "hover:border-cyan-200/60 hover:bg-cyan-300/[0.04] focus-visible:border-cyan-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30",
                    isDragging ? "border-cyan-200/80 bg-cyan-300/[0.06]" : "border-cyan-200/30",
                    isAnalyzing ? "cursor-not-allowed opacity-70" : "",
                  ].join(" ")}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-cyan-100">
                    {selectedFile ? <FileText className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-white">
                      {selectedFile ? selectedFile.name : "Upload resume PDF"}
                    </span>
                    <span className="mt-1 block text-sm text-slate-400">
                      {selectedFile ? `${formatBytes(selectedFile.size)} selected` : "Click, tab to select, or drag in a PDF"}
                    </span>
                  </span>
                </motion.button>
                {selectedFile ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                      Ready for analysis
                    </span>
                    <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={isAnalyzing}>
                      <UploadCloud className="h-4 w-4" />
                      Replace
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSelectedFile} disabled={isAnalyzing}>
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="min-w-0">
                <label htmlFor={jobDescriptionId} className="mb-2 block text-sm font-medium text-slate-200">
                  Job description
                </label>
                <textarea
                  id={jobDescriptionId}
                  value={jobDescription}
                  disabled={isAnalyzing}
                  aria-describedby={errorMessage ? errorId : undefined}
                  onChange={(event) => {
                    setJobDescription(event.target.value);
                    if (errorMessage && event.target.value.trim()) {
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="Paste the complete target role description here, including responsibilities, skills, seniority, and preferred qualifications."
                  className="min-h-72 w-full resize-y rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <div className="mt-2 flex justify-end text-xs text-slate-500">
                  {jobDescription.length.toLocaleString()} characters
                </div>
              </div>

              {errorMessage ? (
                <div
                  id={errorId}
                  role="alert"
                  className="flex items-start gap-3 rounded-[1.25rem] border border-rose-300/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100 lg:col-span-2"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isAnalyzing ? "Analyzing..." : "Analyze Skill Gap"}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={isAnalyzing}>
                  <RotateCcw className="h-4 w-4" />
                  {analysis ? "Analyze Again" : "Reset"}
                </Button>
              </div>
            </div>
          </form>

          <div className="relative z-10 min-w-0 p-6 sm:p-8">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-300">
                  {status === "completed"
                    ? "Analysis complete"
                    : status === "analyzing"
                      ? "Analyzing your skill gap..."
                      : status === "failed"
                        ? "Analysis needs attention"
                        : "Waiting for inputs"}
                </span>
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-100" />
                ) : status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : null}
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                {isAnalyzing ? (
                  <motion.div
                    animate={{ x: ["-30%", "130%"] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
                  />
                ) : (
                  <div
                    className={[
                      "h-full rounded-full transition-all",
                      status === "completed"
                        ? "w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
                        : "w-0 bg-white/20",
                    ].join(" ")}
                  />
                )}
              </div>
            </div>

            {isAnalyzing ? (
              <div className="mt-6 flex min-h-96 items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
                <div>
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-100" />
                  <h3 className="mt-4 text-xl font-medium text-white">Analyzing your skill gap...</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    NexMarga is comparing your resume with the target job description. This can take a moment.
                  </p>
                </div>
              </div>
            ) : analysis ? (
              <SkillGapResults analysis={analysis} />
            ) : (
              <div className="mt-6 flex min-h-96 items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
                <div>
                  <FileSearch className="mx-auto h-10 w-10 text-cyan-100" />
                  <h3 className="mt-4 text-xl font-medium text-white">Waiting for inputs</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Upload your resume and add a target job description to generate your personalized skill-gap analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function SkillGapResults({ analysis }: { analysis: SkillGapAnalysisResponse }) {
  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-blue-200/80">Skill Gap Analysis</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Personalized analysis based on your resume and target role
        </h3>
      </div>

      <div className="rounded-[1.5rem] border border-cyan-200/20 bg-cyan-300/[0.05] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-cyan-100">
              <FileText className="h-5 w-5" />
              <span className="text-sm uppercase tracking-[0.24em]">Overall Match</span>
            </div>
            <p className="mt-4 text-5xl font-semibold text-white">{analysis.overall_match}%</p>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
            Source: {analysis.source}
          </span>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {resultSections.map((section) => {
          const Icon = section.icon;
          const items = analysis[section.key];

          return (
            <section key={section.key} className="min-w-0 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0 text-cyan-100" />
                <h3 className="font-medium text-white">{section.title}</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                {items.map((item, index) => (
                  <li key={`${section.key}-${index}`} className="break-words rounded-2xl bg-white/[0.04] px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
