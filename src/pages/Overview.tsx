import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CATEGORIES,
  RANGES,
  SPENDING_CATEGORIES,
  buildBudgetStatus,
  buildGoalStatus,
  data,
  deltaOf,
  lastActivity,
  portfolioGain,
  projectSpending,
  sliceRange,
  type RangeKey,
  type Transaction,
} from '../data';
import { currency, percent, signedCurrency, signedPercent } from '../lib/format';
import { useChartHeight, useFirstLoad } from '../lib/hooks';
import { useStore } from '../state/store';
import { LineChart } from '../components/charts/LineChart';
import { CategoryBars, DonutChart } from '../components/charts/DonutChart';
import { AccountCard, AccountCardSkeleton } from '../components/finance/AccountCard';
import { AddAccountCard } from '../components/finance/AddAccountCard';
import { AskOrigin } from '../components/finance/AskOrigin';
import { MetricCard, MetricCardSkeleton } from '../components/finance/MetricCard';
import { InsightCard, InsightCardSkeleton } from '../components/finance/InsightCard';
import { TransactionDetail } from '../components/finance/TransactionDetail';
import {
  TransactionRow,
  TransactionRowSkeleton,
} from '../components/finance/TransactionRow';
import { DisplayAmount, SectionHeading } from '../components/finance/atoms';
import { ButtonLink, Card, Change, MonoLabel, ProgressBar, Skeleton } from '../components/ui/primitives';
import { SegmentedControl } from '../components/ui/controls';
import { EmptyState } from '../components/ui/states';
import { IconArrowRight } from '../components/ui/icons';

