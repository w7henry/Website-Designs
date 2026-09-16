import type { SeriesPoint } from '../../data';

export interface Scale {
  (value: number): number;
  invert: (pixel: number) => number;
}

export function linearScale(
  domain: [number, number],
  range: [number, number],
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const scale = ((value: number) => r0 + ((value - d0) / span) * (r1 - r0)) as Scale;
  scale.invert = (pixel: number) => d0 + ((pixel - r0) / (r1 - r0 || 1)) * span;
  return scale;
}

/**
 * Monotone cubic interpolation — smooth enough to read as a curve, and
 * mathematically unable to overshoot, so a chart never invents a peak
 * the data does not contain.
 */
export function monotonePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  if (n === 2) return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;

  const dx: number[] = [];
  const dy: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const h = points[i + 1]!.x - points[i]!.x || 1e-6;
    dx.push(h);
    dy.push(points[i + 1]!.y - points[i]!.y);
    slope.push(dy[i]! / h);
  }

  const tangents: number[] = new Array(n);
  tangents[0] = slope[0]!;
  tangents[n - 1] = slope[n - 2]!;
  for (let i = 1; i < n - 1; i += 1) {
    const s0 = slope[i - 1]!;
    const s1 = slope[i]!;
    if (s0 * s1 <= 0) {
      tangents[i] = 0;
    } else {
      const h0 = dx[i - 1]!;
      const h1 = dx[i]!;
      const common = h0 + h1;
      tangents[i] = (3 * common) / ((common + h1) / s0 + (common + h0) / s1);
    }
  }

  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i]!;
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    path += ` C ${p0.x + h / 3} ${p0.y + (tangents[i]! * h) / 3}, ${p1.x - h / 3} ${
      p1.y - (tangents[i + 1]! * h) / 3
    }, ${p1.x} ${p1.y}`;
  }
  return path;
}

/** Rounded tick values that keep the axis legible without crowding it. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min];
  const span = max - min;
  const rawStep = span / Math.max(count - 1, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep) || 1)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * magnitude);
  const step = candidates.find((c) => c >= rawStep) ?? candidates[candidates.length - 1]!;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step * 0.001; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return ticks;
}

/** Picks evenly spaced indices so x-axis labels never collide. */
export function labelIndices(length: number, target: number): number[] {
  if (length <= target) return Array.from({ length }, (_, i) => i);
  const step = (length - 1) / (target - 1);
  return Array.from({ length: target }, (_, i) => Math.round(i * step));
}

export function extent(points: SeriesPoint[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    if (point.v < min) min = point.v;
    if (point.v > max) max = point.v;
  }
  if (!Number.isFinite(min)) return [0, 1];
  return [min, max];
}

export const CHART_INK = {
  line: 'var(--color-cyan-signal)',
  lineSoft: 'color-mix(in srgb, var(--color-cyan-signal) 14%, transparent)',
  out: 'var(--color-orchid-bloom)',
  grid: 'rgba(255,255,255,0.07)',
  axis: 'var(--color-fog)',
} as const;
