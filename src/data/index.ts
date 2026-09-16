import type {
  Account,
  AppNotification,
  CategoryId,
  Goal,
  Holding,
  Insight,
  SeriesPoint,
  Transaction,
} from './types';
import { ACCOUNTS, ACCOUNT_BY_ID } from './accounts';
import { BUDGETS } from './budgets';
import { CATEGORIES, SPENDING_CATEGORIES, categoryLabel } from './catalog';
import { GOALS } from './goals';
import { HOLDINGS, MONTHLY_RETURNS } from './investments';
import { ACCOUNT_IDS, ANCHOR, ANCHOR_DATE, buildLedger } from './ledger';
import {
  buildBalanceSeries,
  buildPortfolioSeries,
  eachDay,
  sumSeries,
} from './series';
import { addMonths, formatMonthYear, parseDate, toISO } from '../lib/format';
export { monthsToHumanSafe, formatDayYear } from '../lib/format';

export * from './types';
export { CATEGORIES, SPENDING_CATEGORIES, CATEGORY_OPTIONS, categoryLabel, categoryTint } from './catalog';
export { ACCOUNT_KIND_LABEL } from './accounts';
export { BUDGETS } from './budgets';
export { GOALS } from './goals';
export { ACCOUNT_IDS, ANCHOR } from './ledger';
export { RANGES, sliceRange, deltaOf, buildFlow } from './series';
export type { RangeKey, Delta, FlowGranularity } from './series';

const round = (n: number) => Math.round(n * 100) / 100;

const TRANSACTIONS = buildLedger();
const WINDOW_START = TRANSACTIONS[TRANSACTIONS.length - 1]!.date;
const DAYS = eachDay(WINDOW_START, ANCHOR);

const investAccount = ACCOUNT_BY_ID.get(ACCOUNT_IDS.invest)!;
const PORTFOLIO_SERIES = buildPortfolioSeries(
  TRANSACTIONS,
  investAccount.balance,
  MONTHLY_RETURNS,
  WINDOW_START,
);

const ACCOUNT_SERIES = new Map<string, SeriesPoint[]>(
  ACCOUNTS.map((account) => [
    account.id,
    account.kind === 'investment'
      ? PORTFOLIO_SERIES
      : buildBalanceSeries(TRANSACTIONS, account, DAYS),
  ]),
);

const NET_WORTH_SERIES = sumSeries(ACCOUNTS.map((a) => ACCOUNT_SERIES.get(a.id)!));

const NET_WORTH = round(ACCOUNTS.reduce((acc, a) => acc + a.balance, 0));

/* ------------------------------------------------------------ portfolio */

export interface PortfolioMetrics {
  value: number;
  costBasis: number;
  totalReturn: number;
  returnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: (Holding & {
    value: number;
    dayChange: number;
    dayChangePercent: number;
    totalReturn: number;
    returnPercent: number;
    weight: number;
  })[];
}

function buildPortfolio(): PortfolioMetrics {
  const value = round(HOLDINGS.reduce((acc, h) => acc + h.shares * h.price, 0));
  const costBasis = round(HOLDINGS.reduce((acc, h) => acc + h.shares * h.costPerShare, 0));
  const dayChange = round(HOLDINGS.reduce((acc, h) => acc + h.shares * (h.price - h.prevClose), 0));
  const totalReturn = round(value - costBasis);

  const holdings = HOLDINGS.map((h) => {
    const holdingValue = round(h.shares * h.price);
    const basis = round(h.shares * h.costPerShare);
    const change = round(h.shares * (h.price - h.prevClose));
    return {
      ...h,
      value: holdingValue,
      dayChange: change,
      dayChangePercent: h.prevClose === 0 ? 0 : ((h.price - h.prevClose) / h.prevClose) * 100,
      totalReturn: round(holdingValue - basis),
      returnPercent: basis === 0 ? 0 : ((holdingValue - basis) / basis) * 100,
      weight: value === 0 ? 0 : (holdingValue / value) * 100,
    };
  }).sort((a, b) => b.value - a.value);

  return {
    value,
    costBasis,
    totalReturn,
    returnPercent: (totalReturn / costBasis) * 100,
    dayChange,
    dayChangePercent: (dayChange / (value - dayChange)) * 100,
    holdings,
  };
}

const PORTFOLIO = buildPortfolio();

/* -------------------------------------------------------------- months */

