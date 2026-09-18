import { Suspense } from "react";
import { OnboardingClient } from "./OnboardingClient";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <OnboardingClient />
    </Suspense>
  );
}
