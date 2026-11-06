"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Loader2,
  Target,
  UploadCloud,
} from "lucide-react";

import { useAnalysis } from "@/components/providers/analysis-provider";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

export function AnalysisOverview() {
  const { analysis, isAnalysisLoading } = useAnalysis();

  if (isAnalysisLoading) {
    return (
      <GlassCard className="rounded-[2rem] p-8">
        <div className="flex min-h-80 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-100">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-white">Loading saved analysis</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
            Checking this browser for the latest resume analysis returned by the backend.
          </p>
        </div>
      </GlassCard>
    );
  }

  if (!analysis) {
    return (
      <GlassCard className="rounded-[2rem] p-8">
        <div className="flex min-h-80 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-100">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-white">No resume analysis yet</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
            Upload a PDF resume to generate a real ATS score, strengths, weaknesses, missing skills, and recommendations.
          </p>
          <Button asChild className="mt-7">
            <Link href="/upload">Upload resume</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  const sourceLabel = analysis.source === "gemini" ? "Gemini" : "Fallback";
  const sourceClassName =
    analysis.source === "gemini"
      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
      : "border-amber-300/20 bg-amber-300/10 text-amber-100";

  const panels = [
    {
      title: "Strengths",
      icon: CheckCircle2,
      items: analysis.strengths,
      tone: "text-emerald-200",
    },
    {
      title: "Weaknesses",
      icon: AlertTriangle,
      items: analysis.weaknesses,
      tone: "text-amber-200",
    },
    {
      title: "Missing skills",
      icon: Target,
      items: analysis.missing_skills,
      tone: "text-cyan-200",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <GlassCard className="rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">ATS score</p>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${sourceClassName}`}>
                  {sourceLabel}
                </span>
              </div>
              <h2 className="mt-4 text-5xl font-semibold text-white">{analysis.ats_score}</h2>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-100">
              <Gauge className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-8 h-4 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.ats_score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500"
            />
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            Real FastAPI analysis rendered from the uploaded resume response.
          </p>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-3">
          {panels.map((panel, index) => {
            const Icon = panel.icon;

            return (
              <motion.div
                key={panel.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -6 }}
              >
                <GlassCard className="h-full rounded-[1.75rem] p-5">
                  <Icon className={panel.tone} />
                  <h3 className="mt-5 text-lg font-semibold text-white">{panel.title}</h3>
                  <div className="mt-5 space-y-3">
                    {panel.items.map((item) => (
                      <p
                        key={item}
                        className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      <GlassCard className="rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-100">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI recommendations</h2>
            <p className="text-sm text-slate-400">Generated from the backend response</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {analysis.recommendations.map((item) => (
            <motion.div
              key={item}
              whileHover={{ y: -4 }}
              className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300"
            >
              <span className="flex gap-3">
                <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                {item}
              </span>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
