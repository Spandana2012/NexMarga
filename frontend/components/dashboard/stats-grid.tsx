"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

import { dashboardStats } from "@/styles/tokens";
import { GlassCard } from "@/components/ui/card";

export function StatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.06 }}
          whileHover={{ y: -6 }}
        >
          <GlassCard className="h-full rounded-[1.75rem] p-5 transition duration-300 hover:border-cyan-300/20">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-emerald-300">{stat.delta}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
