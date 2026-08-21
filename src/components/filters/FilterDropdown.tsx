"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const outsideRefs = useMemo(() => [triggerRef, menuRef], []);
  useOnClickOutside(outsideRefs, () => setOpen(false));

  // Portaled to <body> (position: fixed) rather than absolutely positioned
  // inside the trigger, so it isn't clipped when the trigger sits inside a
  // horizontally-scrollable toolbar (e.g. the explore header) — any
  // ancestor with overflow-x set forces overflow-y to auto too, which would
  // otherwise clip a menu extending below that ancestor's bounds.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setMenuPos({ top: rect.bottom + 6, left: rect.left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const buttonLabel =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? label)
        : `${label} · ${selected.length}`;

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors cursor-pointer",
          selected.length > 0
            ? "border border-aurora-500/50 bg-aurora-500/15 text-aurora-400"
            : "glass-panel text-ink-300 hover:text-ink-0 hover:border-black/20"
        )}
      >
        {buttonLabel}
        <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
            // max-h-[600px], not max-h-72: comfortably above the longest
            // list (17 categories, ~490px) so overflow-y never actually has
            // to clip anything. When it did clip here, Chromium painted a
            // solid white rectangle over part of the WebGL canvas below —
            // a compositing bug specific to a scroll-clipped position:fixed
            // portal sitting over a <canvas>, reproduced consistently and
            // gone the instant nothing needs to scroll.
            className="z-50 max-h-[600px] w-56 overflow-y-auto no-scrollbar rounded-xl border border-black/10 bg-void-900 p-1.5 shadow-xl shadow-black/40"
          >
            {selected.length > 0 && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-ink-500 hover:bg-black/5 hover:text-ink-0 cursor-pointer"
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
                    active ? "bg-aurora-500/10 text-aurora-400" : "text-ink-200 hover:bg-black/5"
                  )}
                >
                  {opt.label}
                  {active && <Check size={13} />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