export interface MonthSummary {
  key: string;
  label: string;
  income: number;
  spending: number;
  net: number;
  savingsRate: number;
  daysElapsed: number;
  daysInMonth: number;
  byCategory: Record<string, number>;
  transactions: Transaction[];
}

function daysInMonthOf(key: string): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y!, m!, 0)).getUTCDate();
}

export function summarizeMonth(key: string, dayCutoff?: number): MonthSummary {
  const total = daysInMonthOf(key);
  const cutoff = dayCutoff ?? (key === ANCHOR.slice(0, 7) ? ANCHOR_DATE.getUTCDate() : total);
  const rows = TRANSACTIONS.filter(
    (tx) => tx.date.slice(0, 7) === key && Number(tx.date.slice(8, 10)) <= cutoff,
  );

  const byCategory: Record<string, number> = {};
  let income = 0;
  let spending = 0;
  for (const tx of rows) {
    if (CATEGORIES[tx.categoryId]?.excludeFromSpending) {
      if (tx.categoryId === 'income') income += tx.amount;
      continue;
    }
    if (tx.amount < 0) {
      spending += -tx.amount;
      byCategory[tx.categoryId] = round((byCategory[tx.categoryId] ?? 0) + -tx.amount);
    }
  }

  income = round(income);
  spending = round(spending);
  return {
    key,
    label: formatMonthYear(parseDate(`${key}-01`).getTime()),
    income,
    spending,
    net: round(income - spending),
    savingsRate: income === 0 ? 0 : ((income - spending) / income) * 100,
    daysElapsed: Math.min(cutoff, total),
    daysInMonth: total,
    byCategory,
    transactions: rows,
  };
}

export function monthKeyOffset(offset: number): string {
  return toISO(addMonths(parseDate(`${ANCHOR.slice(0, 7)}-01`), offset)).slice(0, 7);
}

const CURRENT_MONTH = summarizeMonth(ANCHOR.slice(0, 7));
/** Same number of elapsed days in the previous month — a fair comparison. */
const PREVIOUS_MTD = summarizeMonth(monthKeyOffset(-1), CURRENT_MONTH.daysElapsed);
const PREVIOUS_FULL = summarizeMonth(monthKeyOffset(-1));

const TRAILING_MONTHS = Array.from({ length: 12 }, (_, i) => summarizeMonth(monthKeyOffset(-11 + i)));

/** Month-to-date spending projected to month end — fixed commitments are
 *  already charged in full, so only variable categories are extrapolated. */
export function projectSpending(month: MonthSummary): number {
  const fixed = new Set(BUDGETS.filter((b) => b.fixed).map((b) => b.categoryId as string));
  const pace = month.daysElapsed === 0 ? 1 : month.daysInMonth / month.daysElapsed;
  let total = 0;
  for (const [category, amount] of Object.entries(month.byCategory)) {
    total += fixed.has(category) ? amount : amount * pace;
  }
  return round(total);
}

/* ------------------------------------------------------------- budgets */

export interface BudgetStatus {
  categoryId: CategoryId;
  label: string;
  limit: number;
  spent: number;
  remaining: number;
  used: number;
  projected: number;
  fixed: boolean;
  state: 'untouched' | 'on-track' | 'ahead' | 'over';
  message: string;
}

export function buildBudgetStatus(month: MonthSummary): BudgetStatus[] {
  const elapsed = month.daysInMonth === 0 ? 1 : month.daysElapsed / month.daysInMonth;
  return BUDGETS.map((budget) => {
    const spent = round(month.byCategory[budget.categoryId] ?? 0);
    const used = budget.limit === 0 ? 0 : (spent / budget.limit) * 100;
    const projected = budget.fixed ? spent : round(spent / Math.max(elapsed, 0.05));
    const daysLeft = month.daysInMonth - month.daysElapsed;

    let state: BudgetStatus['state'] = 'on-track';
    let message = '';
    if (spent === 0) {
      state = 'untouched';
      message = `Nothing spent yet — ${daysLeft} days left`;
    } else if (spent > budget.limit) {
      state = 'over';
      message = `Over by ${fmt(spent - budget.limit)}`;
    } else if (budget.fixed) {
      state = 'on-track';
      message = `${Math.round(used)}% of the monthly commitment`;
    } else if (used > elapsed * 100 + 12) {
      state = 'ahead';
      message = `On pace for ${fmt(projected)} — ${fmt(projected - budget.limit)} over`;
    } else {
      state = 'on-track';
      message = `On pace for ${fmt(projected)} — you're on track`;
    }
    if (state === 'ahead' && projected <= budget.limit) {
      message = `A little higher than usual, still inside the limit`;
    }

    return {
      categoryId: budget.categoryId,
      label: categoryLabel(budget.categoryId),
      limit: budget.limit,
      spent,
      remaining: round(budget.limit - spent),
      used,
      projected,
      fixed: Boolean(budget.fixed),
      state,
      message,
    };
  }).sort((a, b) => b.used - a.used);
}

