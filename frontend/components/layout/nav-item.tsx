"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function NavItem({
  href,
  label,
  icon: Icon,
  collapsed = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href} onClick={onNavigate} aria-label={label} title={collapsed ? label : undefined}>
      <motion.span
        whileHover={{ x: collapsed ? 0 : 4, scale: collapsed ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className={cn(
          "relative flex h-12 items-center gap-3 overflow-hidden rounded-2xl px-4 text-sm transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-cyan-300/10 text-white shadow-[0_0_28px_rgba(34,211,238,0.12)]"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
        )}
      >
        {isActive ? (
          <>
            <motion.span
              layoutId="active-nav"
              className="absolute inset-0 rounded-2xl border border-cyan-200/20 bg-gradient-to-r from-cyan-300/10 to-fuchsia-300/5"
            />
            <motion.span
              layoutId="active-nav-rail"
              className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.65)]"
            />
          </>
        ) : null}
        <Icon className="relative h-4 w-4 shrink-0" />
        {!collapsed ? <span className="relative truncate">{label}</span> : null}
      </motion.span>
    </Link>
  );
}
