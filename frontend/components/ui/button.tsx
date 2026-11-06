import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 px-5 py-2.5 text-white shadow-[0_0_30px_rgba(59,130,246,0.32)] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(99,102,241,0.42)]",
        secondary:
          "glass-panel px-5 py-2.5 text-slate-100 hover:border-white/20 hover:bg-white/10",
        ghost:
          "px-4 py-2 text-slate-300 hover:bg-white/5 hover:text-white",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3",
        icon: "h-10 w-10 p-0",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
