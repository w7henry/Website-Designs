export type AccountKind = 'checking' | 'savings' | 'investment' | 'credit' | 'reserve';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  institution: string;
  /** Last four of the account number — shown as ·· 4821 */
  mask: string;
  /** Signed. Credit balances are negative (money owed). */
  balance: number;
  openedAt: string;
  apy?: number;
  apr?: number;
  creditLimit?: number;
  /** Short line shown under the name in dense lists */
  blurb: string;
  /** Four or five words, for compact rows where the blurb would clip */
  short: string;
}

export type CategoryId =
  | 'housing'
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'subscriptions'
  | 'travel'
  | 'health'
  | 'utilities'
  | 'other'
  | 'income'
  | 'transfer';

export interface Category {
  id: CategoryId;
  label: string;
  /** Chromatic token — used only for full-bleed tiles and chart marks. */
  tint: string;
  /** Excluded from spending analytics (income, internal transfers) */
  excludeFromSpending?: boolean;
}

export type TransactionType = 'debit' | 'credit' | 'transfer';

export interface Transaction {
  id: string;
  /** ISO date, no time component — the ledger posts by day. */
  date: string;
  merchant: string;
  categoryId: CategoryId;
  /** Signed: negative is money leaving, positive is money arriving. */
  amount: number;
  accountId: string;
  type: TransactionType;
  pending?: boolean;
  recurring?: boolean;
  location?: string;
  method?: string;
  /** Present on both legs of an internal transfer */
  transferGroup?: string;
}

export interface Holding {
  id: string;
  name: string;
  ticker: string;
  kind: 'equity' | 'etf' | 'cash';
  shares: number;
  price: number;
  prevClose: number;
  /** Average cost — carried at full precision, displayed to 2dp. */
  costPerShare: number;
  sector: string;
}

export interface Budget {
  categoryId: CategoryId;
  limit: number;
  /** Fixed commitments (rent, utilities) are paced differently. */
  fixed?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  monthlyContribution: number;
  fundedBy: string;
  note: string;
  createdAt: string;
}

export type InsightTone = 'neutral' | 'positive' | 'attention';

export interface Insight {
  id: string;
  tone: InsightTone;
  eyebrow: string;
  headline: string;
  detail: string;
  /** Optional deep link into the app */
  href?: string;
  action?: string;
}

export type NotificationKind = 'money' | 'budget' | 'market' | 'security' | 'system';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  priority: 'high' | 'normal' | 'low';
  href?: string;
}

export interface SeriesPoint {
  /** epoch ms at UTC midnight */
  t: number;
  v: number;
}

export interface FlowPoint {
  t: number;
  label: string;
  income: number;
  spending: number;
}
