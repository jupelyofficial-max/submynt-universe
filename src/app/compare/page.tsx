import { Suspense } from "react";
import { CompareClient } from "./CompareClient";

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <CompareClient />
    </Suspense>
  );
}
