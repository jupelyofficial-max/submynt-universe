import Image from "next/image";
import type { LifestyleBundle } from "@/data/bundles";
import { bundleSeparateLabel } from "@/lib/bundlePricing";

/** A curated bundle's banner PNG. Where the artwork has a baked-in
 * "From ₹X/month · Save up to N%" block (no real bundle price backs it),
 * that block is covered with the computed "bought separately" total. The
 * cover is positioned in % of the banner (all banners share the same
 * 2172x724 layout) and its text is sized in container units so it scales
 * with the banner the way the artwork does. Fills its (sized) parent,
 * unless `intrinsic` is passed, in which case it sizes itself to the
 * banner's own aspect ratio. */
export function BundleBanner({
  bundle,
  sizes,
  priority,
  intrinsic,
}: {
  bundle: LifestyleBundle;
  sizes: string;
  priority?: boolean;
  intrinsic?: boolean;
}) {
  return (
    <div className={intrinsic ? "relative" : "absolute inset-0"} style={{ containerType: "inline-size" }}>
      {intrinsic ? (
        <Image src={bundle.image} alt={bundle.title} width={2172} height={724} sizes={sizes} priority={priority} className="h-auto w-full" />
      ) : (
        <Image src={bundle.image} alt={bundle.title} fill sizes={sizes} priority={priority} className="object-cover" />
      )}
      {bundle.bakedPriceClaim && (
        <div
          className="absolute flex flex-col justify-center border border-white/10 bg-[#111]/90 text-white backdrop-blur-sm"
          style={{ left: "72%", top: "69.5%", width: "26.5%", height: "22%", borderRadius: "0.8cqw", paddingLeft: "1.2cqw", paddingRight: "1cqw" }}
        >
          <span className="leading-tight text-white/70" style={{ fontSize: "1.1cqw" }}>
            Bought separately
          </span>
          <span className="font-semibold leading-tight" style={{ fontSize: "2.2cqw" }}>
            {bundleSeparateLabel(bundle)}
          </span>
        </div>
      )}
    </div>
  );
}
