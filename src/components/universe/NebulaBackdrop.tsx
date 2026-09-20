// The radial-gradient vignette this used to paint (a faint dark tint from
// page center to edges) spanned the entire scrollable page height, not just
// the Universe canvas — removed so every page area is pure white, per
// request. Kept as a plain white layer (rather than deleting the component
// and its ExploreClient mount) so this stays a one-line, easily-reversible
// change with zero effect on layout or functionality.
export function NebulaBackdrop() {
  return <div className="pointer-events-none absolute inset-0 overflow-hidden bg-white" />;
}
