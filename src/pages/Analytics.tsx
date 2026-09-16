import { useMemo, useState } from 'react';
import {
  CATEGORIES,
  SPENDING_CATEGORIES,
  buildFlow,
  categoryLabel,
  data,
  monthKeyOffset,
  projectSpending,
  summarizeMonth,
  type CategoryId,
  type FlowGranularity,
} from '../data';
import { currency, percent, signedCurrency } from '../lib/format';
import { useFirstLoad } from '../lib/hooks';
import { FlowChart } from '../components/charts/FlowChart';
import { CategoryBars, DonutChart } from '../components/charts/DonutChart';
import { LineChart } from '../components/charts/LineChart';
import { Amount, SectionHeading } from '../components/finance/atoms';
import { Card, Change, MonoLabel, Skeleton } from '../components/ui/primitives';
import { SegmentedControl, Select } from '../components/ui/controls';
import { EmptyState } from '../components/ui/states';

const GRANULARITY: { value: FlowGranularity; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function Analytics() {
  const loading = useFirstLoad('analytics');
  const [monthOffset, setMonthOffset] = useState('0');
  const [granularity, setGranularity] = useState<FlowGranularity>('monthly');
  const [focus, setFocus] = useState<string | null>(null);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const key = monthKeyOffset(-i);
        return { value: String(-i), label: summarizeMonth(key).label };
      }),
    [],
  );

  const month = useMemo(() => summarizeMonth(monthKeyOffset(Number(monthOffset))), [monthOffset]);
  const isCurrent = Number(monthOffset) === 0;
  const comparison = useMemo(
    () =>
      summarizeMonth(
        monthKeyOffset(Number(monthOffset) - 1),
        isCurrent ? month.daysElapsed : undefined,
      ),
    [monthOffset, isCurrent, month.daysElapsed],
  );

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

  const flow = useMemo(
    () =>
      buildFlow(
        data.transactions,
        granularity,
        granularity === 'weekly' ? 16 : granularity === 'monthly' ? 13 : 3,
      ),
    [granularity],
  );

  const flowTotals = useMemo(() => {
    const income = flow.reduce((acc, point) => acc + point.income, 0);
    const spending = flow.reduce((acc, point) => acc + point.spending, 0);
    return { income, spending, net: income - spending };
  }, [flow]);

  /** Twelve months of the focused category, or of total spending. */
  const trend = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => summarizeMonth(monthKeyOffset(-11 + i)));
    return months.map((entry) => ({
      t: new Date(`${entry.key}-01T00:00:00Z`).getTime(),
      v: focus ? (entry.byCategory[focus] ?? 0) : entry.spending,
    }));
  }, [focus]);

  /** Highest and lowest exclude the month in progress, which is partial. */
  const complete = useMemo(() => {
    const closed = trend.slice(0, -1).map((point) => point.v);
    if (closed.length === 0) return { high: 0, low: 0 };
    return { high: Math.max(...closed), low: Math.min(...closed) };
  }, [trend]);

  const merchants = useMemo(() => {
    const totals = new Map<string, { total: number; count: number; category: CategoryId }>();
    for (const tx of month.transactions) {
      if (tx.amount >= 0 || CATEGORIES[tx.categoryId].excludeFromSpending) continue;
      if (focus && tx.categoryId !== focus) continue;
      const entry = totals.get(tx.merchant) ?? { total: 0, count: 0, category: tx.categoryId };
      entry.total += -tx.amount;
      entry.count += 1;
      totals.set(tx.merchant, entry);
    }
    return [...totals.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [month, focus]);

  const spendDelta =
    comparison.spending === 0
      ? 0
      : ((month.spending - comparison.spending) / comparison.spending) * 100;

  return (
    <div className="flex flex-col gap-32">
      <SectionHeading
        eyebrow={
          isCurrent ? `Day ${month.daysElapsed} of ${month.daysInMonth}` : 'Complete month'
        }
        title="Analytics"
        action={
          <Select
            label="Month"
            value={monthOffset}
            onChange={setMonthOffset}
            options={monthOptions}
            align="end"
            className="w-[190px]"
          />
        }
      />

      {/* ------------------------------------------------------ headline */}
      <section className="grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <MonoLabel>Spent</MonoLabel>
          <p className="mt-12 font-lyon-display text-figure-lg leading-none text-cloud">
            <Amount value={month.spending} cents={false} />
          </p>
          <p className="mt-10 flex items-center gap-8">
            <Change value={spendDelta} className="text-[11px]">
              {Math.abs(spendDelta).toFixed(1)}%
            </Change>
            <span className="text-caption text-fog">
              vs {isCurrent ? 'same days last month' : comparison.label.split(' ')[0]}
            </span>
          </p>
        </Card>
        <Card>
          <MonoLabel>Earned</MonoLabel>
          <p className="mt-12 font-lyon-display text-figure-lg leading-none text-cloud">
            <Amount value={month.income} cents={false} />
          </p>
          <p className="mt-10 text-caption text-fog">
            {month.transactions.filter((tx) => tx.categoryId === 'income').length} deposits
          </p>
        </Card>
        <Card>
          <MonoLabel>Kept</MonoLabel>
          <p className="mt-12 font-lyon-display text-figure-lg leading-none text-cloud">
            <Amount value={month.net} signed cents={false} />
          </p>
          <p className="mt-10 text-caption text-fog">
            {percent(month.savingsRate, 1)} of everything earned
          </p>
        </Card>
        <Card>
          <MonoLabel>{isCurrent ? 'On pace for' : 'Daily average'}</MonoLabel>
          <p className="mt-12 font-lyon-display text-figure-lg leading-none text-cloud">
            <Amount
              value={isCurrent ? projectSpending(month) : month.spending / month.daysInMonth}
              cents={false}
            />
          </p>
          <p className="mt-10 text-caption text-fog">
            {isCurrent
              ? `${month.daysInMonth - month.daysElapsed} days remaining`
              : `across ${month.daysInMonth} days`}
          </p>
        </Card>
      </section>

      {/* -------------------------------------------------- by category */}
      <section>
        <SectionHeading
          eyebrow={month.label}
          title="Spending by category"
          action={
            focus && (
              <button
                type="button"
                onClick={() => setFocus(null)}
                className="mono-data text-[10px] text-ash underline-offset-4 transition-colors hover:text-cloud hover:underline"
              >
                Clear selection
              </button>
            )
          }
        />

        <Card className="mt-20">
          {loading ? (
            <div className="flex flex-col items-center gap-24 lg:flex-row lg:items-start">
              <Skeleton className="size-[210px] shrink-0" radius={999} />
              <div className="w-full space-y-12">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            </div>
          ) : slices.length === 0 ? (
            <EmptyState
              title="Nothing spent this month"
              body="No charges have posted in this period. As soon as they do, the split appears here."
            />
          ) : (
            <div className="flex flex-col items-center gap-32 lg:flex-row lg:items-start lg:gap-40">
              <DonutChart
                slices={slices}
                size={210}
                centreLabel="Total spend"
                centreValue={currency(month.spending, { cents: false })}
                selectedId={focus}
                onSelect={setFocus}
              />
              <div className="min-w-0 flex-1">
                <CategoryBars
                  slices={slices}
                  total={month.spending}
                  selectedId={focus}
                  onSelect={setFocus}
                  columns={2}
                />
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* -------------------------------------------------------- trend */}
      <section className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[1.4fr_1fr]">
        <Card padded={false} className="px-16 pb-20 pt-16 sm:px-20 sm:pt-20">
          <div className="mb-16 flex flex-wrap items-baseline justify-between gap-12">
            <div>
              <MonoLabel>{focus ? categoryLabel(focus as CategoryId) : 'Total spending'}</MonoLabel>
              <p className="mt-6 text-body-sm text-ash">Twelve months</p>
            </div>
            <span className="tnum text-body-sm text-fog">
              avg {currency(trend.reduce((a, b) => a + b.v, 0) / trend.length, { cents: false })}
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-[200px] w-full" radius={10} />
          ) : (
            <>
              <LineChart
                series={trend}
                label={`${focus ? categoryLabel(focus as CategoryId) : 'Total'} spending by month`}
                height={204}
                baseline={false}
              />
              <dl className="mt-20 grid grid-cols-3 gap-12 border-t border-hairline pt-16">
                <div>
                  <dt className="mono-label">Highest</dt>
                  <dd className="tnum mt-6 text-body-sm text-cloud">
                    {currency(complete.high, { cents: false })}
                  </dd>
                </div>
                <div>
                  <dt className="mono-label">Lowest</dt>
                  <dd className="tnum mt-6 text-body-sm text-cloud">
                    {currency(complete.low, { cents: false })}
                  </dd>
                </div>
                <div>
                  <dt className="mono-label">
                    {isCurrent ? 'So far this month' : 'Selected month'}
                  </dt>
                  <dd className="tnum mt-6 text-body-sm text-cloud">
                    {currency(focus ? (month.byCategory[focus] ?? 0) : month.spending, {
                      cents: false,
                    })}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </Card>

        <Card padded={false} className="flex flex-col">
          <header className="border-b border-hairline px-20 py-16">
            <MonoLabel>Top merchants</MonoLabel>
            <p className="mt-6 text-body-sm text-ash">
              {focus ? categoryLabel(focus as CategoryId) : 'All categories'} · {month.label}
            </p>
          </header>
          {merchants.length === 0 ? (
            <EmptyState
              compact
              title="No merchants here"
              body="Nothing was charged in this category during this period."
            />
          ) : (
            <ul className="divide-y divide-white/6 px-20">
              {merchants.map((merchant) => (
                <li key={merchant.name} className="flex items-center justify-between gap-12 py-12">
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm text-cloud">{merchant.name}</span>
                    <span className="mono-data mt-4 block text-[10px] text-fog">
                      {merchant.count} {merchant.count === 1 ? 'charge' : 'charges'} ·{' '}
                      {categoryLabel(merchant.category)}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-body-sm text-cloud">
                    <Amount value={merchant.total} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ---------------------------------------------------- cash flow */}
      <section>
        <SectionHeading
          eyebrow="In against out"
          title="Cash flow"
          action={
            <SegmentedControl
              label="Cash flow granularity"
              value={granularity}
              onChange={setGranularity}
              options={GRANULARITY}
            />
          }
        />

        <Card padded={false} className="mt-20 px-16 pb-20 pt-20 sm:px-20">
          <div className="mb-20 flex flex-wrap items-center gap-x-24 gap-y-10">
            <span className="flex items-center gap-8 text-body-sm text-ash">
              <span className="size-8 rounded-full bg-cyan-signal" aria-hidden="true" />
              In
              <span className="tnum text-cloud">
                {signedCurrency(flowTotals.income, { cents: false })}
              </span>
            </span>
            <span className="flex items-center gap-8 text-body-sm text-ash">
              <span className="size-8 rounded-full bg-fog" aria-hidden="true" />
              Out
              <span className="tnum text-cloud">
                {signedCurrency(-flowTotals.spending, { cents: false })}
              </span>
            </span>
            <span className="flex items-center gap-8 text-body-sm text-ash">
              Net
              <span className="tnum text-cloud">
                {signedCurrency(flowTotals.net, { cents: false })}
              </span>
            </span>
            <span className="text-caption text-fog">
              across {flow.length} {granularity === 'yearly' ? 'years' : granularity === 'monthly' ? 'months' : 'weeks'}
            </span>
          </div>

          {loading ? (
            <Skeleton className="h-[240px] w-full" radius={10} />
          ) : (
            <FlowChart points={flow} height={260} />
          )}
        </Card>
      </section>
    </div>
  );
}
