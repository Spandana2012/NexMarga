"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { useAnalysis } from "@/components/providers/analysis-provider";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { analyzeResume, type UploadState } from "@/lib/api";

export function ResumeUploadCard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { setAnalysis } = useAnalysis();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isWorking = status === "uploading" || status === "analyzing";

  function formatBytes(bytes: number) {
    if (bytes === 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  async function submitFile(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setSelectedFile(file);
      setStatus("failed");
      setErrorMessage("Please upload a PDF resume.");
      toast({
        title: "Invalid file",
        description: "Only PDF resumes are supported by the backend right now.",
        variant: "error",
      });
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setAnalysis(null);
    setProgress(18);
    setStatus("uploading");

    const uploadTimer = window.setTimeout(() => {
      setStatus("analyzing");
      setProgress(48);
    }, 350);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 5));
    }, 650);

    try {
      toast({
        title: "Resume upload started",
        description: "NexMarga is sending your PDF to the FastAPI analyzer.",
      });

      const analysis = await analyzeResume(file);

      window.clearTimeout(uploadTimer);
      window.clearInterval(progressTimer);
      setProgress(100);
      setStatus("completed");
      setAnalysis(analysis);
      toast({
        title: "Analysis complete",
        description: `ATS score: ${analysis.ats_score}/100`,
        variant: "success",
      });
      router.push("/analysis");
    } catch (error) {
      window.clearTimeout(uploadTimer);
      window.clearInterval(progressTimer);
      const message = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setProgress(0);
      setStatus("failed");
      setErrorMessage(message);
      toast({
        title: "Analysis failed",
        description: message,
        variant: "error",
      });
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (file) {
      void submitFile(file);
    }
  }

  function resetUpload() {
    setSelectedFile(null);
    setProgress(0);
    setStatus("idle");
    setErrorMessage(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <GlassCard className="overflow-hidden rounded-[2rem] p-0">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.28em] text-blue-200/80">
            Resume intake
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Prepare career analysis with a premium upload experience
          </h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Upload a PDF resume and NexMarga will send it to the FastAPI analyzer for ATS-style feedback.
          </p>

          <motion.div
            whileHover={{ scale: isWorking ? 1 : 1.01 }}
            animate={{
              borderColor: isDragging ? "rgba(103,232,249,0.8)" : "rgba(103,232,249,0.35)",
              boxShadow: status === "analyzing" ? "0 0 48px rgba(34,211,238,0.16)" : undefined,
            }}
            transition={{ duration: 0.25 }}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!isWorking) {
                setIsDragging(true);
              }
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isWorking) {
                setIsDragging(true);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              if (!isWorking) {
                handleFiles(event.dataTransfer.files);
              }
            }}
            className="glow-ring mt-8 flex min-h-72 flex-col items-center justify-center rounded-[1.75rem] border border-dashed bg-white/[0.03] p-8 text-center transition hover:bg-cyan-300/[0.04]"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              disabled={isWorking}
              onChange={(event) => handleFiles(event.target.files)}
            />
            <motion.div
              animate={{ scale: isDragging || status === "analyzing" ? 1.08 : 1 }}
              className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-blue-100"
            >
              {status === "completed" ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
              ) : isWorking ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <UploadCloud className="h-8 w-8" />
              )}
            </motion.div>
            <h3 className="mt-5 text-xl font-medium text-white">
              {status === "completed"
                ? "Resume analysis complete"
                : status === "analyzing"
                  ? "Analyzing..."
                  : status === "failed"
                    ? "Upload needs attention"
                    : "Drop your resume here"}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              {errorMessage
                ? errorMessage
                : selectedFile
                  ? "Your PDF is being processed by the NexMarga FastAPI backend."
                  : "Select or drag in a PDF resume to start real analysis."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => inputRef.current?.click()} disabled={isWorking}>
                {selectedFile ? "Choose another file" : "Select file"}
              </Button>
              {selectedFile ? (
                <Button variant="secondary" onClick={resetUpload} disabled={isWorking}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={isWorking}>
                  Import from drive
                </Button>
              )}
            </div>
          </motion.div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-300">
                {status === "completed"
                  ? "Analysis complete"
                  : status === "analyzing"
                    ? "Analyzing..."
                    : status === "uploading"
                      ? "Uploading to FastAPI"
                      : status === "failed"
                        ? "Upload failed"
                        : "Waiting for file"}
              </span>
              <span className="font-medium text-cyan-100">{progress}%</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
              />
            </div>
          </div>

          {selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-[1.5rem] border border-cyan-200/15 bg-cyan-300/[0.04] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-cyan-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{selectedFile.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatBytes(selectedFile.size)} · {selectedFile.type || "Resume document"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                  {status === "completed" ? "Ready" : status === "failed" ? "Failed" : "Processing"}
                </span>
              </div>
            </motion.div>
          ) : null}
        </div>

        <div className="border-t border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-200" />
                <p className="font-medium text-white">Accepted format</p>
              </div>
              <p className="mt-3 text-sm text-slate-400">PDF resumes only for the current FastAPI pipeline</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="font-medium text-white">Request scoped</p>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                The backend saves the file temporarily, extracts text, returns analysis, and cleans up the upload.
              </p>
            </div>
            {["Uploading PDF", "Extracting resume text", "Preparing ATS analysis"].map((item, index) => (
              <motion.div
                key={item}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-slate-300"
              >
                <CheckCircle2
                  className={
                    progress >= (index + 1) * 30
                      ? "h-4 w-4 text-emerald-300"
                      : "h-4 w-4 text-slate-600"
                  }
                />
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
