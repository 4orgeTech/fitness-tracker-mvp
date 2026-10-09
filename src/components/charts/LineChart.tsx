interface LineChartProps {
  data: { x: string; y: number }[];
  height?: number;
  color?: string;
  targetLine?: number;
  targetLabel?: string;
  unit?: string;
  yPadding?: number;
}

export function LineChart({
  data,
  height = 220,
  color = '#166534',
  targetLine,
  targetLabel,
  unit = '',
  yPadding = 2,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data to display
      </div>
    );
  }

  const width = 800;
  const padding = { top: 20, right: 30, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.y);
  if (targetLine !== undefined) values.push(targetLine);
  const minY = Math.min(...values) - yPadding;
  const maxY = Math.max(...values) + yPadding;
  const yRange = maxY - minY || 1;

  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartHeight - ((d.y - minY) / yRange) * chartHeight;
    return { x, y, dateStr: d.x, value: d.y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minY + (yRange / yTicks) * i);

  const targetY =
    targetLine !== undefined
      ? padding.top + chartHeight - ((targetLine - minY) / yRange) * chartHeight
      : null;

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const xLabelInterval = Math.max(1, Math.ceil(data.length / 7));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {yTickValues.map((val, i) => {
        const y = padding.top + chartHeight - ((val - minY) / yRange) * chartHeight;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill="#999"
            >
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Target line */}
      {targetY !== null && (
        <g>
          <line
            x1={padding.left}
            y1={targetY}
            x2={width - padding.right}
            y2={targetY}
            stroke="#22C55E"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            opacity={0.6}
          />
          {targetLabel && (
            <text
              x={width - padding.right}
              y={targetY - 5}
              textAnchor="end"
              fontSize={10}
              fill="#22C55E"
            >
              {targetLabel}
            </text>
          )}
        </g>
      )}

      {/* Data line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={color} />
          {(data.length <= 10 || i % xLabelInterval === 0) && (
            <text
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              fontSize={10}
              fill="#999"
            >
              {formatDateLabel(p.dateStr)}
            </text>
          )}
        </g>
      ))}

      {/* Unit label */}
      {unit && (
        <text x={padding.left} y={12} fontSize={10} fill="#999">
          {unit}
        </text>
      )}
    </svg>
  );
}
