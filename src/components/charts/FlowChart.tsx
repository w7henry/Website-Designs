import { useMemo, useState } from 'react';
import type { FlowPoint } from '../../data';
import { compactCurrency, currency } from '../../lib/format';
import { useSize } from '../../lib/hooks';
import { cn } from '../../lib/cn';
import { CHART_INK, linearScale, niceTicks } from './shared';

/**
 * Income against spending. Incoming money uses the data accent, outgoing
 * uses a muted neutral — the pairing is reinforced by position and label,
 * not by colour alone.
 */
export function FlowChart({
  points,
  height = 260,
  className,
}: {
  points: FlowPoint[];
  height?: number;
  className?: string;
}) {
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const width = size.width || 640;
  const padding = { top: 16, right: 52, bottom: 28, left: 4 };
  const plotWidth = Math.max(width - padding.left - padding.right, 10);
  const plotHeight = Math.max(height - padding.top - padding.bottom, 10);

  const geometry = useMemo(() => {
    const max = Math.max(...points.map((p) => Math.max(p.income, p.spending)), 1);
    const y = linearScale([0, max], [padding.top + plotHeight, padding.top]);
    const slot = plotWidth / Math.max(points.length, 1);
    const barWidth = Math.max(Math.min(slot * 0.3, 18), 4);
    const gap = Math.max(barWidth * 0.22, 2);
    return { max, y, slot, barWidth, gap, ticks: niceTicks(0, max, 4) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, plotWidth, plotHeight]);

  const active = hover !== null ? points[hover] : null;

  return (
    <div ref={ref} className={cn('relative w-full', className)} style={{ height }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Income against spending across ${points.length} periods.`}
        onPointerLeave={() => setHover(null)}
        className="overflow-visible"
      >
        {geometry.ticks.map((tick) => (
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

        {points.map((point, index) => {
          const centre = padding.left + geometry.slot * (index + 0.5);
          const incomeHeight = padding.top + plotHeight - geometry.y(point.income);
          const spendHeight = padding.top + plotHeight - geometry.y(point.spending);
          const isActive = hover === index;
          return (
            <g
              key={point.t}
              onPointerEnter={() => setHover(index)}
              onPointerDown={() => setHover(index)}
            >
              <rect
                x={padding.left + geometry.slot * index}
                y={padding.top}
                width={geometry.slot}
                height={plotHeight}
                fill={isActive ? 'rgba(255,255,255,0.04)' : 'transparent'}
                className="transition-colors duration-200"
              />
              <rect
                x={centre - geometry.barWidth - geometry.gap / 2}
                y={geometry.y(point.income)}
                width={geometry.barWidth}
                height={Math.max(incomeHeight, 1)}
                rx={2}
                fill={CHART_INK.line}
                opacity={hover === null || isActive ? 1 : 0.4}
                className="transition-opacity duration-200"
              />
              <rect
                x={centre + geometry.gap / 2}
                y={geometry.y(point.spending)}
                width={geometry.barWidth}
                height={Math.max(spendHeight, 1)}
                rx={2}
                fill="var(--color-fog)"
                opacity={hover === null || isActive ? 1 : 0.4}
                className="transition-opacity duration-200"
              />
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 pr-52">
        <div className="flex" style={{ paddingLeft: padding.left }}>
          {points.map((point, index) => (
            <span
              key={point.t}
              style={{ width: `${(geometry.slot / plotWidth) * 100}%` }}
              className={cn(
                'mono-data text-center text-[10px] tracking-normal transition-colors duration-200',
                hover === index ? 'text-cloud' : 'text-ash',
                points.length > 14 && index % 2 === 1 && 'opacity-0',
              )}
            >
              {point.label}
            </span>
          ))}
        </div>
      </div>

      {active && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 animate-fade"
          style={{
            left: `${Math.min(
              Math.max((((padding.left + geometry.slot * (hover! + 0.5)) / width) * 100), 14),
              86,
            )}%`,
          }}
        >
          <div className="min-w-[148px] rounded-lg border border-hairline bg-graphite px-12 py-10">
            <p className="mono-data text-[10px] text-ash">{active.label}</p>
            <dl className="mt-8 space-y-4">
              <div className="flex items-center justify-between gap-16">
                <dt className="flex items-center gap-6 text-caption text-ash">
                  <span className="size-6 rounded-full" style={{ background: CHART_INK.line }} />
                  In
                </dt>
                <dd className="tnum text-caption text-cloud">+{currency(active.income)}</dd>
              </div>
              <div className="flex items-center justify-between gap-16">
                <dt className="flex items-center gap-6 text-caption text-ash">
                  <span className="size-6 rounded-full bg-fog" />
                  Out
                </dt>
                <dd className="tnum text-caption text-cloud">&minus;{currency(active.spending)}</dd>
              </div>
              <div className="flex items-center justify-between gap-16 border-t border-hairline pt-6">
                <dt className="text-caption text-ash">Net</dt>
                <dd className="tnum text-caption text-cloud">
                  {active.income - active.spending >= 0 ? '+' : '−'}
                  {currency(active.income - active.spending)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
