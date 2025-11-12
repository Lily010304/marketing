interface LineChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LineChartSeries {
  name: string;
  data: LineChartDataPoint[];
  color?: string;
}

interface LineChartProps {
  title: string;
  series: LineChartSeries[];
  className?: string;
  height?: number;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

export function LineChart({
  title,
  series,
  className = "",
  height = 300,
  showValues = true,
  formatValue = (value) => value.toLocaleString()
}: LineChartProps) {
  if (!series || series.length === 0 || series.every(s => !s.data || s.data.length === 0)) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  // Get all unique labels and find max value across all series
  const allLabels = [...new Set(series.flatMap(s => s.data.map(d => d.label)))];
  const allValues = series.flatMap(s => s.data.map(d => d.value));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);

  // Adjust Y-axis to start from a smaller value for better visualization
  const yAxisMin = minValue >= 0 ? 0 : minValue * 1.1; // Start from 0 for positive values, or 10% below min for negative values
  const yAxisRange = maxValue - yAxisMin;

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const chartWidth = 600;
  const chartHeight = height - 120; // Increased space for rotated X-axis labels
  const padding = 80; // Increased left/right padding for rotated labels

  const getPointPosition = (index: number, value: number) => {
    const x = padding + (index / (allLabels.length - 1)) * (chartWidth - 2 * padding);
    const y = padding + ((maxValue - value) / (yAxisRange || 1)) * (chartHeight - 2 * padding);
    return { x, y };
  };

  const createPath = (data: LineChartDataPoint[]) => {
    if (data.length === 0) return '';

    const points = data.map((point, index) => {
      const labelIndex = allLabels.indexOf(point.label);
      if (labelIndex === -1) return null;
      return getPointPosition(labelIndex, point.value);
    }).filter(Boolean) as { x: number; y: number }[];

    if (points.length === 0) return '';

    return points.map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {series.map((s, index) => (
          <div key={s.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: s.color || colors[index % colors.length] }}
            />
            <span className="text-sm text-gray-300">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        <svg width={chartWidth} height={chartHeight} className="w-full h-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + ratio * (chartHeight - 2 * padding);
            return (
              <line
                key={ratio}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#374151"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {/* X-axis labels */}
          {allLabels.map((label, index) => {
            const x = padding + (index / (allLabels.length - 1)) * (chartWidth - 2 * padding);
            const y = chartHeight - 10; // Moved closer to bottom to utilize extra space
            return (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                className="text-xs fill-gray-400"
                transform={`rotate(90, ${x}, ${y})`}
              >
                {label}
              </text>
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = yAxisMin + ratio * yAxisRange;
            const y = padding + (1 - ratio) * (chartHeight - 2 * padding);
            return (
              <text
                key={ratio}
                x={20}
                y={y + 4}
                textAnchor="middle"
                className="text-xs fill-gray-400"
              >
                {formatValue(value)}
              </text>
            );
          })}

          {/* Lines */}
          {series.map((s, seriesIndex) => {
            const path = createPath(s.data);
            if (!path) return null;

            const color = s.color || colors[seriesIndex % colors.length];
            return (
              <g key={s.name}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  className="transition-all duration-300"
                />

                {/* Data points */}
                {s.data.map((point, index) => {
                  const labelIndex = allLabels.indexOf(point.label);
                  if (labelIndex === -1) return null;
                  const pos = getPointPosition(labelIndex, point.value);
                  return (
                    <circle
                      key={`${s.name}-${index}`}
                      cx={pos.x}
                      cy={pos.y}
                      r="4"
                      fill={color}
                      className="hover:r-6 transition-all duration-200"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}