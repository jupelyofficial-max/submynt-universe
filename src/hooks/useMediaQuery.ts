"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, callback: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => window.matchMedia(query).matches,
    getServerSnapshot
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/** Below this width, /explore uses its own stacked mobile toolbar instead
 * of TopNav's inline desktop one. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
