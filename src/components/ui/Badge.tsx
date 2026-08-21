import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "aurora" | "gold" | "nebula" | "danger";
}

const TONES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-black/8 text-ink-100 border-black/10",
  aurora: "bg-aurora-500/15 text-aurora-400 border-aurora-500/30",
  gold: "bg-gold-500/15 text-gold-400 border-gold-500/30",
  nebula: "bg-nebula-500/15 text-nebula-400 border-nebula-500/30",
  danger: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}
