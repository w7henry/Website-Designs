import type { Holding } from './types';

/**
 * Market value 86,420.18 · cost basis 73,936.96 · return +12,483.22
 * (+16.88%). Cost per share is carried at full precision so the totals
 * reconcile to the cent; the UI displays two decimals.
 */
export const HOLDINGS: Holding[] = [
  {
    id: 'voo',
    name: 'Vanguard S&P 500 ETF',
    ticker: 'VOO',
    kind: 'etf',
    shares: 52,
    price: 612.4,
    prevClose: 608.15,
    costPerShare: 548.2,
    sector: 'US large cap',
  },
  {
    id: 'aapl',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    kind: 'equity',
    shares: 62,
    price: 248.6,
    prevClose: 246.92,
    costPerShare: 214.35,
    sector: 'Technology',
  },
  {
    id: 'msft',
    name: 'Microsoft Corp.',
    ticker: 'MSFT',
    kind: 'equity',
    shares: 26,
    price: 512.85,
    prevClose: 509.4,
    costPerShare: 441.6,
    sector: 'Technology',
  },
  {
    id: 'nvda',
    name: 'NVIDIA Corp.',
    ticker: 'NVDA',
    kind: 'equity',
    shares: 74,
    price: 186.25,
    prevClose: 182.1,
    costPerShare: 133.98824324324324,
    sector: 'Semiconductors',
  },
  {
    id: 'amzn',
    name: 'Amazon.com Inc.',
    ticker: 'AMZN',
    kind: 'equity',
    shares: 41,
    price: 231.8,
    prevClose: 233.45,
    costPerShare: 202.15,
    sector: 'Consumer',
  },
  {
    id: 'vxus',
    name: 'Vanguard Total International ETF',
    ticker: 'VXUS',
    kind: 'etf',
    shares: 30,
    price: 71.26,
    prevClose: 71.02,
    costPerShare: 68.4,
    sector: 'International',
  },
  {
    id: 'cash',
    name: 'Cash sweep',
    ticker: 'USD',
    kind: 'cash',
    shares: 403.98,
    price: 1,
    prevClose: 1,
    costPerShare: 1,
    sector: 'Cash',
  },
];

/**
 * Monthly total return of the portfolio, oldest first, covering the
 * 15 months the ledger spans. The final entry is month-to-date.
 * A drawdown in Jan and Apr keeps the curve honest.
 */
export const MONTHLY_RETURNS: number[] = [
  0.024, 0.011, -0.028, 0.042, 0.031, 0.008, -0.021, 0.036, 0.014, -0.042, 0.051, 0.02, 0.032,
  0.016, 0.047,
];
