import { useMemo, useState } from 'react';
import { currency, percent } from '../../lib/format';
import { cn } from '../../lib/cn';

export interface Slice {
  id: string;
  label: string;
  value: number;
  tint: string;
}

/**
 * Spending by category. Chromatic tokens are legitimate here — these are
 * category marks, the one place DESIGN.md allows the palette to speak.
 */
export function DonutChart({
  slices,
  size = 210,
  thickness = 22,
  centreLabel,
  centreValue,
  onSelect,
  selectedId,
  className,
}: {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centreLabel: string;
  centreValue: string;
  onSelect?: (id: string | null) => void;
  selectedId?: string | null;
  className?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const total = slices.reduce((acc, slice) => acc + slice.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = useMemo(() => {
    let offset = 0;
    return slices.map((slice) => {
      const fraction = total === 0 ? 0 : slice.value / total;
      const arc = {
        ...slice,
        fraction,
        dash: fraction * circumference,
        offset,
      };
      offset += fraction * circumference;
      return arc;
    });
  }, [slices, total, circumference]);

  const focused = hover ?? selectedId ?? null;
  const focusedSlice = arcs.find((arc) => arc.id === focused);

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Spending by category, ${centreValue} in total.`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
        />
        {arcs.map((arc) => {
          const dimmed = focused !== null && focused !== arc.id;
          return (
            <circle
              key={arc.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.tint}
              strokeWidth={focused === arc.id ? thickness + 4 : thickness}
              strokeDasharray={`${Math.max(arc.dash - 2, 0)} ${circumference}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              opacity={dimmed ? 0.28 : 1}
              className="cursor-pointer transition-[opacity,stroke-width] duration-200 ease-[var(--ease-state)]"
              onPointerEnter={() => setHover(arc.id)}
              onPointerLeave={() => setHover(null)}
              onClick={() => onSelect?.(selectedId === arc.id ? null : arc.id)}
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-24 text-center">
        <p className="mono-label">{focusedSlice ? focusedSlice.label : centreLabel}</p>
        <p className="tnum mt-6 font-lyon-display text-figure leading-none text-cloud">
          {focusedSlice ? currency(focusedSlice.value, { cents: false }) : centreValue}
        </p>
        {focusedSlice && (
          <p className="tnum mt-6 font-roboto-mono text-[10px] text-ash">
            {percent(focusedSlice.fraction * 100, 1)} of spend
          </p>
        )}
      </div>
    </div>
  );
}

/** Horizontal ranking that sits beside the donut. */
export function CategoryBars({
  slices,
  total,
  onSelect,
  selectedId,
  limit,
  columns = 1,
}: {
  slices: Slice[];
  total: number;
  onSelect?: (id: string | null) => void;
  selectedId?: string | null;
  limit?: number;
  /** Two columns keep a long ranking from stretching across a wide card. */
  columns?: 1 | 2;
}) {
  const max = Math.max(...slices.map((s) => s.value), 1);
  const rows = limit ? slices.slice(0, limit) : slices;

  return (
    <ul className={cn(columns === 2 ? 'grid gap-x-32 sm:grid-cols-2' : 'flex flex-col')}>
      {rows.map((slice) => {
        const active = selectedId === slice.id;
        return (
          <li key={slice.id}>
            <button
              type="button"
              onClick={() => onSelect?.(active ? null : slice.id)}
              aria-pressed={active}
              className={cn(
                'group flex w-full items-center gap-12 rounded-lg px-8 py-10 text-left',
                'transition-colors duration-200 ease-[var(--ease-state)] hover:bg-glass',
                active && 'bg-glass',
              )}
            >
              <span
                aria-hidden="true"
                className="size-8 shrink-0 rounded-full"
                style={{ backgroundColor: slice.tint }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-12">
                  <span className="truncate text-body-sm text-cloud">{slice.label}</span>
                  <span className="tnum shrink-0 text-body-sm text-cloud">
                    {currency(slice.value, { cents: false })}
                  </span>
                </span>
                <span className="mt-8 flex items-center gap-10">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                    <span
                      className="block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-reveal)]"
                      style={{
                        width: `${(slice.value / max) * 100}%`,
                        backgroundColor: slice.tint,
                      }}
                    />
                  </span>
                  <span className="mono-data w-32 shrink-0 text-right text-[10px] text-ash">
                    {total === 0 ? '0%' : `${Math.round((slice.value / total) * 100)}%`}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
