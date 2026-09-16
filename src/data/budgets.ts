import type { Budget } from './types';

/**
 * Limits only. What has been spent against each one is always derived
 * from the ledger, never stored — the two can't drift apart.
 * Fixed commitments are charged in full early in the month, so they are
 * paced differently from variable spending.
 */
export const BUDGETS: Budget[] = [
  { categoryId: 'housing', limit: 2200, fixed: true },
  { categoryId: 'food', limit: 800 },
  { categoryId: 'shopping', limit: 500 },
  { categoryId: 'entertainment', limit: 400 },
  { categoryId: 'transport', limit: 300 },
  { categoryId: 'travel', limit: 300 },
  { categoryId: 'utilities', limit: 240, fixed: true },
  { categoryId: 'subscriptions', limit: 200, fixed: true },
  { categoryId: 'other', limit: 200 },
  { categoryId: 'health', limit: 150 },
];
