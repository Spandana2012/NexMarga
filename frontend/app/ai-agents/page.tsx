import Link from "next/link";
import { Bot, FileSearch, MessageSquareText, Target } from "lucide-react";

import { AppShell } from "@/components/dashboard/app-shell";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { GlassCard } from "@/components/ui/card";

const agents = [
  {
    title: "Resume Analyzer",
    copy: "Review ATS score, resume strengths, weaknesses, and recommendations.",
    href: "/upload",
    icon: FileSearch,
  },
  {
    title: "Skill Gap Agent",
    copy: "Compare a resume with a job description and identify target-role gaps.",
    href: "/skill-gap-analysis",
    icon: Target,
  },
  {
    title: "Interview Preparation",
    copy: "Generate technical, project, HR, and study-plan preparation.",
    href: "/interview-preparation",
    icon: MessageSquareText,
  },
];

export default function AIAgentsPage() {
  return (
    <AppShell>
      <TopNavbar
        title="AI agents"
        description="Choose one of the live backend-powered NexMarga agents."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {agents.map((agent) => {
          const Icon = agent.icon;

          return (
            <Link key={agent.title} href={agent.href}>
              <GlassCard className="h-full rounded-[1.75rem] p-5 transition hover:-translate-y-1 hover:border-cyan-300/25">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">
                    <Bot className="h-3.5 w-3.5" />
                    Live
                  </div>
                </div>
                <h2 className="mt-6 text-lg font-semibold text-white">{agent.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{agent.copy}</p>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
