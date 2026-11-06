"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Route, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function NexMargaLogo({
  collapsed = false,
  href = "/",
  className,
}: {
  collapsed?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3.5", className)}>
      <motion.div
        whileHover={{ rotate: -6, scale: 1.04 }}
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/25 bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-fuchsia-500/25 text-cyan-100 shadow-[0_0_38px_rgba(34,211,238,0.3)]"
      >
        <Route className="h-6 w-6" />
        <Sparkles className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-slate-950 p-0.5 text-amber-200" />
      </motion.div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-100/65">
            Enlightened Path
          </p>
          <p className="bg-gradient-to-r from-white via-cyan-100 to-fuchsia-100 bg-clip-text text-xl font-semibold text-transparent">
            NexMarga
          </p>
        </div>
      ) : null}
    </Link>
  );
}
