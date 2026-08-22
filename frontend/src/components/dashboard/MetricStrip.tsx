import { Activity, CheckCircle2, Clock3, DollarSign } from "lucide-react";
import { BarSpark, Sparkline } from "../ui/Sparkline";
import { useMetrics } from "../../store/AppContext";
import { money, seconds } from "../../utils/format";

export function MetricStrip() {
  const m = useMetrics();

  const items = [
    {
      icon: Activity,
      label: "SUCCESS RATE",
      value: m.successRate === null ? "—" : `${m.successRate.toFixed(1)}%`,
      spark: m.latencySeries.length > 1 ? <Sparkline data={m.latencySeries} /> : null,
    },
    {
      icon: CheckCircle2,
      label: "RUNS COMPLETED",
      value: m.hasData ? String(m.completed) : "—",
      spark: m.tokenSeries.length > 1 ? <BarSpark data={m.tokenSeries} /> : null,
    },
    {
      icon: Clock3,
      label: "AVG RESPONSE",
      value: m.avgLatency ? seconds(m.avgLatency) : "—",
      spark: m.latencySeries.length > 1 ? <Sparkline data={m.latencySeries} /> : null,
    },
    {
      icon: DollarSign,
      label: "SPEND TODAY",
      value: m.hasData ? money(m.costToday) : "—",
      spark: m.costSeries.some((v) => v > 0) ? <Sparkline data={m.costSeries} /> : null,
    },
  ];

  return (
    <div className="grid h-full w-full grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-1 xl:content-between">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 items-center gap-2 rounded-xl border border-cyan/10 bg-[#0b1520]/70 px-2.5 py-2 sm:gap-3 sm:px-3"
        >
          <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan/20 text-cyan sm:flex">
            <item.icon size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[9px] tracking-[0.14em] text-muted">{item.label}</div>
            <div className="truncate font-display text-base leading-tight tracking-wide text-white sm:text-lg">
              {item.value}
            </div>
          </div>
          {/* Sparklines are fixed-width; drop them on narrow cards instead of overflowing. */}
          <div className="hidden shrink-0 opacity-90 lg:block">{item.spark}</div>
        </div>
      ))}
    </div>
  );
}
