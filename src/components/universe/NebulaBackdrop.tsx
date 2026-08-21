export function NebulaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-void-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(120,105,75,0.05)_65%,rgba(120,105,75,0.14)_100%)]" />
    </div>
  );
}
