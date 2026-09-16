import type { Goal } from './types';
import { ACCOUNT_IDS } from './ledger';

/**
 * Every goal is an allocation against a real balance. The sum allocated
 * to an account can never exceed that account's balance:
 *   Vantage Savings  20,512.86 ≥ 12,400 + 2,400
 *   Emergency Reserve 8,400.00 = 8,400
 *   Origin Invest    86,420.18 ≥ 48,000
 */
export const GOALS: Goal[] = [
  {
    id: 'goal-emergency',
    name: 'Emergency fund',
    target: 15000,
    current: 8400,
    monthlyContribution: 400,
    fundedBy: ACCOUNT_IDS.reserve,
    note: 'Six months of essential spending.',
    createdAt: '2023-01-09',
  },
  {
    id: 'goal-house',
    name: 'House deposit',
    target: 100000,
    current: 48000,
    monthlyContribution: 2000,
    fundedBy: ACCOUNT_IDS.invest,
    note: 'Earmarked inside the long-horizon portfolio.',
    createdAt: '2021-06-02',
  },
  {
    id: 'goal-car',
    name: 'New car',
    target: 30000,
    current: 12400,
    monthlyContribution: 650,
    fundedBy: ACCOUNT_IDS.savings,
    note: 'Replacing the estate before the next inspection.',
    createdAt: '2024-04-18',
  },
  {
    id: 'goal-vacation',
    name: 'Japan, April',
    target: 4000,
    current: 2400,
    monthlyContribution: 200,
    fundedBy: ACCOUNT_IDS.savings,
    note: 'Two weeks — Tokyo, Kanazawa, Naoshima.',
    createdAt: '2025-11-02',
  },
];
