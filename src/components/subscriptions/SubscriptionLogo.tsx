import { cn } from "@/lib/utils";
import type { Subscription } from "@/types/subscription";

const SIZES = {
  xs: "h-8 w-8 text-[10px]",
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-2xl",
} as const;

interface SubscriptionLogoProps {
  subscription: Pick<Subscription, "name" | "initials" | "color">;
  size?: keyof typeof SIZES;
  ring?: boolean;
  className?: string;
}

export function SubscriptionLogo({ subscription, size = "md", ring, className }: SubscriptionLogoProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full flex items-center justify-center font-display font-semibold text-white select-none",
        SIZES[size],
        ring && "ring-2 ring-aurora-400/70 ring-offset-2 ring-offset-void-950",
        className
      )}
      style={{
        background: `radial-gradient(circle at 32% 28%, ${subscription.color}f2, ${subscription.color}99 55%, ${subscription.color}55 100%)`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.12) inset, 0 6px 18px -6px ${subscription.color}aa`,
      }}
      title={subscription.name}
    >
      {subscription.initials}
    </div>
  );
}
