import { useMemo, useRef, useState } from 'react';
import type { SeriesPoint } from '../../data';
import { compactCurrency, currency, formatDayYear, toISO } from '../../lib/format';
import { useSize } from '../../lib/hooks';
import { cn } from '../../lib/cn';
import {
  CHART_INK,
  extent,
  labelIndices,
  linearScale,
  monotonePath,
  niceTicks,
} from './shared';

interface LineChartProps {
  series: SeriesPoint[];
  height?: number;
  /** Renders the soft fill beneath the stroke. */
  area?: boolean;
  label: string;
  className?: string;
  /** Adds the horizontal reference line at the series' opening value. */
  baseline?: boolean;
  compact?: boolean;
  formatValue?: (value: number) => string;
}

export function LineChart({
  series,
  height = 240,
  area = true,
  label,
  className,
  baseline = true,
  compact = false,
  formatValue = (value) => currency(value),
}: LineChartProps) {
  const [ref, size] = useSize<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const padding = useMemo(
    () => ({ top: 16, right: compact ? 8 : 52, bottom: compact ? 8 : 26, left: 4 }),
    [compact],
  );

  const width = size.width || 640;
  const plotWidth = Math.max(width - padding.left - padding.right, 10);
  const plotHeight = Math.max(height - padding.top - padding.bottom, 10);

  const geometry = useMemo(() => {
    if (series.length === 0) return null;
    const [rawMin, rawMax] = extent(series);
    const pad = (rawMax - rawMin || Math.abs(rawMax) || 1) * 0.12;
    const min = rawMin - pad;
    const max = rawMax + pad;

    const x = linearScale([0, Math.max(series.length - 1, 1)], [padding.left, padding.left + plotWidth]);
    const y = linearScale([min, max], [padding.top + plotHeight, padding.top]);

    const points = series.map((point, i) => ({ x: x(i), y: y(point.v) }));
    const line = monotonePath(points);
    const areaPath = `${line} L ${points[points.length - 1]!.x} ${padding.top + plotHeight} L ${
      points[0]!.x
    } ${padding.top + plotHeight} Z`;

    return {
      x,
      y,
      points,
      line,
      areaPath,
      ticks: niceTicks(rawMin, rawMax, 4),
      min,
      max,
      first: series[0]!.v,
    };
  }, [series, padding, plotWidth, plotHeight]);

  if (!geometry) return <div ref={ref} style={{ height }} />;

  const active = hover !== null ? series[hover] : null;
  const activePoint = hover !== null ? geometry.points[hover] : null;
  const xLabels = labelIndices(series.length, compact ? 3 : Math.min(6, series.length));

  const onPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relative = ((event.clientX - rect.left) / rect.width) * width;
    const index = Math.round(geometry.x.invert(relative));
    setHover(Math.max(0, Math.min(series.length - 1, index)));
  };

  const delta = active ? active.v - geometry.first : 0;

  return (
    <div ref={ref} className={cn('relative w-full', className)} style={{ height }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}. From ${formatValue(series[0]!.v)} to ${formatValue(
          series[series.length - 1]!.v,
        )}.`}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={() => setHover(null)}
        className="touch-pan-y overflow-visible"
      >
        {!compact &&
          geometry.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={padding.left + plotWidth}
                y1={geometry.y(tick)}
                y2={geometry.y(tick)}
                stroke={CHART_INK.grid}
                strokeWidth={1}
              />
              <text
                x={padding.left + plotWidth + 8}
                y={geometry.y(tick)}
                dominantBaseline="middle"
                className="font-roboto-mono text-[10px] tabular-nums"
                fill={CHART_INK.axis}
              >
                {compactCurrency(tick)}
              </text>
            </g>
          ))}

        {baseline && !compact && (
          <line
            x1={padding.left}
            x2={padding.left + plotWidth}
            y1={geometry.y(geometry.first)}
            y2={geometry.y(geometry.first)}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1}
            strokeDasharray="2 4"
          />
        )}

        {area && <path d={geometry.areaPath} fill={CHART_INK.lineSoft} />}

        <path
          d={geometry.line}
          fill="none"
          stroke={CHART_INK.line}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padding.top}
              y2={padding.top + plotHeight}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={1}
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={4}
              fill="var(--color-obsidian)"
              stroke={CHART_INK.line}
              strokeWidth={1.75}
            />
          </g>
        )}

        <circle
          cx={geometry.points[geometry.points.length - 1]!.x}
          cy={geometry.points[geometry.points.length - 1]!.y}
          r={3}
          fill={CHART_INK.line}
        />
      </svg>

      {!compact && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between pr-52">
          {xLabels.map((index) => (
            <span key={index} className="mono-data text-[10px] tracking-normal text-ash">
              {formatDayYear(toISO(new Date(series[index]!.t))).replace(/, \d{4}$/, '')}
            </span>
          ))}
        </div>
      )}

      {active && activePoint && (
        <div
          role="status"
          className="pointer-events-none absolute z-20 -translate-x-1/2 animate-fade"
          style={{
            left: `${Math.min(Math.max((activePoint.x / width) * 100, 12), 88)}%`,
            top: 0,
          }}
        >
          <div className="rounded-lg border border-hairline bg-graphite px-12 py-8 text-center">
            <p className="mono-data text-[10px] text-ash">
              {formatDayYear(toISO(new Date(active.t)))}
            </p>
            <p className="tnum mt-4 text-body-sm text-cloud">{formatValue(active.v)}</p>
            {baseline && (
              <p className="tnum mt-2 font-roboto-mono text-[10px] text-ash">
                {delta >= 0 ? '+' : '−'}
                {currency(delta)} over range
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline trend mark — no axes, no interaction. */
export function Sparkline({
  series,
  width = 88,
  height = 28,
  tone = 'line',
}: {
  series: SeriesPoint[];
  width?: number;
  height?: number;
  tone?: 'line' | 'muted';
}) {
  const path = useMemo(() => {
    if (series.length < 2) return '';
    const [min, max] = extent(series);
    const x = linearScale([0, series.length - 1], [1, width - 1]);
    const y = linearScale([min, max], [height - 2, 2]);
    return monotonePath(series.map((point, i) => ({ x: x(i), y: y(point.v) })));
  }, [series, width, height]);

  if (!path) return null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke={tone === 'line' ? CHART_INK.line : 'var(--color-fog)'}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
