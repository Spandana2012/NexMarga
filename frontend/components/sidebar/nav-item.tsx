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
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} onClick={onNavigate}>
      <motion.span
        whileHover={{ x: 4 }}
        className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
          isActive
            ? "bg-white/10 text-white"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </motion.span>
    </Link>
  );
}
