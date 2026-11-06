"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Gauge, MessageSquareText, Target } from "lucide-react";

import { useAnalysis } from "@/components/providers/analysis-provider";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import {
  loadInterviewPreparation,
  loadSkillGapAnalysis,
  type InterviewSnapshot,
  type SkillGapSnapshot,
} from "@/lib/analysis-storage";

export function LatestAnalysisSummary() {
  const { analysis } = useAnalysis();
  const [skillGap, setSkillGap] = useState<SkillGapSnapshot | null>(null);
  const [interview, setInterview] = useState<InterviewSnapshot | null>(null);

  useEffect(() => {
    setSkillGap(loadSkillGapAnalysis());
    setInterview(loadInterviewPreparation());
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <GlassCard className="rounded-[2rem] p-6 sm:p-7">
        <SectionHeader icon={Gauge} label="Latest Resume Analysis" href="/analysis" />
        {analysis ? (
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm text-slate-400">ATS Score</p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-5xl font-semibold text-white">{analysis.ats_score}</p>
                <p className="pb-2 text-sm text-slate-400">/100</p>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.ats_score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500"
                />
              </div>
            </div>
            <CompactList title="Strengths" icon={CheckCircle2} items={analysis.strengths} />
            <CompactList title="Weaknesses" icon={AlertTriangle} items={analysis.weaknesses} />
          </div>
        ) : (
          <EmptyState href="/upload" action="Upload resume" />
        )}
      </GlassCard>

      <GlassCard className="rounded-[2rem] p-6 sm:p-7">
        <SectionHeader icon={Target} label="Latest Skill Gap" href="/skill-gap-analysis" />
        {skillGap ? (
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm text-slate-400">Overall Match</p>
              <p className="mt-3 text-5xl font-semibold text-white">{skillGap.overall_match}%</p>
            </div>
            <CompactList title="Missing Skills" icon={AlertTriangle} items={skillGap.missing_skills} />
            <CompactList title="Recommended Skills" icon={CheckCircle2} items={skillGap.recommended_courses} />
          </div>
        ) : (
          <EmptyState href="/skill-gap-analysis" action="Run skill gap" />
        )}
      </GlassCard>

      <GlassCard className="rounded-[2rem] p-6 sm:p-7">
        <SectionHeader icon={MessageSquareText} label="Interview Preparation" href="/interview-preparation" />
        {interview ? (
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm text-slate-400">Overall Readiness</p>
              <p className="mt-3 text-5xl font-semibold text-white">{interview.overall_readiness}%</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MetricCard label="Technical Questions" value={interview.technical_questions.length} />
              <MetricCard label="HR Questions" value={interview.hr_questions.length} />
            </div>
          </div>
        ) : (
          <EmptyState href="/interview-preparation" action="Prepare interview" />
        )}
      </GlassCard>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Gauge;
  label: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-100">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-white">{label}</h2>
      </div>
      <Button asChild variant="secondary" size="sm">
        <Link href={href}>Open</Link>
      </Button>
    </div>
  );
}

function CompactList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof CheckCircle2;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Icon className="h-4 w-4 text-cyan-100" />
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {items.slice(0, 3).map((item) => (
          <p key={item} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-300">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyState({ href, action }: { href: string; action: string }) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center">
      <p className="text-sm leading-6 text-slate-300">No analysis available yet</p>
      <Button asChild size="sm" className="mt-5">
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  );
}
