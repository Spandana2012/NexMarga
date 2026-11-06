import { AnalysisOverview } from "@/components/analysis/analysis-overview";
import { AppShell } from "@/components/dashboard/app-shell";
import { TopNavbar } from "@/components/dashboard/top-navbar";

export default function AnalysisPage() {
  return (
    <AppShell
    >
      <TopNavbar
        title="Analysis workspace"
        description="This page is intentionally frontend-only and acts as the future destination for resume intelligence, recommendations, and interview prep output."
      />
      <AnalysisOverview />
    </AppShell>
  );
}
