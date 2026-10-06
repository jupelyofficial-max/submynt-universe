import { notFound } from "next/navigation";
import { shownEcosystems } from "@/data/ecosystems";
import { EcosystemDetail } from "./EcosystemDetail";

export default async function EcosystemPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  const ecosystem = shownEcosystems().find((eco) => eco.id === brand);

  if (!ecosystem) notFound();

  return <EcosystemDetail id={ecosystem.id} />;
}
