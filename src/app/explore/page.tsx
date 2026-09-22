import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreClient } from "./ExploreClient";

// Homepage-only title override — "/" (src/app/page.tsx) immediately
// redirects here, so this is the actual title a visitor sees. Everything
// else keeps the root layout's default ("Submynt — Your Subscription
// Universe") untouched, per explicit "ONLY the homepage" scope.
export const metadata: Metadata = {
  title: "Submynt: India's Subscription Intelligence Platform",
};

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <ExploreClient />
    </Suspense>
  );
}
