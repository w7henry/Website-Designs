import type { CategoryId, Transaction } from './types';
import { MERCHANT_META } from './catalog';
import { mulberry32, pick } from '../lib/rng';
import { toISO } from '../lib/format';

/**
 * The dataset is a deterministic snapshot — a demo ledger anchored to a
 * fixed date so every derived figure (balances, budgets, analytics,
 * insights) is stable and internally consistent on every load.
 */
export const ANCHOR = '2026-09-16';
export const ANCHOR_DATE = new Date(Date.UTC(2026, 8, 16));
const HISTORY_MONTHS = 15;

export const ACCOUNT_IDS = {
  checking: 'acc-checking',
  savings: 'acc-savings',
  reserve: 'acc-reserve',
  invest: 'acc-invest',
  card: 'acc-card',
} as const;

interface Spec {
  day: number;
  merchant: string;
  categoryId: CategoryId;
  /** Magnitude — the sign is applied from `flow`. */
  amount: number;
  account: string;
  flow: 'in' | 'out';
  recurring?: boolean;
}

/* ------------------------------------------------------------------ *
 * Fixed monthly commitments — identical day and amount every month.
 * ------------------------------------------------------------------ */
const FIXED: Spec[] = [
  // Income
  { day: 1, merchant: 'Meridian Labs', categoryId: 'income', amount: 3710, account: ACCOUNT_IDS.checking, flow: 'in', recurring: true },
  { day: 15, merchant: 'Meridian Labs', categoryId: 'income', amount: 3710, account: ACCOUNT_IDS.checking, flow: 'in', recurring: true },
  { day: 8, merchant: 'Halcyon Studio', categoryId: 'income', amount: 1000, account: ACCOUNT_IDS.checking, flow: 'in', recurring: true },
  // Interest posts on the last business day — not yet received this month.
  { day: 30, merchant: 'Vantage Savings', categoryId: 'income', amount: 18.4, account: ACCOUNT_IDS.savings, flow: 'in', recurring: true },

  // Housing — 2,150.00
  { day: 1, merchant: 'Bay Ridge Property Co.', categoryId: 'housing', amount: 2050, account: ACCOUNT_IDS.checking, flow: 'out', recurring: true },
  { day: 2, merchant: 'Lumen Insurance', categoryId: 'housing', amount: 46, account: ACCOUNT_IDS.checking, flow: 'out', recurring: true },
  { day: 9, merchant: 'Ridgeline Hardware', categoryId: 'housing', amount: 54, account: ACCOUNT_IDS.card, flow: 'out' },

  // Utilities — 186.00
  { day: 4, merchant: 'Fiberline Internet', categoryId: 'utilities', amount: 70, account: ACCOUNT_IDS.checking, flow: 'out', recurring: true },
  { day: 6, merchant: 'Meridian Power', categoryId: 'utilities', amount: 88.4, account: ACCOUNT_IDS.checking, flow: 'out', recurring: true },
  { day: 12, merchant: 'Tessera Mobile', categoryId: 'utilities', amount: 27.6, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 24, merchant: 'Brooklyn Water Board', categoryId: 'utilities', amount: 42, account: ACCOUNT_IDS.checking, flow: 'out', recurring: true },

  // Subscriptions — 183.91
  { day: 2, merchant: 'iCloud+', categoryId: 'subscriptions', amount: 9.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 3, merchant: 'Notion', categoryId: 'subscriptions', amount: 10, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 5, merchant: 'Adobe Creative Cloud', categoryId: 'subscriptions', amount: 59.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 7, merchant: 'The New York Times', categoryId: 'subscriptions', amount: 25, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 8, merchant: 'Solstice Gym', categoryId: 'subscriptions', amount: 42, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 11, merchant: '1Password', categoryId: 'subscriptions', amount: 7.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 13, merchant: 'Dropbox', categoryId: 'subscriptions', amount: 11.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 16, merchant: 'Audible', categoryId: 'subscriptions', amount: 16.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },

  // Recurring entertainment
  { day: 3, merchant: 'Netflix', categoryId: 'entertainment', amount: 19.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 5, merchant: 'Spotify', categoryId: 'entertainment', amount: 11.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 6, merchant: 'Max', categoryId: 'entertainment', amount: 16.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
  { day: 14, merchant: 'Criterion Channel', categoryId: 'entertainment', amount: 10.99, account: ACCOUNT_IDS.card, flow: 'out', recurring: true },
];

/** Automated transfers — internal, never counted as income or spending. */
const TRANSFERS: { day: number; from: string; to: string; amount: number; label: string }[] = [
  { day: 2, from: ACCOUNT_IDS.checking, to: ACCOUNT_IDS.savings, amount: 850, label: 'Transfer to Vantage Savings' },
  { day: 3, from: ACCOUNT_IDS.checking, to: ACCOUNT_IDS.invest, amount: 2000, label: 'Transfer to Origin Invest' },
  { day: 5, from: ACCOUNT_IDS.checking, to: ACCOUNT_IDS.reserve, amount: 400, label: 'Transfer to Emergency Reserve' },
];

/* ------------------------------------------------------------------ *
 * The anchor month, authored transaction by transaction so the
 * month-to-date category totals are exact:
 *   Food 620.00 · Transport 190.00 · Entertainment 280.00 (incl. the
 *   recurring streaming above) · Shopping 430.00 · Health 98.00 ·
 *   Other 190.00
 * ------------------------------------------------------------------ */
const ANCHOR_MONTH: Spec[] = [
  // Food & Dining — 620.00
  { day: 2, merchant: 'Whole Foods Market', categoryId: 'food', amount: 84.23, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 3, merchant: 'Blue Bottle Coffee', categoryId: 'food', amount: 6.75, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 4, merchant: 'Sweetgreen', categoryId: 'food', amount: 16.4, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 6, merchant: "Trader Joe's", categoryId: 'food', amount: 71.18, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 7, merchant: 'Blue Bottle Coffee', categoryId: 'food', amount: 6.75, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 9, merchant: 'Osteria Lupo', categoryId: 'food', amount: 128.5, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 10, merchant: 'Little Owl Deli', categoryId: 'food', amount: 19.25, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 11, merchant: 'Whole Foods Market', categoryId: 'food', amount: 62.94, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 12, merchant: "Joe's Pizza", categoryId: 'food', amount: 18, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 13, merchant: 'Blue Bottle Coffee', categoryId: 'food', amount: 6.75, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 13, merchant: 'Sweetgreen', categoryId: 'food', amount: 17.85, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 14, merchant: 'Tartine Bakery', categoryId: 'food', amount: 12.4, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 15, merchant: "Trader Joe's", categoryId: 'food', amount: 88.25, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 16, merchant: 'Hana Sushi', categoryId: 'food', amount: 74, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 16, merchant: 'Blue Bottle Coffee', categoryId: 'food', amount: 6.75, account: ACCOUNT_IDS.card, flow: 'out' },

  // Transportation — 190.00
  { day: 2, merchant: 'MTA MetroCard', categoryId: 'transport', amount: 33, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 5, merchant: 'Uber', categoryId: 'transport', amount: 24.8, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 7, merchant: 'Shell', categoryId: 'transport', amount: 52.3, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 11, merchant: 'Uber', categoryId: 'transport', amount: 18.4, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 14, merchant: 'MTA MetroCard', categoryId: 'transport', amount: 33, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 16, merchant: 'Citi Bike', categoryId: 'transport', amount: 28.5, account: ACCOUNT_IDS.card, flow: 'out' },

  // Entertainment — 280.00 total (59.96 of it recurring, above)
  { day: 7, merchant: 'Angelika Film Center', categoryId: 'entertainment', amount: 34, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 9, merchant: 'Steam', categoryId: 'entertainment', amount: 29.99, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 12, merchant: 'Brooklyn Bowl', categoryId: 'entertainment', amount: 96, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 13, merchant: 'MoMA', categoryId: 'entertainment', amount: 22, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 16, merchant: 'Rough Trade Records', categoryId: 'entertainment', amount: 38.05, account: ACCOUNT_IDS.card, flow: 'out' },

  // Shopping — 430.00
  { day: 2, merchant: 'Uniqlo', categoryId: 'shopping', amount: 78.9, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 6, merchant: 'Muji', categoryId: 'shopping', amount: 34.5, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 8, merchant: 'Amazon', categoryId: 'shopping', amount: 62.18, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 10, merchant: 'Aesop', categoryId: 'shopping', amount: 48, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 12, merchant: 'Nike', categoryId: 'shopping', amount: 110, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 14, merchant: 'Amazon', categoryId: 'shopping', amount: 27.42, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 15, merchant: 'COS', categoryId: 'shopping', amount: 69, account: ACCOUNT_IDS.card, flow: 'out' },

  // Health — 98.00
  { day: 4, merchant: 'Walgreens', categoryId: 'health', amount: 23.4, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 10, merchant: 'Dr. Nakamura, DDS', categoryId: 'health', amount: 45, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 15, merchant: 'CVS Pharmacy', categoryId: 'health', amount: 29.6, account: ACCOUNT_IDS.card, flow: 'out' },

  // Other — 190.00
  { day: 5, merchant: 'Room to Read', categoryId: 'other', amount: 50, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 9, merchant: 'Bergen Cleaners', categoryId: 'other', amount: 38, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 11, merchant: 'USPS', categoryId: 'other', amount: 7, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 13, merchant: 'NYC Dept. of Finance', categoryId: 'other', amount: 65, account: ACCOUNT_IDS.card, flow: 'out' },
  { day: 14, merchant: 'ATM Withdrawal', categoryId: 'other', amount: 30, account: ACCOUNT_IDS.checking, flow: 'out' },
];

/* ------------------------------------------------------------------ *
 * Pools used to fill historic months with plausible variation.
 * ------------------------------------------------------------------ */
type Pool = { merchant: string; min: number; max: number; account?: string }[];

const POOLS: Partial<Record<CategoryId, Pool>> = {
  food: [
    { merchant: 'Whole Foods Market', min: 54, max: 118 },
    { merchant: "Trader Joe's", min: 42, max: 96 },
    { merchant: 'Blue Bottle Coffee', min: 5.5, max: 9.5 },
    { merchant: 'Sweetgreen', min: 14, max: 22 },
    { merchant: 'Osteria Lupo', min: 86, max: 164 },
    { merchant: 'Hana Sushi', min: 48, max: 112 },
    { merchant: "Joe's Pizza", min: 9, max: 24 },
    { merchant: 'Tartine Bakery', min: 8, max: 26 },
    { merchant: 'Little Owl Deli', min: 12, max: 28 },
  ],
  transport: [
    { merchant: 'MTA MetroCard', min: 33, max: 33 },
    { merchant: 'Uber', min: 11, max: 42 },
    { merchant: 'Shell', min: 44, max: 68 },
    { merchant: 'Citi Bike', min: 14, max: 34 },
  ],
  entertainment: [
    { merchant: 'Angelika Film Center', min: 22, max: 44 },
    { merchant: 'Steam', min: 14, max: 60 },
    { merchant: 'Brooklyn Bowl', min: 48, max: 128 },
    { merchant: 'MoMA', min: 18, max: 30 },
    { merchant: 'Rough Trade Records', min: 22, max: 62 },
  ],
  shopping: [
    { merchant: 'Amazon', min: 18, max: 96 },
    { merchant: 'Uniqlo', min: 38, max: 128 },
    { merchant: 'Muji', min: 16, max: 62 },
    { merchant: 'Aesop', min: 32, max: 78 },
    { merchant: 'Nike', min: 64, max: 168 },
    { merchant: 'COS', min: 48, max: 142 },
  ],
  health: [
    { merchant: 'Walgreens', min: 12, max: 48 },
    { merchant: 'CVS Pharmacy', min: 14, max: 52 },
    { merchant: 'Dr. Nakamura, DDS', min: 45, max: 180 },
  ],
  other: [
    { merchant: 'Room to Read', min: 50, max: 50 },
    { merchant: 'Bergen Cleaners', min: 22, max: 54 },
    { merchant: 'USPS', min: 6, max: 18 },
    { merchant: 'ATM Withdrawal', min: 30, max: 90, account: ACCOUNT_IDS.checking },
  ],
  travel: [
    { merchant: 'Delta Air Lines', min: 240, max: 620 },
    { merchant: 'Hotel Kinsley', min: 280, max: 540 },
    { merchant: 'Airbnb', min: 320, max: 780 },
    { merchant: 'Kayak', min: 40, max: 120 },
  ],
};

/** Full-month discretionary targets for historic months. */
const MONTHLY_TARGET: Partial<Record<CategoryId, number>> = {
  food: 1120,
  transport: 330,
  entertainment: 330,
  shopping: 540,
  health: 120,
  other: 160,
};

/** Months that carry a deliberate story — a trip, a laptop, the holidays. */
const SEASONAL: Record<string, { category: CategoryId; scale?: number; extra?: Spec[] }[]> = {
  '2025-12': [
    { category: 'shopping', scale: 2.1 },
    { category: 'travel', scale: 1, extra: [
      { day: 21, merchant: 'Delta Air Lines', categoryId: 'travel', amount: 486.4, account: ACCOUNT_IDS.card, flow: 'out' },
      { day: 27, merchant: 'Airbnb', categoryId: 'travel', amount: 512, account: ACCOUNT_IDS.card, flow: 'out' },
    ] },
  ],
  '2026-06': [
    { category: 'travel', scale: 1, extra: [
      { day: 4, merchant: 'Delta Air Lines', categoryId: 'travel', amount: 612.8, account: ACCOUNT_IDS.card, flow: 'out' },
      { day: 11, merchant: 'Hotel Kinsley', categoryId: 'travel', amount: 528, account: ACCOUNT_IDS.card, flow: 'out' },
      { day: 12, merchant: 'Kayak', categoryId: 'travel', amount: 74.5, account: ACCOUNT_IDS.card, flow: 'out' },
    ] },
    { category: 'food', scale: 1.24 },
  ],
  '2026-08': [
    { category: 'shopping', scale: 1, extra: [
      { day: 22, merchant: 'Apple', categoryId: 'shopping', amount: 1249, account: ACCOUNT_IDS.card, flow: 'out' },
    ] },
  ],
  '2026-07': [{ category: 'food', scale: 1.12 }],
  '2026-04': [{ category: 'health', scale: 2.4 }],
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function makeTransaction(
  spec: Spec,
  year: number,
  month: number,
  index: number,
): Transaction {
  const day = Math.min(spec.day, daysInMonth(year, month));
  const date = toISO(new Date(Date.UTC(year, month, day)));
  const meta = MERCHANT_META[spec.merchant] ?? {};
  const amount = spec.flow === 'in' ? spec.amount : -spec.amount;
  return {
    id: `tx-${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}-${index}`,
    date,
    merchant: spec.merchant,
    categoryId: spec.categoryId,
    amount: Math.round(amount * 100) / 100,
    accountId: spec.account,
    type: spec.flow === 'in' ? 'credit' : 'debit',
    recurring: spec.recurring,
    location: meta.location,
    method: meta.method,
  };
}

function fillCategory(
  category: CategoryId,
  target: number,
  rand: () => number,
  maxDay: number,
): Spec[] {
  const pool = POOLS[category];
  if (!pool || target <= 0) return [];
  const out: Spec[] = [];
  let remaining = target;
  let guard = 0;
  while (remaining > 4 && guard < 60) {
    guard += 1;
    const entry = pick(rand, pool);
    const raw = entry.min + rand() * (entry.max - entry.min);
    const amount = Math.round(Math.min(raw, remaining) * 100) / 100;
    if (amount < 3) break;
    remaining -= amount;
    out.push({
      day: 1 + Math.floor(rand() * maxDay),
      merchant: entry.merchant,
      categoryId: category,
      amount,
      account: entry.account ?? ACCOUNT_IDS.card,
      flow: 'out',
    });
  }
  return out;
}

/**
 * Builds the full ledger. Historic months vary around the same monthly
 * shape; the anchor month is authored exactly.
 */
export function buildLedger(): Transaction[] {
  const rand = mulberry32(20260916);
  const transactions: Transaction[] = [];
  const anchorYear = ANCHOR_DATE.getUTCFullYear();
  const anchorMonth = ANCHOR_DATE.getUTCMonth();
  const anchorDay = ANCHOR_DATE.getUTCDate();
  const cardChargesByMonth = new Map<string, number>();

  for (let offset = HISTORY_MONTHS - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(Date.UTC(anchorYear, anchorMonth - offset, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const isAnchorMonth = offset === 0;
    const lastDay = isAnchorMonth ? anchorDay : daysInMonth(year, month);

    const specs: Spec[] = [];

    // Fixed commitments
    for (const spec of FIXED) specs.push(spec);

    if (isAnchorMonth) {
      specs.push(...ANCHOR_MONTH);
    } else {
      const seasonal = SEASONAL[key] ?? [];
      const scaleFor = (category: CategoryId) =>
        seasonal.find((s) => s.category === category)?.scale ?? 1;

      for (const [category, base] of Object.entries(MONTHLY_TARGET)) {
        const jitter = 0.84 + rand() * 0.34;
        const target = (base as number) * jitter * scaleFor(category as CategoryId);
        specs.push(...fillCategory(category as CategoryId, target, rand, lastDay));
      }
      for (const item of seasonal) if (item.extra) specs.push(...item.extra);
    }

    // Internal transfers
    for (const transfer of TRANSFERS) {
      if (transfer.day > lastDay) continue;
      const day = Math.min(transfer.day, daysInMonth(year, month));
      const date = toISO(new Date(Date.UTC(year, month, day)));
      const group = `tr-${key}-${transfer.to}`;
      transactions.push(
        {
          id: `${group}-out`,
          date,
          merchant: transfer.label,
          categoryId: 'transfer',
          amount: -transfer.amount,
          accountId: transfer.from,
          type: 'transfer',
          recurring: true,
          method: 'Scheduled transfer',
          transferGroup: group,
        },
        {
          id: `${group}-in`,
          date,
          merchant: 'Transfer from Everyday Checking',
          categoryId: 'transfer',
          amount: transfer.amount,
          accountId: transfer.to,
          type: 'transfer',
          recurring: true,
          method: 'Scheduled transfer',
          transferGroup: group,
        },
      );
    }

    // Card payment on the 10th clears the previous month's charges in full.
    const prev = new Date(Date.UTC(year, month - 1, 1));
    const prevKey = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
    const due = cardChargesByMonth.get(prevKey);
    if (due && due > 0 && 10 <= lastDay) {
      const date = toISO(new Date(Date.UTC(year, month, 10)));
      const group = `pay-${key}`;
      const amount = Math.round(due * 100) / 100;
      transactions.push(
        {
          id: `${group}-out`,
          date,
          merchant: 'Aurum Card payment',
          categoryId: 'transfer',
          amount: -amount,
          accountId: ACCOUNT_IDS.checking,
          type: 'transfer',
          recurring: true,
          method: 'Autopay · statement balance',
          transferGroup: group,
        },
        {
          id: `${group}-in`,
          date,
          merchant: 'Payment received — thank you',
          categoryId: 'transfer',
          amount,
          accountId: ACCOUNT_IDS.card,
          type: 'transfer',
          recurring: true,
          method: 'Autopay · statement balance',
          transferGroup: group,
        },
      );
    }

    let charges = 0;
    specs
      .filter((spec) => spec.day <= lastDay)
      .forEach((spec, index) => {
        const tx = makeTransaction(spec, year, month, index);
        if (tx.accountId === ACCOUNT_IDS.card && tx.amount < 0) charges += -tx.amount;
        transactions.push(tx);
      });
    cardChargesByMonth.set(key, charges);
  }

  transactions.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1));

  // The two most recent card authorisations have not settled yet.
  let pending = 0;
  for (const tx of transactions) {
    if (pending >= 2) break;
    if (tx.accountId === ACCOUNT_IDS.card && tx.amount < 0 && tx.date >= '2026-09-15') {
      tx.pending = true;
      pending += 1;
    }
  }

  return transactions;
}
