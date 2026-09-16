import { useMemo, useState } from 'react';
import {
  RANGES,
  data,
  deltaOf,
  sliceRange,
  type PortfolioMetrics,
  type RangeKey,
} from '../data';
import { currency, number, percent, signedCurrency, signedPercent } from '../lib/format';
import { useChartHeight, useFirstLoad } from '../lib/hooks';
import { LineChart } from '../components/charts/LineChart';
import { DonutChart } from '../components/charts/DonutChart';
import { HoldingRow, HoldingRowSkeleton } from '../components/finance/HoldingRow';
import { Amount, DisplayAmount, KeyValue } from '../components/finance/atoms';
import { ButtonLink, Card, Change, MonoLabel, Skeleton } from '../components/ui/primitives';
import { Modal } from '../components/ui/overlays';
import { SegmentedControl } from '../components/ui/controls';

type Holding = PortfolioMetrics['holdings'][number];

export function Investments() {
  const loading = useFirstLoad('investments');
  const [range, setRange] = useState<RangeKey>('6M');
  const [selected, setSelected] = useState<Holding | null>(null);
  const chartHeight = useChartHeight(240, 190);

  const portfolio = data.portfolio;
  const series = useMemo(() => sliceRange(data.portfolioSeries, range), [range]);
  const delta = useMemo(() => deltaOf(series), [series]);
  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? '';

  const allocation = useMemo(() => {
    const bySector = new Map<string, number>();
    for (const holding of portfolio.holdings) {
      bySector.set(holding.sector, (bySector.get(holding.sector) ?? 0) + holding.value);
    }
    const tints = [
      'var(--color-iris-gleam)',
      'var(--color-cyan-signal)',
      'var(--color-orchid-bloom)',
      'var(--color-periwinkle)',
      'var(--color-pale-iris)',
      'var(--color-deep-iris)',
      'var(--color-steel)',
    ];
    return [...bySector.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([sector, value], index) => ({
        id: sector,
        label: sector,
        value,
        tint: tints[index % tints.length]!,
      }));
  }, [portfolio.holdings]);

  const contributions = useMemo(
    () =>
      data.transactions
        .filter((tx) => tx.accountId === 'acc-invest' && tx.amount > 0)
        .slice(0, 12)
        .reduce((acc, tx) => acc + tx.amount, 0),
    [],
  );

  const bestAndWorst = useMemo(() => {
    const ranked = portfolio.holdings.filter((h) => h.kind !== 'cash');
    return {
      best: [...ranked].sort((a, b) => b.returnPercent - a.returnPercent)[0],
      worst: [...ranked].sort((a, b) => a.dayChangePercent - b.dayChangePercent)[0],
    };
  }, [portfolio.holdings]);

  return (
    <div className="flex flex-col gap-32">
      {/* ------------------------------------------------------ headline */}
      <section className="animate-reveal flex flex-wrap items-end justify-between gap-20">
        <div className="min-w-0">
          <MonoLabel>Portfolio value</MonoLabel>
          {loading ? (
            <Skeleton className="mt-16 h-48 w-[300px]" />
          ) : (
            <p className="mt-12 leading-none text-cloud">
              <DisplayAmount
                value={portfolio.value}
                className="text-[40px] leading-[0.95] sm:text-[56px] lg:text-[64px]"
                centsClassName="text-[0.44em]"
              />
            </p>
          )}
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
          <LineChart series={series} label="Portfolio value over time" height={chartHeight} />
        )}
      </Card>

      {/* -------------------------------------------------------- stats */}
      <section className="grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <MonoLabel>Total return</MonoLabel>
          <p className="mt-12 font-lyon-display text-figure-lg leading-none text-cloud">
            <Amount value={portfolio.totalReturn} signed cents={false} />
          </p>
          <p className="mt-10 text-caption text-fog">
            Against {currency(portfolio.costBasis, { cents: false })} invested
          </p>
        </Card>
        <Card>
          <MonoLabel>Return</MonoLabel>
          <p className="tnum mt-12 font-lyon-display text-figure-lg leading-none text-cloud">
            {signedPercent(portfolio.returnPercent, 2)}
          </p>
          <p className="mt-10 text-caption text-fog">Since inception, money weighted</p>
        </Card>
        <Card>
          <MonoLabel>Today</MonoLabel>
          <p className="mt-12 font-lyon-display text-figure-lg leading-none text-cloud">
            <Amount value={portfolio.dayChange} signed cents={false} />
          </p>
          <p className="mt-10 flex items-center gap-8">
            <Change value={portfolio.dayChange} className="text-[11px]">
              {Math.abs(portfolio.dayChangePercent).toFixed(2)}%
            </Change>
            <span className="text-caption text-fog">market close</span>
          </p>
        </Card>
        <Card>
          <MonoLabel>Contributed</MonoLabel>
          <p className="mt-12 font-lyon-display text-figure-lg leading-none text-cloud">
            <Amount value={contributions} cents={false} />
          </p>
          <p className="mt-10 text-caption text-fog">Last 12 transfers, $2,000 on the 3rd</p>
        </Card>
      </section>

      {/* ----------------------------------------------------- holdings */}
      <section className="grid grid-cols-1 items-start gap-12 xl:grid-cols-[1.6fr_1fr]">
        <Card padded={false} className="flex flex-col px-8 pb-12 pt-4 sm:px-12">
          <header className="flex items-center justify-between gap-12 border-b border-hairline px-8 py-16 sm:px-12">
            <div>
              <MonoLabel>Holdings</MonoLabel>
              <p className="mt-6 text-body-sm text-ash">
                {portfolio.holdings.length} positions
              </p>
            </div>
            <div className="mono-data hidden shrink-0 gap-16 text-[9px] text-fog sm:grid sm:grid-cols-[88px_88px_88px]">
              <span className="text-right">Price</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Value</span>
            </div>
          </header>

          <div className="pt-4">
            {loading
              ? Array.from({ length: 6 }, (_, i) => <HoldingRowSkeleton key={i} />)
              : portfolio.holdings.map((holding) => (
                  <HoldingRow
                    key={holding.id}
                    holding={holding}
                    onSelect={setSelected}
                    selected={selected?.id === holding.id}
                  />
                ))}
          </div>

          <footer className="mt-8 flex items-center justify-between gap-12 border-t border-hairline px-8 pt-14 sm:px-12">
            <span className="mono-label">Total</span>
            <span className="tnum text-body-sm text-cloud">
              <Amount value={portfolio.value} />
            </span>
          </footer>
        </Card>

        <div className="flex flex-col gap-12">
          <Card className="flex flex-col items-center">
            <MonoLabel className="self-start">Allocation</MonoLabel>
            {loading ? (
              <Skeleton className="mt-20 size-[180px]" radius={999} />
            ) : (
              <>
                <div className="mt-16">
                  <DonutChart
                    slices={allocation}
                    size={180}
                    thickness={18}
                    centreLabel="Positions"
                    centreValue={String(portfolio.holdings.length)}
                  />
                </div>
                <ul className="mt-20 w-full space-y-10">
                  {allocation.map((slice) => (
                    <li key={slice.id} className="flex items-center justify-between gap-12">
                      <span className="flex min-w-0 items-center gap-8">
                        <span
                          aria-hidden="true"
                          className="size-8 shrink-0 rounded-full"
                          style={{ backgroundColor: slice.tint }}
                        />
                        <span className="truncate text-body-sm text-ash">{slice.label}</span>
                      </span>
                      <span className="mono-data shrink-0 text-[10px] text-fog">
                        {percent((slice.value / portfolio.value) * 100, 1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card>
            <MonoLabel className="mb-12">Movers</MonoLabel>
            {bestAndWorst.best && (
              <div className="flex items-center justify-between gap-12 py-8">
                <span className="min-w-0">
                  <span className="mono-data block text-[11px] text-cloud">
                    {bestAndWorst.best.ticker}
                  </span>
                  <span className="mt-4 block truncate text-caption text-fog">
                    Best total return
                  </span>
                </span>
                <Change value={bestAndWorst.best.totalReturn} className="text-[11px]">
                  {signedPercent(Math.abs(bestAndWorst.best.returnPercent), 1).replace(/^\+/, '')}
                </Change>
              </div>
            )}
            {bestAndWorst.worst && (
              <div className="flex items-center justify-between gap-12 border-t border-hairline py-8 pt-12">
                <span className="min-w-0">
                  <span className="mono-data block text-[11px] text-cloud">
                    {bestAndWorst.worst.ticker}
                  </span>
                  <span className="mt-4 block truncate text-caption text-fog">Weakest today</span>
                </span>
                <Change value={bestAndWorst.worst.dayChange} className="text-[11px]">
                  {signedPercent(Math.abs(bestAndWorst.worst.dayChangePercent), 2).replace(/^\+/, '')}
                </Change>
              </div>
            )}
            <ButtonLink
              to="/accounts/acc-invest"
              size="sm"
              tone="ghost"
              className="mt-16"
              trailingArrow
              block
            >
              Account activity
            </ButtonLink>
          </Card>
        </div>
      </section>

      <Card surface="raised" className="flex flex-col gap-12">
        <MonoLabel>A note on these figures</MonoLabel>
        <p className="max-w-[720px] text-body-sm leading-relaxed text-ash">
          Prices reflect the last close. Return is calculated against your average cost per share,
          so contributions never read as gains. Cash held for settlement is shown as a position so
          that holdings always reconcile to the account balance.
        </p>
      </Card>

      {/* -------------------------------------------------- holding detail */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={selected ? `${selected.ticker} · ${selected.sector}` : undefined}
        size="sm"
      >
        {selected && (
          <>
            <p className="font-lyon-display text-heading-lg leading-none text-cloud">
              <Amount value={selected.value} />
            </p>
            <p className="mt-10 flex items-center gap-10">
              <Change value={selected.totalReturn}>
                {signedPercent(Math.abs(selected.returnPercent), 2).replace(/^\+/, '')}
              </Change>
              <span className="tnum text-body-sm text-ash">
                {signedCurrency(selected.totalReturn)} total
              </span>
            </p>

            <dl className="mt-20 divide-y divide-white/6">
              <KeyValue label="Shares">
                {number(selected.shares, selected.shares % 1 === 0 ? 0 : 2)}
              </KeyValue>
              <KeyValue label="Last price">{currency(selected.price)}</KeyValue>
              <KeyValue label="Previous close">{currency(selected.prevClose)}</KeyValue>
              <KeyValue label="Average cost">{currency(selected.costPerShare)}</KeyValue>
              <KeyValue label="Cost basis">
                {currency(selected.shares * selected.costPerShare)}
              </KeyValue>
              <KeyValue label="Day change">
                {signedCurrency(selected.dayChange)} (
                {signedPercent(selected.dayChangePercent, 2)})
              </KeyValue>
              <KeyValue label="Portfolio weight">{percent(selected.weight, 1)}</KeyValue>
            </dl>
          </>
        )}
      </Modal>
    </div>
  );
}
