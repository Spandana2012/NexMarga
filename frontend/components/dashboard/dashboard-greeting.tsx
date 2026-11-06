"use client";

import { TopNavbar } from "@/components/dashboard/top-navbar";
import { useAuth } from "@/components/providers/auth-provider";

export function DashboardGreeting() {
  const { user } = useAuth();
  const name = user?.name?.trim() || "there";

  return (
    <TopNavbar
      title={`Hello, ${name} 👋`}
      description="Review the latest backend results from Resume Analyzer, Skill Gap Agent, and Interview Preparation."
    />
  );
}
