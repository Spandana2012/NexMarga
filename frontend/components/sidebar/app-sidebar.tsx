"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";

import { navItems } from "@/styles/tokens";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { NavItem } from "@/components/sidebar/nav-item";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-8">
        <Link href="/" className="flex items-center gap-3" onClick={onNavigate}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.35)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-400">AI Multi-Agent Career Advisor</p>
            <p className="text-lg font-semibold text-white">NexMarga</p>
          </div>
        </Link>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.title}
              icon={item.icon}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>

      <GlassCard className="rounded-2xl p-5">
        <p className="text-sm text-slate-300">
          Build a polished AI career workflow from upload to analysis with one shared frontend system.
        </p>
        <Button className="mt-4 w-full">Launch Experience</Button>
      </GlassCard>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-80 shrink-0 lg:block">
        <GlassCard className="sticky top-6 h-[calc(100vh-3rem)] rounded-[2rem] p-6">
          <SidebarContent />
        </GlassCard>
      </aside>

      <div className="lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          className="fixed left-4 top-4 z-50"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-4 w-4" />
          Menu
        </Button>

        <AnimatePresence>
          {open ? (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm p-4"
              >
                <GlassCard className="h-full rounded-[2rem] p-6">
                  <div className="mb-6 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <SidebarContent onNavigate={() => setOpen(false)} />
                </GlassCard>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
