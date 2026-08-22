export function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 45_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function money(value: number, digits = 2): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(digits)}`;
}

export function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
}

export function bytes(value: number): string {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

export function seconds(ms: number): string {
  if (!ms) return "—";
  return `${(ms / 1000).toFixed(2)}s`;
}

export function priceLabel(promptPerM: number, completionPerM: number): string {
  if (promptPerM === 0 && completionPerM === 0) return "Free";
  const fmt = (v: number) => (v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(3)}`);
  return `${fmt(promptPerM)} in / ${fmt(completionPerM)} out per 1M`;
}
