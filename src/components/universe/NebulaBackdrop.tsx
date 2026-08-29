export function NebulaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-void-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(20,20,20,0.035)_65%,rgba(20,20,20,0.1)_100%)]" />
    </div>
  );
}
