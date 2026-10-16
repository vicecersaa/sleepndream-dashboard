import { useId } from 'react';

interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export function AreaChart({ data, height = 240, color = '#2563eb', formatValue }: AreaChartProps) {
  const gradientId = useId();
  const width = 800;
  const padX = 40;
  const padY = 30;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const stepX = chartW / Math.max(data.length - 1, 1);

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + chartH - ((d.value - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${padX + chartW} ${padY + chartH} L ${padX} ${padY + chartH} Z`;

  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = padY + (chartH / gridLines) * i;
        const val = maxVal - (range / gridLines) * i;
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-gray-800" />
            <text x={padX - 8} y={y + 4} textAnchor="end" className="text-gray-400 fill-current text-[10px]">
              {formatValue ? formatValue(val) : Math.round(val)}
            </text>
          </g>
        );
      })}

      {/* Area */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" className="transition-all hover:r-6" />
          {data.length <= 12 && (
            <text x={p.x} y={height - 8} textAnchor="middle" className="text-gray-400 fill-current text-[10px]">
              {data[i].label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, height = 240, color = '#2563eb', formatValue }: BarChartProps) {
  const width = 800;
  const padX = 40;
  const padY = 30;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = chartW / data.length * 0.6;
  const gap = chartW / data.length * 0.4;
  const gridLines = 4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: gridLines + 1 }).map((_, i) => {
        const y = padY + (chartH / gridLines) * i;
        const val = maxVal - (maxVal / gridLines) * i;
        return (
          <g key={i}>
            <line x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-gray-800" />
            <text x={padX - 8} y={y + 4} textAnchor="end" className="text-gray-400 fill-current text-[10px]">
              {formatValue ? formatValue(val) : Math.round(val)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padX + i * (barWidth + gap) + gap / 2;
        const y = padY + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="4" fill={color} opacity="0.85" className="transition-opacity hover:opacity-100" />
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="text-gray-400 fill-current text-[10px]">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ data, size = 180 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100 dark:text-gray-800" />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const segment = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-300"
            />
          );
          offset += dash;
          return segment;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-2xl font-bold fill-gray-900 dark:fill-gray-100">
          {total}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="text-xs fill-gray-400">
          Total
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600 dark:text-gray-300">{d.label}</span>
            <span className="text-gray-400 ml-auto font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({ data, color = '#2563eb', height = 40, width = 120 }: SparklineProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
