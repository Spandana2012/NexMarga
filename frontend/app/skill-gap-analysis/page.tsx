import { AppShell } from "@/components/dashboard/app-shell";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { SkillGapAnalysisCard } from "@/components/skill-gap/skill-gap-analysis-card";


export default function SkillGapAnalysisPage() {
  return (
    <AppShell>
      <TopNavbar
        title="Skill Gap Analysis"
        description="Compare a resume against a job description with the independent Skill Gap Agent."
      />
      <SkillGapAnalysisCard />
    </AppShell>
  );
}
