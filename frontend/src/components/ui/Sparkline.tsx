export function Sparkline({
  data,
  width = 92,
  height = 28,
  color = "#2ee6d6",
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  if (!data.length) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = data.length === 1 ? 0 : width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return [x, y] as const;
  });
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {fill && (
        <path d={area} fill={color} opacity={0.12} />
      )}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}

export function BarSpark({
  data,
  width = 72,
  height = 28,
  color = "#2ee6d6",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...data, 1);
  const gap = 2;
  const barW = (width - gap * (data.length - 1)) / data.length;
  return (
    <svg width={width} height={height}>
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * height);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={height - h}
            width={Math.max(1.5, barW)}
            height={h}
            rx={1}
            fill={color}
            opacity={0.35 + (v / max) * 0.65}
          />
        );
      })}
    </svg>
  );
}

export function AreaChart({
  data,
  width = 320,
  height = 72,
  color = "#2ee6d6",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data) * 0.85;
  const max = Math.max(...data) * 1.05;
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / span) * (height - 6) - 3}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = `grad-${width}-${height}-${data.length}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}
