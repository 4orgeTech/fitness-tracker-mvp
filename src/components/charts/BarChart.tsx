interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  unit?: string;
  showValues?: boolean;
}

export function BarChart({
  data,
  height = 220,
  color = '#166534',
  unit = '',
  showValues = true,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data to display
      </div>
    );
  }

  const width = 800;
  const padding = { top: 20, right: 20, bottom: 35, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barCount = data.length;
  const barWidth = barCount > 1 ? chartWidth / barCount : 60;
  const barGap = barCount > 1 ? barWidth * 0.2 : 0;
  const actualBarWidth = barWidth - barGap;

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue / yTicks) * i);

  const formatValue = (val: number) => {
    if (val >= 10000) return `${(val / 1000).toFixed(1)}k`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toFixed(0);
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {yTickValues.map((val, i) => {
        const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
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
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#999">
              {formatValue(val)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = padding.left + i * barWidth + barGap / 2;
        const y = padding.top + chartHeight - barHeight;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={actualBarWidth}
              height={barHeight}
              rx={3}
              fill={color}
              opacity={0.85}
            />
            {showValues && barHeight > 20 && (
              <text
                x={x + actualBarWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize={10}
                fill="#666"
              >
                {formatValue(d.value)}
              </text>
            )}
            <text
              x={x + actualBarWidth / 2}
              y={height - 12}
              textAnchor="middle"
              fontSize={10}
              fill="#999"
            >
              {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
            </text>
          </g>
        );
      })}

      {/* Unit label */}
      {unit && (
        <text x={padding.left} y={12} fontSize={10} fill="#999">
          {unit}
        </text>
      )}
    </svg>
  );
}