export function Overview() {
  const loading = useFirstLoad('overview');
  const { goals, dismissedInsights, dismissInsight } = useStore();
  const [range, setRange] = useState<RangeKey>('1M');
  const chartHeight = useChartHeight(248, 188);
  const [selected, setSelected] = useState<Transaction | null>(null);

  const month = data.currentMonth;
  const previous = data.previousMonthToDate;

  const series = useMemo(() => sliceRange(data.netWorthSeries, range), [range]);
  const delta = useMemo(() => deltaOf(series), [series]);
  const gain = useMemo(() => portfolioGain(`${month.key}-01`), [month.key]);

  const budgets = useMemo(() => buildBudgetStatus(month), [month]);
  const goalStatus = useMemo(() => buildGoalStatus(goals), [goals]);
  const insights = data.insights.filter((insight) => !dismissedInsights.includes(insight.id));

  const recent = data.transactions.filter((tx) => tx.categoryId !== 'transfer').slice(0, 7);

  const slices = useMemo(
    () =>
      SPENDING_CATEGORIES.map((id) => ({
        id,
        label: CATEGORIES[id].label,
        value: month.byCategory[id] ?? 0,
        tint: CATEGORIES[id].tint,
      }))
        .filter((slice) => slice.value > 0)
        .sort((a, b) => b.value - a.value),
    [month],
  );

  const attention = budgets.filter((b) => b.state === 'ahead' || b.state === 'over').slice(0, 3);
  const savingsRateDelta = month.savingsRate - previous.savingsRate;
  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? '';

  return (
    <div className="flex flex-col gap-32 sm:gap-40">
      {/* ------------------------------------------------------------ hero */}
      <section className="animate-reveal">
        <div className="flex flex-wrap items-end justify-between gap-20">
          <div className="min-w-0">
            <MonoLabel>Net worth</MonoLabel>
            {loading ? (
              <Skeleton className="mt-16 h-56 w-[320px] sm:h-72" />
            ) : (
              <p className="mt-12 leading-none text-cloud">
                <DisplayAmount
                  value={data.netWorth}
                  className="text-[44px] leading-[0.95] sm:text-[64px] lg:text-display-sm"
                  centsClassName="text-[0.44em] align-baseline"
                />
              </p>
            )}

            {loading ? (
              <Skeleton className="mt-16 h-10 w-[240px]" />
            ) : (
              <p className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-6">
                <Change value={delta.absolute}>
                  {signedPercent(Math.abs(delta.percent), 2).replace(/^\+/, '')}
                </Change>
                <span className="tnum text-body-sm text-ash">
                  {signedCurrency(delta.absolute, { cents: false })}
                </span>
                <span className="text-body-sm text-fog">
                  over {rangeLabel === 'All' ? 'all time' : `the last ${rangeLabel}`}
                </span>
              </p>
            )}
          </div>

          <SegmentedControl
            label="Chart range"
            value={range}
            onChange={setRange}
            options={RANGES.map((r) => ({ value: r.key, label: r.label }))}
          />
        </div>

        <Card padded={false} className="mt-24 overflow-hidden px-16 pb-20 pt-16 sm:px-20">
          {loading ? (
            <Skeleton style={{ height: chartHeight }} className="w-full" radius={10} />
          ) : (
            <LineChart series={series} label="Net worth over time" height={chartHeight} />
          )}
        </Card>
      </section>

      {/* -------------------------------------------------------- summary */}
      <section>
        <SectionHeading
          eyebrow={`${month.label} · day ${month.daysElapsed} of ${month.daysInMonth}`}
          title="Month to date"
          action={
            <ButtonLink to="/analytics" size="sm" tone="quiet" trailingArrow>
              Analytics
            </ButtonLink>
          }
        />

        <div className="mt-20 grid grid-cols-2 gap-10 sm:gap-12 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard
                label="Income"
                value={month.income}
                signed
                change={
                  previous.income === 0
                    ? undefined
                    : ((month.income - previous.income) / previous.income) * 100
                }
                changeLabel="vs same days last month"
                footnote="Salary, consulting and interest received."
              />
              <MetricCard
                label="Spending"
                value={-month.spending}
                signed
                change={
                  previous.spending === 0
                    ? undefined
                    : ((month.spending - previous.spending) / previous.spending) * 100
                }
                changeLabel="vs same days last month"
                footnote={`On pace for ${currency(projectSpending(month), { cents: false })} by month end.`}
              />
              <MetricCard
                label="Investments"
                value={gain.absolute}
                signed
                change={gain.percent}
                changeLabel="market movement this month"
                footnote="Contributions excluded — this is market movement only."
              />
              <MetricCard
                label="Savings rate"
                value={month.net}
                display={<span className="tnum">{percent(month.savingsRate, 1)}</span>}
                change={savingsRateDelta}
changeUnit="points"
                changeLabel="points vs last month"
                footnote={`${currency(month.net, { cents: false })} kept from ${currency(month.income, { cents: false })} earned.`}
              />
            </>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------- accounts */}
      <section>
        <SectionHeading
          eyebrow={`${data.accounts.length} linked`}
          title="Accounts"
          action={
            <ButtonLink to="/accounts" size="sm" tone="quiet" trailingArrow>
              All accounts
            </ButtonLink>
          }
        />
        <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }, (_, i) => <AccountCardSkeleton key={i} />)
            : [
                ...data.accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    series={sliceRange(data.accountSeries.get(account.id) ?? [], '3M')}
                    lastActivity={lastActivity(account.id)}
                    today={data.anchor}
                  />
                )),
                <AddAccountCard key="add" />,
              ]}
        </div>
      </section>

      {/* ------------------------------------------- activity + attention */}
      <section className="grid grid-cols-1 gap-12 xl:grid-cols-[1.45fr_1fr]">
        <Card padded={false} className="flex flex-col">
          <header className="flex items-center justify-between gap-12 border-b border-hairline px-20 py-16">
            <div>
              <MonoLabel>Recent activity</MonoLabel>
              <p className="mt-6 text-body-sm text-ash">Last seven movements</p>
            </div>
            <ButtonLink to="/transactions" size="sm" tone="quiet" trailingArrow>
              See all
            </ButtonLink>
          </header>

          <div className="flex-1 px-8 py-8">
            {loading ? (
              Array.from({ length: 6 }, (_, i) => <TransactionRowSkeleton key={i} compact />)
            ) : recent.length === 0 ? (
              <EmptyState
                compact
                title="No activity yet"
                body="As soon as money moves in any linked account, it will appear here."
              />
            ) : (
              recent.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  accountName={data.accountById.get(transaction.accountId)?.name}
                  onSelect={setSelected}
                  today={data.anchor}
                  compact
                />
              ))
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-12">
          <Card padded={false} className="flex flex-col">
            <header className="flex items-center justify-between gap-12 border-b border-hairline px-20 py-16">
              <div>
                <MonoLabel>Needs attention</MonoLabel>
                <p className="mt-6 text-body-sm text-ash">
                  {attention.length === 0
                    ? 'Everything inside its limit'
                    : `${attention.length} running ahead of pace`}
                </p>
              </div>
              <ButtonLink to="/budgets" size="sm" tone="quiet" trailingArrow>
                Budgets
              </ButtonLink>
            </header>

            <div className="flex flex-col gap-16 px-20 py-18">
              {loading ? (
                Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 w-full" />)
              ) : attention.length === 0 ? (
                <EmptyState
                  compact
                  title="Nothing is off pace"
                  body="Every budget is tracking where it should be for this point in the month."
                />
              ) : (
                attention.map((budget) => (
                  <Link
                    key={budget.categoryId}
                    to="/budgets"
                    className="group block rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-baseline justify-between gap-12">
                      <span className="flex items-center gap-8 truncate text-body-sm text-cloud">
                        <span
                          aria-hidden="true"
                          className="size-8 shrink-0 rounded-full"
                          style={{ backgroundColor: CATEGORIES[budget.categoryId].tint }}
                        />
                        {budget.label}
                      </span>
                      <span className="tnum shrink-0 text-caption text-ash">
                        {currency(budget.spent, { cents: false })} /{' '}
                        {currency(budget.limit, { cents: false })}
                      </span>
                    </div>
                    <ProgressBar
                      value={budget.used}
                      tone={budget.state === 'over' ? 'attention' : 'neutral'}
                      className="mt-10"
                      label={`${budget.label} budget`}
                    />
                    <p className="mt-8 text-caption text-fog">{budget.message}</p>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {loading ? (
            <InsightCardSkeleton />
          ) : insights[0] ? (
            <InsightCard insight={insights[0]} onDismiss={dismissInsight} />
          ) : null}
        </div>
      </section>

      {/* -------------------------------------------- spending + insights */}
      <section className="grid grid-cols-1 gap-12 xl:grid-cols-[1fr_1.45fr]">
        <Card className="flex flex-col">
          <div className="flex items-start justify-between gap-12">
            <div>
              <MonoLabel>Where it went</MonoLabel>
              <p className="mt-6 text-body-sm text-ash">{month.label}</p>
            </div>
          </div>

          {loading ? (
            <Skeleton className="mx-auto mt-24 size-[190px]" radius={999} />
          ) : slices.length === 0 ? (
            <EmptyState
              compact
              title="Nothing spent yet"
              body="Once charges post this month, the split by category appears here."
            />
          ) : (
            <>
              <div className="mt-20 flex justify-center">
                <DonutChart
                  slices={slices}
                  size={190}
                  thickness={20}
                  centreLabel="Total spend"
                  centreValue={currency(month.spending, { cents: false })}
                />
              </div>
              <div className="mt-20">
                <CategoryBars slices={slices} total={month.spending} limit={4} />
              </div>
              <Link
                to="/analytics"
                className="mt-14 inline-flex items-center gap-6 self-start text-body-sm text-cloud transition-colors hover:text-pure"
              >
                Full breakdown
                <IconArrowRight size={14} />
              </Link>
            </>
          )}
        </Card>

        <div className="flex flex-col gap-12">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
            {loading
              ? Array.from({ length: 2 }, (_, i) => <InsightCardSkeleton key={i} />)
              : insights
                  .slice(1, 3)
                  .map((insight) => (
                    <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
                  ))}
          </div>

          <Card padded={false} className="flex flex-col">
            <header className="flex items-center justify-between gap-12 border-b border-hairline px-20 py-16">
              <div>
                <MonoLabel>Goals</MonoLabel>
                <p className="mt-6 text-body-sm text-ash">{goalStatus.length} in progress</p>
              </div>
              <ButtonLink to="/goals" size="sm" tone="quiet" trailingArrow>
                All goals
              </ButtonLink>
            </header>
            <ul className="divide-y divide-white/6 px-20">
              {goalStatus.slice(0, 3).map((goal) => (
                <li key={goal.id} className="py-14">
                  <div className="flex items-baseline justify-between gap-12">
                    <span className="truncate text-body-sm text-cloud">{goal.name}</span>
                    <span className="tnum shrink-0 text-caption text-ash">
                      {currency(goal.current, { cents: false })} /{' '}
                      {currency(goal.target, { cents: false })}
                    </span>
                  </div>
                  <ProgressBar value={goal.progress} className="mt-10" label={goal.name} />
                  <p className="mono-data mt-8 text-[10px] text-fog">
                    {goal.progress.toFixed(0)}% · on track for {goal.estimatedCompletion}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------ ai prompt */}
      <Card surface="raised" className="flex flex-col gap-20 lg:flex-row lg:items-center lg:gap-40">
        <div className="min-w-0 lg:max-w-[320px]">
          <p className="font-lyon-display text-title leading-snug text-cloud">
            Ask anything about <em className="italic">your</em> money.
          </p>
          <p className="mt-8 text-body-sm leading-relaxed text-ash">
            Origin answers from your own ledger — the same figures behind every number on this
            page.
          </p>
        </div>
        <AskOrigin className="flex-1" compact={false} />
      </Card>

      <TransactionDetail transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
