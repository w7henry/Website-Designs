import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ACCOUNT_KIND_LABEL,
  RANGES,
  data,
  deltaOf,
  sliceRange,
  summarizeMonth,
  transactionsForAccount,
  type RangeKey,
  type Transaction,
} from '../data';
import { currency, formatDayYear, percent, signedCurrency, signedPercent } from '../lib/format';
import { useChartHeight, useFirstLoad } from '../lib/hooks';
import { LineChart } from '../components/charts/LineChart';
import { TransactionDetail } from '../components/finance/TransactionDetail';
import {
  TransactionGroups,
  TransactionRowSkeleton,
} from '../components/finance/TransactionRow';
import { Amount, DisplayAmount, KeyValue } from '../components/finance/atoms';
import { Button, ButtonLink, Card, Change, MonoLabel, ProgressBar, Skeleton } from '../components/ui/primitives';
import { SegmentedControl } from '../components/ui/controls';
import { EmptyState } from '../components/ui/states';
import { IconChevronLeft } from '../components/ui/icons';

export function AccountDetail() {
  const { accountId = '' } = useParams();
  const loading = useFirstLoad(`account-${accountId}`);
  const [range, setRange] = useState<RangeKey>('3M');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const chartHeight = useChartHeight(224, 180);

  const account = data.accountById.get(accountId);
  const transactions = useMemo(
    () => (account ? transactionsForAccount(account.id) : []),
    [account],
  );

  const series = useMemo(
    () => sliceRange(data.accountSeries.get(accountId) ?? [], range),
    [accountId, range],
  );
  const delta = useMemo(() => deltaOf(series), [series]);

  const monthFlow = useMemo(() => {
    const month = data.anchor.slice(0, 7);
    let inflow = 0;
    let outflow = 0;
    for (const tx of transactions) {
      if (!tx.date.startsWith(month)) continue;
      if (tx.amount > 0) inflow += tx.amount;
      else outflow += -tx.amount;
    }
    return { inflow, outflow };
  }, [transactions]);

  const averageMonthlyOut = useMemo(() => {
    const months = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.amount >= 0) continue;
      const key = tx.date.slice(0, 7);
      months.set(key, (months.get(key) ?? 0) + -tx.amount);
    }
    const values = [...months.values()];
    return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
  }, [transactions]);

  if (!account) {
    return (
      <EmptyState
        title="That account is not here"
        body="The link may be stale, or the account was unlinked. Everything else is where you left it."
        action={
          <ButtonLink to="/accounts" tone="ghost" size="sm">
            Back to accounts
          </ButtonLink>
        }
      />
    );
  }

  const isCredit = account.kind === 'credit';
  const isInvestment = account.kind === 'investment';
  const utilisation =
    isCredit && account.creditLimit ? (Math.abs(account.balance) / account.creditLimit) * 100 : null;
  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? '';
  const month = summarizeMonth(data.anchor.slice(0, 7));

  return (
    <div className="flex flex-col gap-24">
      <Link
        to="/accounts"
        className="inline-flex items-center gap-6 self-start text-caption text-ash transition-colors duration-200 hover:text-cloud"
      >
        <IconChevronLeft size={13} />
        All accounts
      </Link>

      {/* ---------------------------------------------------------- head */}
      <section className="animate-reveal flex flex-wrap items-end justify-between gap-20">
        <div className="min-w-0">
          <MonoLabel>
            {ACCOUNT_KIND_LABEL[account.kind]} · {account.institution} ·· {account.mask}
          </MonoLabel>
          <h1 className="mt-10 font-lyon-display text-heading-lg leading-none text-cloud">
            {account.name}
          </h1>
          {loading ? (
            <Skeleton className="mt-18 h-40 w-[260px]" />
          ) : (
            <p className="mt-18 leading-none">
              <DisplayAmount
                value={account.balance}
                signed={isCredit}
                className="text-[36px] leading-none text-cloud sm:text-[44px]"
                centsClassName="text-[0.46em]"
              />
            </p>
          )}
          <p className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
            <Change value={delta.absolute}>
              {signedPercent(Math.abs(delta.percent), 2).replace(/^\+/, '')}
            </Change>
            <span className="tnum text-body-sm text-ash">
              {signedCurrency(delta.absolute, { cents: false })}
            </span>
            <span className="text-body-sm text-ash">
              over {rangeLabel === 'All' ? 'all time' : `the last ${rangeLabel}`}
            </span>
          </p>
        </div>

        <SegmentedControl
          label="Chart range"
          value={range}
          onChange={setRange}
          options={RANGES.map((r) => ({ value: r.key, label: r.label }))}
        />
      </section>

      <Card padded={false} className="overflow-hidden px-16 pb-20 pt-16 sm:px-20">
        {loading ? (
          <Skeleton style={{ height: chartHeight }} className="w-full" radius={10} />
        ) : (
          <LineChart
            series={series}
            label={`${account.name} balance over time`}
            height={chartHeight}
          />
        )}
      </Card>

      {/* ------------------------------------------------------- metrics */}
      <section className="grid grid-cols-2 gap-10 sm:gap-12 xl:grid-cols-4">
        <Card>
          <MonoLabel>Money in</MonoLabel>
          <p className="tnum mt-12 font-lyon-display text-figure leading-none text-cloud">
            <Amount value={monthFlow.inflow} signed cents={false} />
          </p>
          <p className="mt-8 text-caption text-ash">{month.label} to date</p>
        </Card>
        <Card>
          <MonoLabel>Money out</MonoLabel>
          <p className="tnum mt-12 font-lyon-display text-figure leading-none text-cloud">
            <Amount value={-monthFlow.outflow} signed cents={false} />
          </p>
          <p className="mt-8 text-caption text-ash">{month.label} to date</p>
        </Card>
        <Card>
          <MonoLabel>Net this month</MonoLabel>
          <p className="tnum mt-12 font-lyon-display text-figure leading-none text-cloud">
            <Amount value={monthFlow.inflow - monthFlow.outflow} signed cents={false} />
          </p>
          <p className="mt-8 text-caption text-ash">
            Average out {currency(averageMonthlyOut, { cents: false })} a month
          </p>
        </Card>
        <Card>
          <MonoLabel>{isCredit ? 'Utilisation' : isInvestment ? 'Total return' : 'Rate'}</MonoLabel>
          <p className="tnum mt-12 font-lyon-display text-figure leading-none text-cloud">
            {isCredit && utilisation !== null
              ? percent(utilisation, 1)
              : isInvestment
                ? signedPercent(data.portfolio.returnPercent, 2)
                : account.apy
                  ? percent(account.apy, 2)
                  : '—'}
          </p>
          {isCredit && utilisation !== null ? (
            <>
              <ProgressBar
                value={utilisation}
                tone={utilisation > 30 ? 'attention' : 'muted'}
                className="mt-12"
                label="Credit utilisation"
              />
              <p className="mt-8 text-caption text-ash">
                {currency(Math.abs(account.balance), { cents: false })} of{' '}
                {currency(account.creditLimit!, { cents: false })}
              </p>
            </>
          ) : (
            <p className="mt-8 text-caption text-ash">
              {isInvestment
                ? `${signedCurrency(data.portfolio.totalReturn, { cents: false })} since inception`
                : account.apy
                  ? 'Annual percentage yield'
                  : account.blurb}
            </p>
          )}
        </Card>
      </section>

      {/* ------------------------------------------- activity + details */}
      <section className="grid grid-cols-1 gap-12 xl:grid-cols-[1.5fr_1fr]">
        <Card padded={false} className="flex flex-col px-8 pb-12 pt-4 sm:px-12">
          <header className="flex items-center justify-between gap-12 border-b border-hairline px-8 py-16 sm:px-8">
            <div>
              <MonoLabel>Activity</MonoLabel>
              <p className="mt-6 text-body-sm text-ash">{transactions.length} movements on record</p>
            </div>
            <ButtonLink
              to={`/transactions?account=${account.id}`}
              size="sm"
              tone="quiet"
              trailingArrow
            >
              Filter all
            </ButtonLink>
          </header>

          {loading ? (
            <div className="py-8">
              {Array.from({ length: 8 }, (_, i) => (
                <TransactionRowSkeleton key={i} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="Nothing has moved here yet"
              body="When the first payment or deposit posts to this account, it will show up here."
            />
          ) : (
            <TransactionGroups
              transactions={transactions.slice(0, 16)}
              accountNameFor={() => undefined}
              onSelect={setSelected}
              today={data.anchor}
              showAccount={false}
              selectedId={selected?.id}
            />
          )}
        </Card>

        <div className="flex flex-col gap-12">
          <Card>
            <MonoLabel className="mb-6">Account information</MonoLabel>
            <dl className="divide-y divide-white/6">
              <KeyValue label="Institution">{account.institution}</KeyValue>
              <KeyValue label="Type">{ACCOUNT_KIND_LABEL[account.kind]}</KeyValue>
              <KeyValue label="Number">···· ···· {account.mask}</KeyValue>
              <KeyValue label="Opened">{formatDayYear(account.openedAt)}</KeyValue>
              {account.apy !== undefined && <KeyValue label="APY">{percent(account.apy, 2)}</KeyValue>}
              {account.apr !== undefined && <KeyValue label="APR">{percent(account.apr, 2)}</KeyValue>}
              {account.creditLimit !== undefined && (
                <KeyValue label="Limit">{currency(account.creditLimit, { cents: false })}</KeyValue>
              )}
              <KeyValue label="Status">Connected · read only</KeyValue>
            </dl>
            <p className="mt-16 text-caption leading-relaxed text-ash">{account.blurb}</p>
          </Card>

          {isInvestment && (
            <Card>
              <MonoLabel className="mb-12">Portfolio</MonoLabel>
              <p className="text-body-sm leading-relaxed text-ash">
                {data.portfolio.holdings.length} positions, {signedCurrency(data.portfolio.dayChange)}{' '}
                today.
              </p>
              <ButtonLink to="/investments" size="sm" tone="ghost" className="mt-16" trailingArrow>
                Open portfolio
              </ButtonLink>
            </Card>
          )}

          {isCredit && (
            <Card>
              <MonoLabel className="mb-12">Statement</MonoLabel>
              <dl className="divide-y divide-white/6">
                <KeyValue label="Closing balance">
                  <Amount value={Math.abs(account.balance)} />
                </KeyValue>
                <KeyValue label="Due">5 October 2026</KeyValue>
                <KeyValue label="Autopay">On · statement balance</KeyValue>
              </dl>
              <Button tone="ghost" size="sm" className="mt-16" block>
                Manage autopay
              </Button>
            </Card>
          )}
        </div>
      </section>

      <TransactionDetail transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
