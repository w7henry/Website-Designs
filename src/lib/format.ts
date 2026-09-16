const CURRENCY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CURRENCY_ROUND = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** $12,286.42 — always absolute; sign is carried by `signed` helpers. */
export function currency(value: number, opts?: { cents?: boolean }): string {
  const fmt = opts?.cents === false ? CURRENCY_ROUND : CURRENCY;
  return fmt.format(Math.abs(value));
}

/** −$84.23 / +$7,420.00 — an explicit sign, never colour alone. */
export function signedCurrency(value: number, opts?: { cents?: boolean; plus?: boolean }): string {
  const sign = value < 0 ? '−' : opts?.plus === false ? '' : '+';
  return `${sign}${currency(value, opts)}`;
}

/** Splits a currency string so the cents can be set at a smaller size. */
export function splitCurrency(value: number, opts?: { plus?: boolean }): {
  sign: string;
  whole: string;
  cents: string;
} {
  const sign = value < 0 ? '−' : opts?.plus ? '+' : '';
  const [whole, cents = '00'] = CURRENCY.format(Math.abs(value)).split('.');
  return { sign, whole: whole!, cents };
}

/** $86.4k / $1.2M — for axis ticks only. */
export function compactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}$${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}$${trim(abs / 1_000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

function trim(n: number): string {
  return n >= 100 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, '');
}

export function percent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function signedPercent(value: number, digits = 2): string {
  const sign = value < 0 ? '−' : '+';
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function number(value: number, digits = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/* ---------------------------------------------------------------- dates */

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const DAY_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
const MONTH_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const WEEKDAY = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatDay = (iso: string) => DAY.format(parseDate(iso));
export const formatDayYear = (iso: string) => DAY_YEAR.format(parseDate(iso));
export const formatMonth = (t: number) => MONTH.format(new Date(t));
export const formatMonthYear = (t: number) => MONTH_YEAR.format(new Date(t));
export const formatLongDate = (iso: string) => WEEKDAY.format(parseDate(iso));

/** "Today", "Yesterday", "Mon 14", then falls back to a date. */
export function relativeDay(iso: string, today: string): string {
  const diff = Math.round((parseDate(today).getTime() - parseDate(iso).getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDay(iso);
}

export function relativeTime(iso: string, now: Date): string {
  const diff = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}h ago`;
  const days = Math.floor(diff / (60 * 24));
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDay(iso.slice(0, 10));
}

/** "16 months" → "1 yr 4 mo" */
export function monthsToHuman(months: number): string {
  if (!Number.isFinite(months) || months <= 0) return 'Reached';
  const rounded = Math.ceil(months);
  if (rounded < 12) return `${rounded} mo`;
  const y = Math.floor(rounded / 12);
  const m = rounded % 12;
  return m === 0 ? `${y} yr` : `${y} yr ${m} mo`;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/** Initials for an avatar fallback — "Whole Foods Market" → "WF" */
export function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/);
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

/** Months needed to close a gap at a given rate, as human text. */
export function monthsToHumanSafe(remaining: number, perMonth: number): string {
  if (remaining <= 0) return 'immediately';
  if (!perMonth || perMonth <= 0) return 'no set time';
  return monthsToHuman(remaining / perMonth);
}
