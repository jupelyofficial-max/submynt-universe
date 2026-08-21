"use client";

import { Compass, Expand, Layers, Minimize, Minus, Plus, Target } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { useUniverseStore } from "@/store/useUniverseStore";
import { useMySubscriptionsStore } from "@/store/useMySubscriptionsStore";

function ControlButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "h-10 w-10 flex items-center justify-center rounded-xl border transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none",
        active
          ? "bg-aurora-500/20 border-aurora-500/40 text-aurora-400"
          : "bg-void-900/70 border-black/10 text-ink-200 hover:text-ink-0 hover:bg-black/8"
      )}
    >
      {children}
    </button>
  );
}

export function UniverseControls({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);
  const discoverMode = useUniverseStore((s) => s.discoverMode);
  const setDiscoverMode = useUniverseStore((s) => s.setDiscoverMode);
  const showConnections = useUniverseStore((s) => s.showConnections);
  const toggleShowConnections = useUniverseStore((s) => s.toggleShowConnections);
  const ownedCount = useMySubscriptionsStore((s) => s.owned.length);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen?.();
    }
  }

  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      <ControlButton label="Zoom in" onClick={() => sendCameraCommand({ type: "zoom", delta: -14 })}>
        <Plus size={17} />
      </ControlButton>
      <ControlButton label="Zoom out" onClick={() => sendCameraCommand({ type: "zoom", delta: 14 })}>
        <Minus size={17} />
      </ControlButton>
      <div className="h-px bg-black/10 mx-1" />
      <ControlButton label="Reset universe" onClick={() => sendCameraCommand({ type: "reset" })}>
        <Compass size={17} />
      </ControlButton>
      <ControlButton
        label="Focus on my subscriptions"
        disabled={ownedCount === 0}
        onClick={() => sendCameraCommand({ type: "focus-mine" })}
      >
        <Target size={17} />
      </ControlButton>
      <ControlButton
        label="Discover mode"
        active={discoverMode}
        onClick={() => setDiscoverMode(!discoverMode)}
      >
        <span className="text-base leading-none">✦</span>
      </ControlButton>
      <ControlButton label="Toggle connection lines" active={showConnections} onClick={toggleShowConnections}>
        <Layers size={17} />
      </ControlButton>
      <div className="h-px bg-black/10 mx-1" />
      <ControlButton label="Fullscreen" onClick={toggleFullscreen}>
        {isFullscreen ? <Minimize size={17} /> : <Expand size={17} />}
      </ControlButton>
    </div>
  );
}
