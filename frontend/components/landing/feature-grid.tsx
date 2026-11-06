"use client";

import { motion } from "framer-motion";

import { landingFeatures } from "@/styles/tokens";
import { SectionHeading } from "@/components/ui/section-heading";
import { GlassCard } from "@/components/ui/card";

export function FeatureGrid() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrow="Features"
          title="Purpose-built for AI-native career products"
          description="A modular foundation for polished onboarding, insight surfaces, and future multi-agent workflows."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {landingFeatures.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <GlassCard className="h-full rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
