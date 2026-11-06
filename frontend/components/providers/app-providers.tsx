"use client";

import type { ReactNode } from "react";

import { AnalysisProvider } from "@/components/providers/analysis-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToasterProvider } from "@/components/ui/toaster";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToasterProvider>
      <AuthProvider>
        <AnalysisProvider>{children}</AnalysisProvider>
      </AuthProvider>
    </ToasterProvider>
  );
}
