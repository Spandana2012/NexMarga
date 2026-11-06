import * as React from "react";

import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel gradient-border relative rounded-3xl p-6",
        className,
      )}
      {...props}
    />
  );
}
