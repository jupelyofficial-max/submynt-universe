// Shared with the Sprint 6 Monthly Report page — extracted from the Sprint 3
// dashboard rather than duplicated.
export function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel flex flex-col gap-2 rounded-2xl p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nebula-500/15 text-nebula-400">{icon}</div>
      <div className="font-display text-lg font-semibold text-ink-0">{value}</div>
      <div className="text-[11px] text-ink-500">{label}</div>
    </div>
  );
}
