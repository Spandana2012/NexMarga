import { AppShell } from "@/components/dashboard/app-shell";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { InterviewPreparationCard } from "@/components/interview/interview-preparation-card";


export default function InterviewPreparationPage() {
  return (
    <AppShell>
      <TopNavbar
        title="Interview Preparation"
        description="Generate customized technical, project, HR, and study-plan preparation from a resume and job description."
      />
      <InterviewPreparationCard />
    </AppShell>
  );
}
