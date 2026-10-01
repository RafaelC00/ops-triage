import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 focus-visible:outline-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)]",
  secondary: "bg-[var(--surface)] text-[var(--text)] ring-1 ring-inset ring-[var(--border)] hover:bg-[var(--surface-hover)]",
  ghost: "text-[var(--text-3)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
  danger: "bg-rose-500/90 text-white hover:bg-rose-500 focus-visible:outline-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.22)]",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    variants[variant],
    sizes[size],
    className,
  );
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "primary", size = "md", ...props }, ref) => (
  <button ref={ref} className={buttonClasses(variant, size, className)} {...props} />
));
Button.displayName = "Button";
