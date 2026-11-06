"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { NexMargaLogo } from "@/components/navbar/nexmarga-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { GlassCard } from "@/components/ui/card";

export function AuthFormShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isReady, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <NexMargaLogo href="/" />
        </div>
        <GlassCard className="rounded-[1.75rem] p-6 sm:p-8">
          {!isReady || isAuthenticated ? (
            <div className="flex min-h-[20rem] flex-col items-center justify-center text-center text-slate-300">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-100" />
              <p className="mt-4 text-sm">Opening your NexMarga workspace...</p>
            </div>
          ) : (
            <>
              <div className="mb-7 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-100/70">
                  NexMarga
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
              {children}
            </>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
