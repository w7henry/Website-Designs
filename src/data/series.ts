import type { Account, FlowPoint, SeriesPoint, Transaction } from './types';
import { ACCOUNT_IDS, ANCHOR } from './ledger';
import { mulberry32, gauss } from '../lib/rng';
import { parseDate, toISO } from '../lib/format';

export type RangeKey = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: '1W', label: '1W', days: 7 },
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 91 },
  { key: '6M', label: '6M', days: 182 },
  { key: '1Y', label: '1Y', days: 365 },
  { key: 'ALL', label: 'All', days: Number.POSITIVE_INFINITY },
];

const DAY_MS = 86_400_000;

export function eachDay(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let cursor = parseDate(startISO).getTime();
  const end = parseDate(endISO).getTime();
  while (cursor <= end) {
    out.push(toISO(new Date(cursor)));
    cursor += DAY_MS;
  }
  return out;
}

/**
 * Daily growth factors whose product across each calendar month equals
 * that month's total return exactly — the curve wiggles day to day but
 * never drifts away from the intended story.
 */
function dailyFactors(days: string[], monthlyReturns: number[]): Map<string, number> {
  const rand = mulberry32(8_612_045);
  const byMonth = new Map<string, string[]>();
  for (const day of days) {
    const key = day.slice(0, 7);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(day);
    else byMonth.set(key, [day]);
  }

  const factors = new Map<string, number>();
  const monthKeys = [...byMonth.keys()];
  monthKeys.forEach((key, index) => {
    const bucket = byMonth.get(key)!;
    const target = 1 + (monthlyReturns[index] ?? 0.01);
    const raw = bucket.map(() => 1 + gauss(rand, 0, 0.0062));
    const product = raw.reduce((acc, f) => acc * f, 1);
    const correction = Math.pow(target / product, 1 / raw.length);
    bucket.forEach((day, i) => factors.set(day, raw[i]! * correction));
  });
  return factors;
}

/**
 * Walks the portfolio backwards from its known closing value, removing
 * each contribution and un-applying that day's market factor. The end
 * point is therefore exact and the history is plausible.
 */
export function buildPortfolioSeries(
  transactions: Transaction[],
  closingValue: number,
  monthlyReturns: number[],
  startISO: string,
): SeriesPoint[] {
  const days = eachDay(startISO, ANCHOR);
  const factors = dailyFactors(days, monthlyReturns);

  const contributions = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.accountId !== ACCOUNT_IDS.invest) continue;
    contributions.set(tx.date, (contributions.get(tx.date) ?? 0) + tx.amount);
  }

  const values = new Array<number>(days.length);
  values[days.length - 1] = closingValue;
  for (let i = days.length - 1; i > 0; i -= 1) {
    const day = days[i]!;
    const contribution = contributions.get(day) ?? 0;
    const factor = factors.get(day) ?? 1;
    values[i - 1] = (values[i]! - contribution) / factor;
  }

  return days.map((day, i) => ({ t: parseDate(day).getTime(), v: round(values[i]!) }));
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Balance of a cash/credit account on a given day: today's balance minus
 * everything that posted after it.
 */
export function buildBalanceSeries(
  transactions: Transaction[],
  account: Account,
  days: string[],
): SeriesPoint[] {
  const deltas = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.accountId !== account.id) continue;
    deltas.set(tx.date, (deltas.get(tx.date) ?? 0) + tx.amount);
  }

  const out = new Array<SeriesPoint>(days.length);
  let running = account.balance;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i]!;
    out[i] = { t: parseDate(day).getTime(), v: round(running) };
    running -= deltas.get(day) ?? 0;
  }
  return out;
}

export function sumSeries(series: SeriesPoint[][]): SeriesPoint[] {
  const first = series[0];
  if (!first) return [];
  return first.map((point, i) => ({
    t: point.t,
    v: round(series.reduce((acc, s) => acc + (s[i]?.v ?? 0), 0)),
  }));
}

export function sliceRange(series: SeriesPoint[], range: RangeKey): SeriesPoint[] {
  const config = RANGES.find((r) => r.key === range);
  if (!config || !Number.isFinite(config.days)) return series;
  const cutoff = parseDate(ANCHOR).getTime() - config.days * DAY_MS;
  const sliced = series.filter((p) => p.t >= cutoff);
  return sliced.length > 1 ? sliced : series.slice(-2);
}

export interface Delta {
  absolute: number;
  percent: number;
  from: number;
  to: number;
}

export function deltaOf(series: SeriesPoint[]): Delta {
  const first = series[0]?.v ?? 0;
  const last = series[series.length - 1]?.v ?? 0;
  return {
    absolute: round(last - first),
    percent: first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100,
    from: first,
    to: last,
  };
}

/* ---------------------------------------------------------------- flows */

export type FlowGranularity = 'weekly' | 'monthly' | 'yearly';

function bucketKey(date: string, granularity: FlowGranularity): string {
  if (granularity === 'yearly') return date.slice(0, 4);
  if (granularity === 'monthly') return date.slice(0, 7);
  const d = parseDate(date);
  const day = d.getUTCDay();
  const monday = new Date(d.getTime() - ((day + 6) % 7) * DAY_MS);
  return toISO(monday);
}

function bucketLabel(key: string, granularity: FlowGranularity): string {
  if (granularity === 'yearly') return key;
  if (granularity === 'monthly') {
    return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
      parseDate(`${key}-01`),
    );
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    parseDate(key),
  );
}

export function buildFlow(
  transactions: Transaction[],
  granularity: FlowGranularity,
  limit: number,
): FlowPoint[] {
  const buckets = new Map<string, FlowPoint>();
  for (const tx of transactions) {
    if (tx.categoryId === 'transfer') continue;
    const key = bucketKey(tx.date, granularity);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        t: parseDate(granularity === 'yearly' ? `${key}-01-01` : granularity === 'monthly' ? `${key}-01` : key).getTime(),
        label: bucketLabel(key, granularity),
        income: 0,
        spending: 0,
      };
      buckets.set(key, bucket);
    }
    if (tx.amount > 0) bucket.income += tx.amount;
    else bucket.spending += -tx.amount;
  }

  return [...buckets.values()]
    .sort((a, b) => a.t - b.t)
    .slice(-limit)
    .map((b) => ({ ...b, income: round(b.income), spending: round(b.spending) }));
}
