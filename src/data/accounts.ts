import type { Account } from './types';
import { ACCOUNT_IDS } from './ledger';

/**
 * Balances are the snapshot's fixed point. Every historic balance is
 * derived backwards from these by unwinding the ledger, so an account
 * page can never disagree with its own transactions.
 *
 *   11,693.95 + 20,512.86 + 8,400.00 + 86,420.18 − 2,184.63
 *   = 124,842.36 net worth
 */
export const ACCOUNTS: Account[] = [
  {
    id: ACCOUNT_IDS.checking,
    name: 'Everyday Checking',
    kind: 'checking',
    institution: 'Northbank',
    mask: '4821',
    balance: 11693.95,
    openedAt: '2019-03-14',
    apy: 0.01,
    blurb: 'Salary lands here. Bills and card autopay leave from here.',
    short: 'Salary and bills',
  },
  {
    id: ACCOUNT_IDS.savings,
    name: 'Vantage Savings',
    kind: 'savings',
    institution: 'Northbank',
    mask: '7740',
    balance: 20512.86,
    openedAt: '2019-03-14',
    apy: 4.15,
    blurb: 'High-yield. Holds the car and travel goals.',
    short: 'High-yield savings',
  },
  {
    id: ACCOUNT_IDS.reserve,
    name: 'Emergency Reserve',
    kind: 'reserve',
    institution: 'Northbank',
    mask: '9052',
    balance: 8400,
    openedAt: '2023-01-09',
    apy: 4.35,
    blurb: 'Ring-fenced. Six months of essential spending is the target.',
    short: 'Ring-fenced reserve',
  },
  {
    id: ACCOUNT_IDS.invest,
    name: 'Origin Invest',
    kind: 'investment',
    institution: 'Origin',
    mask: '2216',
    balance: 86420.18,
    openedAt: '2021-06-02',
    blurb: 'Long-horizon portfolio. Auto-invests $2,000 on the 3rd.',
    short: 'Long-horizon portfolio',
  },
  {
    id: ACCOUNT_IDS.card,
    name: 'Aurum Card',
    kind: 'credit',
    institution: 'Aurum',
    mask: '3318',
    balance: -2184.63,
    openedAt: '2022-08-19',
    apr: 21.24,
    creditLimit: 18000,
    blurb: 'Day-to-day spending. Paid in full on the 10th.',
    short: 'Paid in full monthly',
  },
];

export const ACCOUNT_BY_ID = new Map(ACCOUNTS.map((a) => [a.id, a]));

export const ACCOUNT_KIND_LABEL: Record<Account['kind'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  investment: 'Investment',
  credit: 'Credit card',
  reserve: 'Reserve',
};
