"use client";

import { useState } from "react";
import { Bell, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/card";

export function TopNavbar({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [query, setQuery] = useState("");

  return (
    <GlassCard className="rounded-[1.75rem] p-4 sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge>Premium workspace</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 md:min-w-[22rem] md:justify-end">
          <label className="group hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition duration-300 focus-within:border-cyan-300/45 focus-within:bg-cyan-300/[0.04] focus-within:shadow-[0_0_32px_rgba(34,211,238,0.16)] md:flex">
            <Search className="h-4 w-4 shrink-0 text-slate-500 transition group-focus-within:text-cyan-200" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search agent outputs"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              aria-label="Search agent outputs"
            />
          </label>
          <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-blue-400/30 hover:text-white">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.35)]">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
