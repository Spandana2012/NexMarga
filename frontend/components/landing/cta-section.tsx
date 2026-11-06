import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";

export function CTASection() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <GlassCard className="rounded-[2rem] px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200/75">
            Start building
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            NexMarga is ready for premium AI career workflows.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Move from landing page to product surfaces with one cohesive visual language and reusable components.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/analysis">Review analysis page</Link>
            </Button>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
