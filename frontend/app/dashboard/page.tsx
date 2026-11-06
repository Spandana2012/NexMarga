import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { LatestAnalysisSummary } from "@/components/dashboard/latest-analysis-summary";

export default function DashboardPage() {
  return (
    <AppShell
    >
      <DashboardGreeting />
      <LatestAnalysisSummary />
    </AppShell>
  );
}
