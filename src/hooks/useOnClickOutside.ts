"use client";

import { useEffect, type RefObject } from "react";

/** Fires `handler` on a mousedown outside every element in `refs` — pass more
 * than one when part of the UI (e.g. a dropdown menu) is portaled elsewhere
 * in the DOM and so isn't a descendant of the trigger's own ref. */
export function useOnClickOutside(refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[], handler: () => void) {
  useEffect(() => {
    const list = Array.isArray(refs) ? refs : [refs];
    function listener(e: MouseEvent) {
      const target = e.target as Node;
      if (list.some((ref) => ref.current?.contains(target))) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [refs, handler]);
}
