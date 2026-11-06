import Link from "next/link";

import { AgentsShowcase } from "@/components/landing/agents-showcase";
import { CTASection } from "@/components/landing/cta-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Button } from "@/components/ui/button";
import { NexMargaLogo } from "@/components/navbar/nexmarga-logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <NexMargaLogo />
          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#workflow" className="transition hover:text-white">
              Workflow
            </a>
            <a href="#agents" className="transition hover:text-white">
              Agents
            </a>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <HeroSection />

      <div id="features">
        <FeatureGrid />
      </div>
      <div id="workflow">
        <HowItWorks />
      </div>
      <div id="agents">
        <AgentsShowcase />
      </div>
      <CTASection />
    </div>
  );
}
