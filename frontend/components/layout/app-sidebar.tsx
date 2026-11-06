"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronLeft, LogOut, Menu, UserCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { navItems } from "@/styles/tokens";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavItem } from "@/components/layout/nav-item";
import { NexMargaLogo } from "@/components/navbar/nexmarga-logo";

function SidebarContent({
  collapsed = false,
  onNavigate,
  onCollapse,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onCollapse?: () => void;
}) {
  const router = useRouter();
  const { logout, user } = useAuth();

  function handleLogout() {
    logout();
    onNavigate?.();
    router.replace("/login");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto pr-1">
        <div className="flex items-center justify-between gap-3">
          <NexMargaLogo collapsed={collapsed} />
          {onCollapse ? (
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-9 w-9 lg:inline-flex"
              onClick={onCollapse}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <nav className="space-y-2.5">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.title}
              icon={item.icon}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>

      {!collapsed ? (
        <div className="mt-5 shrink-0 space-y-3">
          <GlassCard className="rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Bot className="h-4 w-4 text-cyan-200" />
              Live agents
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <p>Resume Analyzer</p>
              <p>Skill Gap Agent</p>
              <p>Interview Preparation</p>
            </div>
          </GlassCard>
          <GlassCard className="rounded-2xl p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-100">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user?.name ?? "NexMarga user"}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">{user?.email ?? "Signed in"}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </GlassCard>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-5 h-10 w-10 shrink-0"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 92 : 320 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="hidden shrink-0 lg:block"
      >
        <GlassCard className="sticky top-6 h-[calc(100vh-3rem)] overflow-hidden rounded-[2rem] p-5">
          <SidebarContent
            collapsed={collapsed}
            onCollapse={() => setCollapsed((value) => !value)}
          />
        </GlassCard>
      </motion.aside>

      <div className="lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          className="fixed left-4 top-4 z-50"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
          Menu
        </Button>

        <AnimatePresence>
          {mobileOpen ? (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar overlay"
              />
              <motion.div
                initial={{ x: -340, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -340, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm p-4"
              >
                <GlassCard className="h-full overflow-hidden rounded-[2rem] p-6">
                  <div className="mb-6 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <SidebarContent onNavigate={() => setMobileOpen(false)} />
                </GlassCard>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
