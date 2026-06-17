"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-brand text-white hover:bg-brand/90 shadow-lg shadow-brand/25":
              variant === "default",
            "border border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/20":
              variant === "outline",
            "text-slate-400 hover:text-white hover:bg-white/5":
              variant === "ghost",
            "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20":
              variant === "danger",
          },
          {
            "h-9 px-4 text-sm": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-12 px-8 text-base": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
