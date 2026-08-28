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

/** The Universe grid steps up to 5 columns at this width (see
 * UniverseScene.tsx) — 1024–1439px stays at 4 columns. */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery("(min-width: 1440px)");
}

/** The Universe gets a dedicated mobile composition below this width (see
 * MobileUniverse) rather than the desktop WebGL scene scaled down. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
