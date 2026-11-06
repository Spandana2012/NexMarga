"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/components/providers/auth-provider";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isReady, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-center text-slate-300">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-100" />
          <p className="mt-4 text-sm">Opening your NexMarga workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden px-4 py-20 lg:px-6 lg:py-6">
      <div className="mx-auto flex max-w-[1600px] gap-5">
        <AppSidebar />
        <motion.main
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="min-w-0 flex-1 space-y-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