function fmt(value: number): string {
  return `$${Math.abs(Math.round(value)).toLocaleString('en-US')}`;
}

/* --------------------------------------------------------------- goals */

export interface GoalStatus extends Goal {
  progress: number;
  remaining: number;
  monthsToGo: number;
  estimatedCompletion: string;
  accountName: string;
}

export function buildGoalStatus(goals: Goal[]): GoalStatus[] {
  return goals.map((goal) => {
    const remaining = round(Math.max(goal.target - goal.current, 0));
    const monthsToGo =
      goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : Infinity;
    const eta = Number.isFinite(monthsToGo)
      ? formatMonthYear(addMonths(ANCHOR_DATE, monthsToGo).getTime())
      : 'No contribution set';
    return {
      ...goal,
      progress: goal.target === 0 ? 0 : (goal.current / goal.target) * 100,
      remaining,
      monthsToGo,
      estimatedCompletion: remaining === 0 ? 'Reached' : eta,
      accountName: ACCOUNT_BY_ID.get(goal.fundedBy)?.name ?? 'Unallocated',
    };
  });
}

/** What is left in an account once every goal allocation is honoured. */
export function unallocated(accountId: string, goals: Goal[]): number {
  const account = ACCOUNT_BY_ID.get(accountId);
  if (!account) return 0;
  const claimed = goals
    .filter((g) => g.fundedBy === accountId)
    .reduce((acc, g) => acc + g.current, 0);
  return round(account.balance - claimed);
}

/* ------------------------------------------------------------ recurring */

export interface Recurring {
  merchant: string;
  categoryId: CategoryId;
  amount: number;
  day: number;
  nextDate: string;
  accountId: string;
}

function buildRecurring(): Recurring[] {
  const seen = new Map<string, Recurring>();
  const anchorDay = ANCHOR_DATE.getUTCDate();
  for (const tx of TRANSACTIONS) {
    if (!tx.recurring || tx.amount >= 0 || tx.categoryId === 'transfer') continue;
    if (seen.has(tx.merchant)) continue;
    const day = Number(tx.date.slice(8, 10));
    const base = day > anchorDay ? ANCHOR_DATE : addMonths(ANCHOR_DATE, 1);
    const next = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), Math.min(day, 28)),
    );
    seen.set(tx.merchant, {
      merchant: tx.merchant,
      categoryId: tx.categoryId,
      amount: round(-tx.amount),
      day,
      nextDate: toISO(next),
      accountId: tx.accountId,
    });
  }
  return [...seen.values()].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
}

const RECURRING = buildRecurring();
const SUBSCRIPTION_TOTAL = round(
  RECURRING.filter((r) => r.categoryId === 'subscriptions' || r.categoryId === 'entertainment')
    .reduce((acc, r) => acc + r.amount, 0),
);
const SUBSCRIPTIONS_ONLY = round(
  RECURRING.filter((r) => r.categoryId === 'subscriptions').reduce((acc, r) => acc + r.amount, 0),
);

