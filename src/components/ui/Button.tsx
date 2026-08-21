import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-aurora-500 to-aurora-600 text-white shadow-[0_0_0_1px_rgba(227,125,61,0.4),0_8px_24px_-8px_rgba(227,125,61,0.6)] hover:brightness-110 active:brightness-95",
  secondary: "bg-void-700 text-ink-0 border border-line-soft hover:bg-void-600",
  ghost: "text-ink-100 hover:bg-white/5",
  outline: "border border-white/15 text-ink-0 hover:bg-white/5",
  danger: "bg-red-500/10 text-red-300 border border-red-500/25 hover:bg-red-500/20",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  );
}
