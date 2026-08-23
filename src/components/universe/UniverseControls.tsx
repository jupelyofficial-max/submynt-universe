"use client";

import { Minus, Plus } from "lucide-react";
import { useUniverseStore } from "@/store/useUniverseStore";

function ControlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-10 w-10 flex items-center justify-center rounded-xl border transition-colors cursor-pointer bg-void-900/70 border-black/10 text-ink-200 hover:text-ink-0 hover:bg-black/8"
    >
      {children}
    </button>
  );
}

export function UniverseControls() {
  const sendCameraCommand = useUniverseStore((s) => s.sendCameraCommand);

  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      <ControlButton label="Zoom in" onClick={() => sendCameraCommand({ type: "zoom", delta: -14 })}>
        <Plus size={17} />
      </ControlButton>
      <ControlButton label="Zoom out" onClick={() => sendCameraCommand({ type: "zoom", delta: 14 })}>
        <Minus size={17} />
      </ControlButton>
    </div>
  );
}
