"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getLogoPath } from "@/lib/logos";
import type { Subscription } from "@/types/subscription";

const SIZES = {
  xs: "h-9 w-9 text-[11px]",
  sm: "h-11 w-11 text-xs",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-lg",
  xl: "h-28 w-28 text-3xl",
} as const;

interface SubscriptionLogoProps {
  subscription: Pick<Subscription, "id" | "name" | "initials" | "color">;
  size?: keyof typeof SIZES;
  ring?: boolean;
  className?: string;
}

export function SubscriptionLogo({ subscription, size = "md", ring, className }: SubscriptionLogoProps) {
  const [failed, setFailed] = useState(false);
  const logoPath = getLogoPath(subscription.id);
  const showImage = Boolean(logoPath) && !failed;

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full flex items-center justify-center font-display font-semibold text-white select-none overflow-hidden",
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
      {showImage ? (
        <img
          src={logoPath!}
          alt=""
          draggable={false}
          className="h-[72%] w-[72%] object-contain drop-shadow-sm"
          onError={() => setFailed(true)}
        />
      ) : (
        subscription.initials
      )}
    </div>
  );
}