/* ------------------------------------------------------------- insights */

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function buildInsights(): Insight[] {
  const out: Insight[] = [];
  const month = CURRENT_MONTH;
  const elapsed = month.daysElapsed / month.daysInMonth;
  /** The same window of the three preceding months — like for like. */
  const priorSameWindow = [1, 2, 3].map((i) =>
    summarizeMonth(monthKeyOffset(-i), month.daysElapsed),
  );
  const averageOf = (read: (m: MonthSummary) => number) =>
    priorSameWindow.reduce((acc, m) => acc + read(m), 0) / priorSameWindow.length;

  // 1 — whichever category actually moved against its own three-month norm
  const movers = SPENDING_CATEGORIES.map((category) => {
    const now = month.byCategory[category] ?? 0;
    const norm = averageOf((m) => m.byCategory[category] ?? 0);
    return { category, now, norm, delta: now - norm, percent: pctChange(now, norm) };
  })
    .filter((m) => Math.abs(m.delta) >= 40 && m.norm > 0 && m.now > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const mover = movers[0];
  if (mover) {
    const up = mover.delta > 0;
    out.push({
      id: 'insight-mover',
      tone: up ? 'attention' : 'positive',
      eyebrow: categoryLabel(mover.category),
      headline: `${categoryLabel(mover.category)} is ${up ? 'up' : 'down'} ${Math.abs(
        mover.percent,
      ).toFixed(0)}% on your three-month average.`,
      detail: `${fmt(mover.now)} in the first ${month.daysElapsed} days, against a usual ${fmt(
        mover.norm,
      )} over the same window — ${fmt(Math.abs(mover.delta))} ${
        up ? 'more than normal' : 'kept back'
      }.`,
      href: '/analytics',
      action: 'See the breakdown',
    });
  }

  // 2 — savings rate against the same window across three months
  const average = averageOf((m) => m.savingsRate);
  const gap = month.savingsRate - average;
  out.push({
    id: 'insight-savings',
    tone: gap >= 0 ? 'positive' : 'neutral',
    eyebrow: 'Savings rate',
    headline: `You're keeping ${month.savingsRate.toFixed(1)}% of what you earn this month.`,
    detail: `That is ${Math.abs(gap).toFixed(1)} points ${
      gap >= 0 ? 'above' : 'below'
    } your three-month average of ${average.toFixed(1)}% over the same ${
      month.daysElapsed
    } days. ${fmt(month.net)} has stayed put so far.`,
    href: '/analytics',
    action: 'Open cash flow',
  });

  // 3 — recurring load
  const subscriptionCount = RECURRING.filter((r) => r.categoryId === 'subscriptions').length;
  out.push({
    id: 'insight-subscriptions',
    tone: 'neutral',
    eyebrow: 'Recurring',
    headline: `Your subscriptions cost ${fmt(SUBSCRIPTIONS_ONLY)} a month.`,
    detail: `${subscriptionCount} active subscriptions plus ${fmt(
      SUBSCRIPTION_TOTAL - SUBSCRIPTIONS_ONLY,
    )} of streaming — ${fmt(
      SUBSCRIPTION_TOTAL * 12,
    )} a year, committed before you decide anything.`,
    href: '/transactions?filter=recurring',
    action: 'Review recurring',
  });

  // 4 — goal acceleration, solved rather than asserted
  const emergency = buildGoalStatus(GOALS).find((g) => g.id === 'goal-emergency');
  if (emergency && Number.isFinite(emergency.monthsToGo)) {
    let step = 0;
    let saved = 0;
    for (let extra = 20; extra <= 400; extra += 20) {
      const months = Math.ceil(emergency.remaining / (emergency.monthlyContribution + extra));
      if (emergency.monthsToGo - months >= 2) {
        step = extra;
        saved = emergency.monthsToGo - months;
        break;
      }
    }
    if (step > 0) {
      out.push({
        id: 'insight-goal',
        tone: 'positive',
        eyebrow: 'Emergency fund',
        headline: `An extra ${fmt(step)} a month gets you there ${saved} months earlier.`,
        detail: `${fmt(emergency.remaining)} to go at ${fmt(
          emergency.monthlyContribution,
        )} a month, which lands in ${emergency.estimatedCompletion}. Your surplus this month is ${fmt(
          month.net,
        )}.`,
        href: '/goals',
        action: 'Adjust contribution',
      });
    }
  }

  // 5 — pace against the whole budget
  const budgets = buildBudgetStatus(month);
  const limitTotal = budgets.reduce((acc, b) => acc + b.limit, 0);
  const usedPct = (month.spending / limitTotal) * 100;
  const ahead = budgets.filter((b) => b.state === 'ahead' || b.state === 'over');
  out.push({
    id: 'insight-pace',
    tone: usedPct > elapsed * 100 + 10 ? 'attention' : 'neutral',
    eyebrow: 'Budget pace',
    headline: `${Math.round(usedPct)}% of your monthly budget is used with ${
      month.daysInMonth - month.daysElapsed
    } days left.`,
    detail: ahead.length
      ? `${ahead
          .map((b) => b.label)
          .slice(0, 2)
          .join(' and ')} ${
          ahead.length === 1 ? 'is' : 'are'
        } running ahead of pace. On current pace the month finishes around ${fmt(
          projectSpending(month),
        )}.`
      : `Every category is inside its limit. On current pace the month finishes around ${fmt(
          projectSpending(month),
        )}.`,
    href: '/budgets',
    action: 'Open budgets',
  });

  // 6 — the split inside the biggest variable category
  const split = foodSplit();
  if (split.total > 0) {
    const leaning = split.out >= split.groceries;
    out.push({
      id: 'insight-food-split',
      tone: 'neutral',
      eyebrow: 'Food & dining',
      headline: `${fmt(split.out)} eating out, ${fmt(split.groceries)} on groceries.`,
      detail: `${Math.round((split.out / split.total) * 100)}% of your food spend went ${
        leaning ? 'to restaurants and cafés' : 'to the shops'
      }, across ${split.count} charges. Coffee alone was ${fmt(split.coffee)}.`,
      href: '/transactions?category=food',
      action: 'See every charge',
    });
  }

  // 7 — what is already committed over a full cycle
  const committed = round(RECURRING.reduce((acc, r) => acc + r.amount, 0));
  if (committed > 0) {
    const checking = ACCOUNT_BY_ID.get(ACCOUNT_IDS.checking)!.balance;
    out.push({
      id: 'insight-committed',
      tone: 'neutral',
      eyebrow: 'Committed',
      headline: `${fmt(committed)} of next month is already spoken for.`,
      detail: `${RECURRING.length} recurring charges across rent, utilities and subscriptions — ${Math.round(
        (committed / month.income) * 100,
      )}% of a month's income. Checking covers it ${(checking / committed).toFixed(1)}× over.`,
      href: '/transactions?filter=recurring',
      action: 'See schedule',
    });
  }

  return out;
}

/** How the food budget divides between shops and restaurants. */
function foodSplit(): {
  groceries: number;
  out: number;
  coffee: number;
  total: number;
  count: number;
} {
  const shops = new Set(['Whole Foods Market', "Trader Joe's"]);
  let groceries = 0;
  let eatingOut = 0;
  let coffee = 0;
  let count = 0;
  for (const tx of CURRENT_MONTH.transactions) {
    if (tx.categoryId !== 'food' || tx.amount >= 0) continue;
    count += 1;
    const value = -tx.amount;
    if (shops.has(tx.merchant)) groceries += value;
    else eatingOut += value;
    if (tx.merchant === 'Blue Bottle Coffee') coffee += value;
  }
  return {
    groceries: round(groceries),
    out: round(eatingOut),
    coffee: round(coffee),
    total: round(groceries + eatingOut),
    count,
  };
}

/* -------------------------------------------------------- notifications */

function buildNotifications(): AppNotification[] {
  const budgets = buildBudgetStatus(CURRENT_MONTH);
  const tightest = budgets.filter((b) => !b.fixed).sort((a, b) => b.used - a.used)[0];
  const lastPay = TRANSACTIONS.find((tx) => tx.categoryId === 'income' && tx.amount > 0);
  const weekAgo = PORTFOLIO_SERIES[PORTFOLIO_SERIES.length - 8]?.v ?? PORTFOLIO.value;
  const weekPct = ((PORTFOLIO.value - weekAgo) / weekAgo) * 100;

  const items: AppNotification[] = [
    {
      id: 'note-pay',
      kind: 'money',
      title: 'Your paycheck arrived',
      body: `${fmt(lastPay?.amount ?? 0)} from ${lastPay?.merchant ?? 'Meridian Labs'} cleared into Everyday Checking.`,
      at: '2026-09-15T09:12:00Z',
      priority: 'normal',
      href: '/accounts/acc-checking',
    },
    {
      id: 'note-budget',
      kind: 'budget',
      title: `${tightest?.label ?? 'Shopping'} is close to its limit`,
      body: `${Math.round(tightest?.used ?? 0)}% used with ${CURRENT_MONTH.daysInMonth - CURRENT_MONTH.daysElapsed} days left. ${fmt(tightest?.remaining ?? 0)} remaining.`,
      at: '2026-09-15T18:40:00Z',
      priority: 'high',
      href: '/budgets',
    },
    {
      id: 'note-market',
      kind: 'market',
      title: `Your portfolio is ${weekPct >= 0 ? 'up' : 'down'} ${Math.abs(weekPct).toFixed(1)}% this week`,
      body: `Origin Invest is at ${fmt(PORTFOLIO.value)}. NVIDIA carried most of the move.`,
      at: '2026-09-14T21:05:00Z',
      priority: 'normal',
      href: '/investments',
    },
    {
      id: 'note-recurring',
      kind: 'system',
      title: 'New recurring charge detected',
      body: 'Audible has billed on the 16th for three months running. Added to your recurring list.',
      at: '2026-09-16T07:30:00Z',
      priority: 'low',
      href: '/transactions?filter=recurring',
    },
    {
      id: 'note-card',
      kind: 'money',
      title: 'Aurum Card statement is ready',
      body: `${fmt(2184.63)} due 5 October. Autopay is on, so nothing is needed from you.`,
      at: '2026-09-13T06:00:00Z',
      priority: 'normal',
      href: '/accounts/acc-card',
    },
    {
      id: 'note-security',
      kind: 'security',
      title: 'New sign-in from Brooklyn, NY',
      body: 'Safari on macOS. If this was not you, revoke the session in Security settings.',
      at: '2026-09-12T20:18:00Z',
      priority: 'high',
      href: '/settings/security',
    },
    {
      id: 'note-goal',
      kind: 'system',
      title: 'Emergency fund reached 56%',
      body: `${fmt(8400)} of ${fmt(15000)} saved. September's contribution posted on schedule.`,
      at: '2026-09-05T11:02:00Z',
      priority: 'low',
      href: '/goals',
    },
  ];

  return items.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/* ------------------------------------------------------------- selectors */

/**
 * Market movement inside a window, with contributions removed — otherwise
 * a transfer in would read as a gain.
 */
export function portfolioGain(fromISO: string): { absolute: number; percent: number } {
  const from = parseDate(fromISO).getTime();
  const start = PORTFOLIO_SERIES.find((point) => point.t >= from) ?? PORTFOLIO_SERIES[0]!;
  const end = PORTFOLIO_SERIES[PORTFOLIO_SERIES.length - 1]!;
  const contributions = TRANSACTIONS.filter(
    (tx) => tx.accountId === ACCOUNT_IDS.invest && tx.date >= fromISO,
  ).reduce((acc, tx) => acc + tx.amount, 0);
  const absolute = round(end.v - start.v - contributions);
  return { absolute, percent: start.v === 0 ? 0 : (absolute / start.v) * 100 };
}

/** Most recent posting date for an account. */
export function lastActivity(accountId: string): string | undefined {
  return TRANSACTIONS.find((tx) => tx.accountId === accountId)?.date;
}

export function transactionsForAccount(accountId: string): Transaction[] {
  return TRANSACTIONS.filter((tx) => tx.accountId === accountId);
}

/* ---------------------------------------------------------------- export */

export interface Dataset {
  anchor: string;
  anchorDate: Date;
  windowStart: string;
  days: string[];
  accounts: Account[];
  accountById: Map<string, Account>;
  accountSeries: Map<string, SeriesPoint[]>;
  transactions: Transaction[];
  netWorth: number;
  netWorthSeries: SeriesPoint[];
  portfolio: PortfolioMetrics;
  portfolioSeries: SeriesPoint[];
  currentMonth: MonthSummary;
  previousMonthToDate: MonthSummary;
  previousMonthFull: MonthSummary;
  trailingMonths: MonthSummary[];
  goals: Goal[];
  recurring: Recurring[];
  subscriptionTotal: number;
  insights: Insight[];
  notifications: AppNotification[];
  user: {
    name: string;
    email: string;
    initials: string;
    memberSince: string;
    plan: string;
  };
}

export const data: Dataset = {
  anchor: ANCHOR,
  anchorDate: ANCHOR_DATE,
  windowStart: WINDOW_START,
  days: DAYS,
  accounts: ACCOUNTS,
  accountById: ACCOUNT_BY_ID,
  accountSeries: ACCOUNT_SERIES,
  transactions: TRANSACTIONS,
  netWorth: NET_WORTH,
  netWorthSeries: NET_WORTH_SERIES,
  portfolio: PORTFOLIO,
  portfolioSeries: PORTFOLIO_SERIES,
  currentMonth: CURRENT_MONTH,
  previousMonthToDate: PREVIOUS_MTD,
  previousMonthFull: PREVIOUS_FULL,
  trailingMonths: TRAILING_MONTHS,
  goals: GOALS,
  recurring: RECURRING,
  subscriptionTotal: SUBSCRIPTION_TOTAL,
  insights: buildInsights(),
  notifications: buildNotifications(),
  user: {
    name: 'Elena Marchetti',
    email: 'elena@marchetti.studio',
    initials: 'EM',
    memberSince: '2019',
    plan: 'Origin Private',
  },
};

export { ACCOUNT_BY_ID, ACCOUNTS };
