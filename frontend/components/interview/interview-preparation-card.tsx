"use client";

import { type FormEvent, type ReactNode, useId, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  ClipboardCheck,
  Code2,
  FileQuestion,
  FileText,
  Layers3,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import {
  prepareInterview,
  type ExperienceLevel,
  type InterviewPreparationResponse,
  type TechnicalQuestion,
  type TopicPriority,
} from "@/lib/api";
import { saveInterviewPreparation } from "@/lib/analysis-storage";

type InterviewStatus = "idle" | "analyzing" | "completed" | "failed";

const experienceLevels: ExperienceLevel[] = ["Intern", "Fresher", "1-3 Years", "3-5 Years", "5+ Years"];

const allSectionKeys = ["technical", "project", "hr", "coding", "system", "behavioral", "resume", "tips", "plan"];

export function InterviewPreparationCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const jobDescriptionId = useId();
  const experienceLevelId = useId();
  const errorId = useId();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">("");
  const [status, setStatus] = useState<InterviewStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InterviewPreparationResponse | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(["technical"]);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  const isAnalyzing = status === "analyzing";
  const currentButtonLabel = analysis ? "Prepare Again" : "Prepare Interview";
  const expandedAll = useMemo(() => openSections.length === allSectionKeys.length, [openSections]);

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

    if (!isPdf(file)) {
      setSelectedFile(null);
      setStatus("failed");
      setErrorMessage("Please upload a PDF resume.");
      clearNativeInput();
      toast({
        title: "Invalid file",
        description: "Only PDF resumes are supported for Interview Preparation.",
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

    const validationMessage = getValidationMessage();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setStatus("analyzing");
    setErrorMessage(null);
    setAnalysis(null);

    try {
      const result = await prepareInterview(selectedFile as File, jobDescription.trim(), experienceLevel as ExperienceLevel);

      saveInterviewPreparation(result);
      setAnalysis(result);
      setStatus("completed");
      setOpenSections(allSectionKeys);
      toast({
        title: "Interview preparation ready",
        description: `Overall readiness: ${result.overall_readiness}%`,
        variant: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Interview preparation failed. Please try again.";
      setStatus("failed");
      setErrorMessage(message);
      toast({
        title: "Preparation failed",
        description: message,
        variant: "error",
      });
    }
  }

  function getValidationMessage() {
    if (!selectedFile && !jobDescription.trim() && !experienceLevel) {
      return "Please upload a resume, enter a job description, and select your experience level.";
    }

    if (!selectedFile) {
      return "Please upload your resume.";
    }

    if (!isPdf(selectedFile)) {
      return "Please upload a PDF resume.";
    }

    if (!jobDescription.trim()) {
      return "Please enter the job description.";
    }

    if (!experienceLevel) {
      return "Please select your experience level.";
    }

    return null;
  }

  function resetForm() {
    setSelectedFile(null);
    setJobDescription("");
    setExperienceLevel("");
    setStatus("idle");
    setErrorMessage(null);
    setAnalysis(null);
    setOpenSections(["technical"]);
    setCopiedQuestion(null);
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

  function toggleSection(section: string) {
    setOpenSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
  }

  function toggleAllSections() {
    setOpenSections((current) => (current.length === allSectionKeys.length ? [] : allSectionKeys));
  }

  async function copyQuestion(question: string) {
    await navigator.clipboard.writeText(question);
    setCopiedQuestion(question);
    window.setTimeout(() => setCopiedQuestion(null), 1600);
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
              Interview Preparation
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Practice for the role before the room gets real
            </h2>
            <p className="mt-4 text-slate-300">
              Upload a resume, paste a job description, choose experience level, and generate a focused interview plan.
            </p>

            <div className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="min-w-0">
                <label htmlFor={fileInputId} className="mb-2 block text-sm font-medium text-slate-200">
                  Resume PDF
                </label>
                <input
                  id={fileInputId}
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  disabled={isAnalyzing}
                  aria-describedby={errorMessage ? errorId : undefined}
                  onChange={(event) => chooseFile(event.target.files?.[0])}
                />
                <motion.button
                  type="button"
                  disabled={isAnalyzing}
                  whileHover={{ scale: isAnalyzing ? 1 : 1.01 }}
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
                      Ready for preparation
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
                  placeholder="Paste the complete target role description here, including responsibilities, technical stack, seniority, and interview expectations."
                  className="min-h-64 w-full resize-y rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <div className="mt-2 flex justify-end text-xs text-slate-500">
                  {jobDescription.length.toLocaleString()} characters
                </div>
              </div>

              <div className="min-w-0 lg:max-w-md">
                <label htmlFor={experienceLevelId} className="mb-2 block text-sm font-medium text-slate-200">
                  Experience level
                </label>
                <select
                  id={experienceLevelId}
                  value={experienceLevel}
                  disabled={isAnalyzing}
                  aria-describedby={errorMessage ? errorId : undefined}
                  onChange={(event) => {
                    setExperienceLevel(event.target.value as ExperienceLevel | "");
                    if (errorMessage && event.target.value) {
                      setErrorMessage(null);
                    }
                  }}
                  className="h-12 w-full rounded-full border border-white/10 bg-black/30 px-5 text-sm text-white outline-none transition focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="" className="bg-slate-950 text-white">
                    Select experience level
                  </option>
                  {experienceLevels.map((level) => (
                    <option key={level} value={level} className="bg-slate-950 text-white">
                      {level}
                    </option>
                  ))}
                </select>
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
                  {isAnalyzing ? "Preparing..." : currentButtonLabel}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} disabled={isAnalyzing}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
          </form>

          <div className="relative z-10 min-w-0 p-6 sm:p-8">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-300">
                  {status === "completed"
                    ? "Preparation complete"
                    : status === "analyzing"
                      ? "Preparing your interview..."
                      : status === "failed"
                        ? "Preparation needs attention"
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
              <LoadingState />
            ) : analysis ? (
              <InterviewResults
                analysis={analysis}
                expandedAll={expandedAll}
                openSections={openSections}
                copiedQuestion={copiedQuestion}
                onCopyQuestion={copyQuestion}
                onToggleAll={toggleAllSections}
                onToggleSection={toggleSection}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-6 flex min-h-96 items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
      <div>
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-100" />
        <h3 className="mt-4 text-xl font-medium text-white">Preparing your interview...</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          NexMarga is building role-specific questions, focus areas, and a 7-day plan from your resume and target role.
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 flex min-h-96 items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center">
      <div>
        <MessageSquareText className="mx-auto h-10 w-10 text-cyan-100" />
        <h3 className="mt-4 text-xl font-medium text-white">Your personalized interview plan will appear here</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          Upload your resume, paste the job description, select your experience level, then prepare for the interview.
        </p>
      </div>
    </div>
  );
}

function InterviewResults({
  analysis,
  expandedAll,
  openSections,
  copiedQuestion,
  onCopyQuestion,
  onToggleAll,
  onToggleSection,
}: {
  analysis: InterviewPreparationResponse;
  expandedAll: boolean;
  openSections: string[];
  copiedQuestion: string | null;
  onCopyQuestion: (question: string) => Promise<void>;
  onToggleAll: () => void;
  onToggleSection: (id: string) => void;
}) {
  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-blue-200/80">Interview Preparation Results</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
          Personalized interview preparation based on your resume, role, and experience level
        </h3>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="flex items-center justify-center rounded-[1.5rem] border border-cyan-200/20 bg-cyan-300/[0.05] p-6">
          <CircularScore value={analysis.overall_readiness} />
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-3 text-cyan-100">
            <Brain className="h-5 w-5" />
            <span className="text-sm uppercase tracking-[0.24em]">Readiness Snapshot</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Use these real backend-generated questions, focus areas, and the 7-day plan to rehearse role-specific answers before the interview.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={onToggleAll}>
              {expandedAll ? "Collapse all" : "Expand all"}
            </Button>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
              Source: {analysis.source}
            </span>
          </div>
        </div>
      </div>

      <AccordionSection
        id="technical"
        title="Technical Questions"
        icon={FileQuestion}
        isOpen={openSections.includes("technical")}
        onToggle={onToggleSection}
      >
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {analysis.technical_questions.map((item, index) => (
            <div key={`${item.question}-${index}`} className="min-w-0 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <span className={difficultyClass(item.difficulty)}>{item.difficulty}</span>
                <button
                  type="button"
                  onClick={() => void onCopyQuestion(item.question)}
                  className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  aria-label="Copy question"
                >
                  {copiedQuestion === item.question ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                </button>
              </div>
              <h4 className="mt-4 break-words font-medium leading-6 text-white">{item.question}</h4>
              <div className="mt-3 space-y-2 text-sm leading-6">
                <p className="text-slate-300">
                  <span className="font-medium text-cyan-100">Topic:</span> {item.topic}
                </p>
                <p className="text-slate-400">
                  <span className="font-medium text-slate-200">Why this is being asked:</span> {item.why_asked}
                </p>
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        id="project"
        title="Project Questions"
        icon={Layers3}
        isOpen={openSections.includes("project")}
        onToggle={onToggleSection}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {analysis.project_questions.map((item, index) => (
            <div key={`${item.project}-${index}`} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">{item.project}</p>
              <h4 className="mt-3 break-words font-medium leading-6 text-white">{item.question}</h4>
              <p className="mt-4 text-sm font-medium text-slate-200">Strong answer should cover</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {item.expected_points.map((point, pointIndex) => (
                  <li key={`${item.project}-${pointIndex}`} className="break-words rounded-2xl bg-black/20 px-4 py-2">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="hr" title="HR Questions" icon={Users} isOpen={openSections.includes("hr")} onToggle={onToggleSection}>
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {analysis.hr_questions.map((item, index) => (
            <div key={`${item.question}-${index}`} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <h4 className="break-words font-medium leading-6 text-white">{item.question}</h4>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                <span className="font-medium text-slate-200">Personalized tips:</span> {item.tips}
              </p>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="coding" title="Coding Topics" icon={Code2} isOpen={openSections.includes("coding")} onToggle={onToggleSection}>
        <PriorityChips items={analysis.coding_topics} />
      </AccordionSection>

      <AccordionSection id="system" title="System Design Topics" icon={Brain} isOpen={openSections.includes("system")} onToggle={onToggleSection}>
        <PriorityChips items={analysis.system_design_topics} />
      </AccordionSection>

      <AccordionSection id="behavioral" title="Behavioral Topics" icon={MessageSquareText} isOpen={openSections.includes("behavioral")} onToggle={onToggleSection}>
        <HighlightList items={analysis.behavioral_topics} />
      </AccordionSection>

      <AccordionSection id="resume" title="Resume-Based Focus" icon={FileText} isOpen={openSections.includes("resume")} onToggle={onToggleSection}>
        <HighlightList items={analysis.resume_based_focus} />
      </AccordionSection>

      <AccordionSection id="tips" title="Interview Tips" icon={CheckCircle2} isOpen={openSections.includes("tips")} onToggle={onToggleSection}>
        <Checklist items={analysis.interview_tips} />
      </AccordionSection>

      <AccordionSection id="plan" title="7-Day Study Plan" icon={BookOpenCheck} isOpen={openSections.includes("plan")} onToggle={onToggleSection}>
        <div className="space-y-3">
          {analysis.study_plan.map((item) => (
            <div key={item.day} className="grid gap-4 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[80px_1fr]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-lg font-semibold text-cyan-100">
                Day {item.day}
              </div>
              <p className="text-sm leading-6 text-slate-300">{item.focus}</p>
            </div>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}

function CircularScore({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(value, 100));

  return (
    <div
      className="flex h-40 w-40 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(rgb(34 211 238) ${clamped * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
      }}
    >
      <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-slate-950/90">
        <span className="text-4xl font-semibold text-white">{clamped}</span>
        <span className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-100">/ 100 Ready</span>
      </div>
    </div>
  );
}

function AccordionSection({
  id,
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/20">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30"
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 items-center gap-3 font-medium text-white">
          <Icon className="h-5 w-5 shrink-0 text-cyan-100" />
          <span className="break-words">{title}</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen ? <div className="max-h-[42rem] overflow-y-auto px-5 pb-5">{children}</div> : null}
    </section>
  );
}

function PriorityChips({ items }: { items: TopicPriority[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, index) => (
        <span key={`${item.topic}-${index}`} className={priorityClass(item.priority)}>
          {item.topic} - {item.priority}
        </span>
      ))}
    </div>
  );
}

function HighlightList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="break-words rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
          {item}
        </div>
      ))}
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex gap-3 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <span className="break-words">{item}</span>
        </div>
      ))}
    </div>
  );
}

function difficultyClass(difficulty: TechnicalQuestion["difficulty"]) {
  const base = "rounded-full border px-3 py-1 text-xs";

  if (difficulty === "Hard") {
    return `${base} border-rose-300/30 bg-rose-400/10 text-rose-100`;
  }

  if (difficulty === "Medium") {
    return `${base} border-amber-300/30 bg-amber-400/10 text-amber-100`;
  }

  return `${base} border-emerald-300/30 bg-emerald-400/10 text-emerald-100`;
}

function priorityClass(priority: TopicPriority["priority"]) {
  const base = "rounded-full border px-4 py-2 text-sm";

  if (priority === "High") {
    return `${base} border-rose-300/30 bg-rose-400/10 text-rose-100`;
  }

  if (priority === "Medium") {
    return `${base} border-cyan-300/30 bg-cyan-400/10 text-cyan-100`;
  }

  return `${base} border-white/10 bg-white/[0.05] text-slate-300`;
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
