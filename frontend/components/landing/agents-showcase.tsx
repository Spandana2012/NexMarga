"use client";

import { motion } from "framer-motion";

import { agentCards } from "@/styles/tokens";
import { SectionHeading } from "@/components/ui/section-heading";
import { GlassCard } from "@/components/ui/card";

export function AgentsShowcase() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrow="AI agents"
          title="Specialists that will power the NexMarga experience"
          description="Each interface block is ready to host future outputs from role-specific AI collaborators without reworking the design system."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {agentCards.map((agent, index) => {
            const Icon = agent.icon;

            return (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <GlassCard className="h-full rounded-[1.9rem] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{agent.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {agent.description}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-blue-100">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
