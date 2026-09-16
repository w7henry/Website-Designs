import type { Category, CategoryId } from './types';

/**
 * Chromatic tokens are reserved for full-bleed category tiles and chart
 * marks (DESIGN.md → Do's). Every category maps onto one of the six brand
 * chromatics or a neutral step — no colours are invented.
 */
export const CATEGORIES: Record<CategoryId, Category> = {
  housing: { id: 'housing', label: 'Housing', tint: 'var(--color-iris-gleam)' },
  food: { id: 'food', label: 'Food & Dining', tint: 'var(--color-cyan-signal)' },
  transport: { id: 'transport', label: 'Transportation', tint: 'var(--color-periwinkle)' },
  entertainment: { id: 'entertainment', label: 'Entertainment', tint: 'var(--color-orchid-bloom)' },
  shopping: { id: 'shopping', label: 'Shopping', tint: 'var(--color-pale-iris)' },
  subscriptions: { id: 'subscriptions', label: 'Subscriptions', tint: 'var(--color-deep-iris)' },
  travel: { id: 'travel', label: 'Travel', tint: 'var(--color-silver)' },
  health: { id: 'health', label: 'Health', tint: 'var(--color-fog)' },
  utilities: { id: 'utilities', label: 'Utilities', tint: 'var(--color-steel)' },
  other: { id: 'other', label: 'Other', tint: 'var(--color-graphite)' },
  income: { id: 'income', label: 'Income', tint: 'var(--color-pure)', excludeFromSpending: true },
  transfer: { id: 'transfer', label: 'Transfer', tint: 'var(--color-fog)', excludeFromSpending: true },
};

/** Order used by analytics, budgets and filters. */
export const SPENDING_CATEGORIES: CategoryId[] = [
  'housing',
  'food',
  'shopping',
  'entertainment',
  'utilities',
  'transport',
  'subscriptions',
  'health',
  'travel',
  'other',
];

export const ALL_CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES[id]?.label ?? 'Uncategorised';
}

export function categoryTint(id: CategoryId): string {
  return CATEGORIES[id]?.tint ?? 'var(--color-graphite)';
}

/** Merchant metadata used for detail views — location, payment rail, site. */
export const MERCHANT_META: Record<string, { location?: string; method?: string }> = {
  'Whole Foods Market': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  "Trader Joe's": { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'Blue Bottle Coffee': { location: 'Brooklyn, NY', method: 'Apple Pay' },
  'Sweetgreen': { location: 'Manhattan, NY', method: 'Aurum Card ·· 3318' },
  'Osteria Lupo': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'Hana Sushi': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  "Joe's Pizza": { location: 'Manhattan, NY', method: 'Apple Pay' },
  'Tartine Bakery': { location: 'Brooklyn, NY', method: 'Apple Pay' },
  'Little Owl Deli': { location: 'Brooklyn, NY', method: 'Apple Pay' },
  'Apple': { location: 'apple.com', method: 'Aurum Card ·· 3318' },
  'Amazon': { location: 'amazon.com', method: 'Aurum Card ·· 3318' },
  'Uniqlo': { location: 'Manhattan, NY', method: 'Aurum Card ·· 3318' },
  'Muji': { location: 'Manhattan, NY', method: 'Aurum Card ·· 3318' },
  'Aesop': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'Nike': { location: 'nike.com', method: 'Aurum Card ·· 3318' },
  'COS': { location: 'Manhattan, NY', method: 'Aurum Card ·· 3318' },
  'Netflix': { location: 'netflix.com', method: 'Aurum Card ·· 3318' },
  'Spotify': { location: 'spotify.com', method: 'Aurum Card ·· 3318' },
  'Angelika Film Center': { location: 'Manhattan, NY', method: 'Aurum Card ·· 3318' },
  'Steam': { location: 'steampowered.com', method: 'Aurum Card ·· 3318' },
  'Brooklyn Bowl': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'Criterion Channel': { location: 'criterionchannel.com', method: 'Aurum Card ·· 3318' },
  'Rough Trade Records': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'Max': { location: 'max.com', method: 'Aurum Card ·· 3318' },
  'MoMA': { location: 'Manhattan, NY', method: 'Aurum Card ·· 3318' },
  'MTA MetroCard': { location: 'New York, NY', method: 'Aurum Card ·· 3318' },
  'Uber': { location: 'New York, NY', method: 'Apple Pay' },
  'Shell': { location: 'Queens, NY', method: 'Aurum Card ·· 3318' },
  'Citi Bike': { location: 'New York, NY', method: 'Aurum Card ·· 3318' },
  'Bay Ridge Property Co.': { location: 'Brooklyn, NY', method: 'ACH · Everyday Checking' },
  'Lumen Insurance': { location: 'lumeninsure.com', method: 'ACH · Everyday Checking' },
  'Ridgeline Hardware': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'Meridian Power': { location: 'meridianpower.com', method: 'ACH · Everyday Checking' },
  'Fiberline Internet': { location: 'fiberline.net', method: 'ACH · Everyday Checking' },
  'Tessera Mobile': { location: 'tesseramobile.com', method: 'Aurum Card ·· 3318' },
  'Brooklyn Water Board': { location: 'Brooklyn, NY', method: 'ACH · Everyday Checking' },
  'iCloud+': { location: 'apple.com', method: 'Aurum Card ·· 3318' },
  'Notion': { location: 'notion.so', method: 'Aurum Card ·· 3318' },
  'Adobe Creative Cloud': { location: 'adobe.com', method: 'Aurum Card ·· 3318' },
  'The New York Times': { location: 'nytimes.com', method: 'Aurum Card ·· 3318' },
  'Solstice Gym': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  '1Password': { location: '1password.com', method: 'Aurum Card ·· 3318' },
  'Dropbox': { location: 'dropbox.com', method: 'Aurum Card ·· 3318' },
  'Audible': { location: 'audible.com', method: 'Aurum Card ·· 3318' },
  'Walgreens': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'CVS Pharmacy': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'Dr. Nakamura, DDS': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'Room to Read': { location: 'roomtoread.org', method: 'Aurum Card ·· 3318' },
  'Bergen Cleaners': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'NYC Dept. of Finance': { location: 'New York, NY', method: 'Aurum Card ·· 3318' },
  'USPS': { location: 'Brooklyn, NY', method: 'Aurum Card ·· 3318' },
  'ATM Withdrawal': { location: 'Brooklyn, NY', method: 'Everyday Checking ·· 4821' },
  'Meridian Labs': { location: 'Direct deposit', method: 'ACH · Everyday Checking' },
  'Halcyon Studio': { location: 'Invoice payment', method: 'ACH · Everyday Checking' },
  'Vantage Savings': { location: 'Interest posting', method: 'Vantage Savings ·· 7740' },
  'Delta Air Lines': { location: 'delta.com', method: 'Aurum Card ·· 3318' },
  'Hotel Kinsley': { location: 'Kingston, NY', method: 'Aurum Card ·· 3318' },
  'Airbnb': { location: 'airbnb.com', method: 'Aurum Card ·· 3318' },
  'Kayak': { location: 'kayak.com', method: 'Aurum Card ·· 3318' },
};

/** Ready-made options for category pickers and filters. */
export const CATEGORY_OPTIONS = SPENDING_CATEGORIES.map((id) => ({
  value: id,
  label: CATEGORIES[id].label,
  tint: CATEGORIES[id].tint,
}));
