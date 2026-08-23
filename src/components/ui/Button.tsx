import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-aurora-500 to-aurora-600 text-white shadow-[0_0_0_1px_rgba(227,125,61,0.4),0_8px_24px_-8px_rgba(227,125,61,0.6)] hover:brightness-110 active:brightness-95",
  secondary: "bg-void-700 text-ink-0 border border-line-soft hover:bg-void-600",
  ghost: "text-ink-100 hover:bg-black/5",
  outline: "border border-black/15 text-ink-0 hover:bg-black/5",
  danger: "bg-red-500/10 text-red-300 border border-red-500/25 hover:bg-red-500/20",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: undefined;
}

/** Same visual treatment, rendered as a real `<a>` — for CTAs that navigate
 * to an outbound URL (e.g. "Visit Provider", "Start Free Trial"), where a
 * `<button>` would be the wrong element (no href, no right-click-to-open,
 * no native new-tab support). */
interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  href: string;
}

export function Button({ variant = "primary", size = "md", className, href, ...props }: ButtonProps | LinkButtonProps) {
  const classes = cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
  if (href !== undefined) {
    return <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  }
  return <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} />;
}
