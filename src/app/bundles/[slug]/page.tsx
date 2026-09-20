import { notFound } from "next/navigation";
import { ALL_BUNDLES } from "@/data/bundles";
import { BundleDetail } from "./BundleDetail";

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = ALL_BUNDLES.find((b) => b.slug === slug);

  if (!bundle) notFound();

  return <BundleDetail bundle={bundle} />;
}
