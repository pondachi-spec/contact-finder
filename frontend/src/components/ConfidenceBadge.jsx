const CONFIG = {
  HIGH:   { label: 'HIGH',   classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  MEDIUM: { label: 'MEDIUM', classes: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',   dot: 'bg-yellow-400' },
  LOW:    { label: 'LOW',    classes: 'bg-red-500/15 text-red-300 border-red-500/30',             dot: 'bg-red-400'   },
};

export default function ConfidenceBadge({ confidence }) {
  const cfg = CONFIG[confidence] || CONFIG.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
