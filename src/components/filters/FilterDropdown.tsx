"use client";

import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface FilterDropdownProps<T extends string> {
  label: string;
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear?: () => void;
}

export function FilterDropdown<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  const buttonLabel =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? label)
        : `${label} · ${selected.length}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors cursor-pointer",
          selected.length > 0
            ? "border border-aurora-500/50 bg-aurora-500/15 text-aurora-400"
            : "glass-panel text-ink-300 hover:text-ink-0 hover:border-white/20"
        )}
      >
        {buttonLabel}
        <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-72 w-56 overflow-y-auto no-scrollbar rounded-xl border border-white/10 bg-void-900 p-1.5 shadow-xl shadow-black/40">
          {selected.length > 0 && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-ink-500 hover:bg-white/5 hover:text-ink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
          {options.map((opt) => {
            const active = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggle(opt.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs cursor-pointer",
                  active ? "bg-aurora-500/10 text-aurora-400" : "text-ink-200 hover:bg-white/5"
                )}
              >
                {opt.label}
                {active && <Check size={13} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
