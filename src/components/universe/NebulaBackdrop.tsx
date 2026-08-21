export function NebulaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0b0906]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(11,9,6,0.35)_65%,rgba(11,9,6,0.85)_100%)]" />
    </div>
  );
}
