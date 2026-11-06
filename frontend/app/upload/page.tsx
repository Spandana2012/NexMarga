import { AppShell } from "@/components/dashboard/app-shell";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { ResumeUploadCard } from "@/components/upload/resume-upload-card";

export default function UploadPage() {
  return (
    <AppShell
    >
      <TopNavbar
        title="Upload experience"
        description="A polished frontend surface for future resume ingestion, privacy notices, and document validation."
      />
      <ResumeUploadCard />
    </AppShell>
  );
}
