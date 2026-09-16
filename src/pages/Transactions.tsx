import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ACCOUNT_KIND_LABEL,
  CATEGORIES,
  CATEGORY_OPTIONS,
  categoryLabel,
  data,
  type CategoryId,
  type Transaction,
} from '../data';
import { currency, parseDate, toISO } from '../lib/format';
import { useFirstLoad } from '../lib/hooks';
import { useStore } from '../state/store';
import { TransactionDetail } from '../components/finance/TransactionDetail';
import {
  TransactionGroups,
  TransactionRowSkeleton,
} from '../components/finance/TransactionRow';
import { SectionHeading } from '../components/finance/atoms';
import { Button, Card, MonoLabel } from '../components/ui/primitives';
import { SearchInput, Select, SegmentedControl } from '../components/ui/controls';
import { EmptyState } from '../components/ui/states';
import { IconDownload, IconFilter, IconSort } from '../components/ui/icons';

type FlowFilter = 'all' | 'out' | 'in' | 'recurring';
type SortKey = 'recent' | 'largest' | 'smallest';
type RangeFilter = '30' | '90' | '365' | 'all';

const PAGE_SIZE = 40;

const FLOW_OPTIONS: { value: FlowFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'out', label: 'Out' },
  { value: 'in', label: 'In' },
  { value: 'recurring', label: 'Recurring' },
];

const RANGE_OPTIONS: { value: RangeFilter; label: string }[] = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'largest', label: 'Largest amount' },
  { value: 'smallest', label: 'Smallest amount' },
];

export function Transactions() {
  const loading = useFirstLoad('transactions');
  const [params, setParams] = useSearchParams();
  const { transactions } = useStore();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState<CategoryId | 'all'>(
    (params.get('category') as CategoryId) ?? 'all',
  );
  const [account, setAccount] = useState<string>(params.get('account') ?? 'all');
  const [flow, setFlow] = useState<FlowFilter>((params.get('filter') as FlowFilter) ?? 'all');
  const [range, setRange] = useState<RangeFilter>('90');
  const [sort, setSort] = useState<SortKey>('recent');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Transaction | null>(null);

  /** Deep links from search, insights and the command menu land here. */
  useEffect(() => {
    const q = params.get('q');
    const c = params.get('category');
    const f = params.get('filter');
    const a = params.get('account');
    if (q !== null) setQuery(q);
    if (c !== null) setCategory(c as CategoryId);
    if (f !== null) setFlow(f as FlowFilter);
    if (a !== null) setAccount(a);
    if (q || c || f || a) setRange('all');
  }, [params]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const cutoff =
      range === 'all'
        ? null
        : toISO(new Date(parseDate(data.anchor).getTime() - Number(range) * 86_400_000));

    const filtered = transactions.filter((tx) => {
      if (cutoff && tx.date < cutoff) return false;
      if (category !== 'all' && tx.categoryId !== category) return false;
      if (account !== 'all' && tx.accountId !== account) return false;
      if (flow === 'out' && tx.amount >= 0) return false;
      if (flow === 'in' && tx.amount <= 0) return false;
      if (flow === 'recurring' && !tx.recurring) return false;
      if (needle) {
        const haystack = `${tx.merchant} ${categoryLabel(tx.categoryId)} ${
          data.accountById.get(tx.accountId)?.name ?? ''
        }`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    if (sort === 'largest') return [...filtered].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    if (sort === 'smallest') return [...filtered].sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    return filtered;
  }, [transactions, query, category, account, flow, range, sort]);

  useEffect(() => setVisible(PAGE_SIZE), [query, category, account, flow, range, sort]);

  const totals = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const tx of results) {
      if (tx.categoryId === 'transfer') continue;
      if (tx.amount > 0) inflow += tx.amount;
      else outflow += -tx.amount;
    }
    return { inflow, outflow };
  }, [results]);

  const filtersActive =
    query.trim() !== '' || category !== 'all' || account !== 'all' || flow !== 'all' || range !== '90';

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setAccount('all');
    setFlow('all');
    setRange('90');
    setSort('recent');
    setParams({}, { replace: true });
  };

  const exportCsv = () => {
    const header = ['Date', 'Merchant', 'Category', 'Account', 'Amount', 'Status'];
    const rows = results.map((tx) => [
      tx.date,
      `"${tx.merchant.replace(/"/g, '""')}"`,
      categoryLabel(tx.categoryId),
      data.accountById.get(tx.accountId)?.name ?? '',
      tx.amount.toFixed(2),
      tx.pending ? 'Pending' : 'Settled',
    ]);
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `origin-transactions-${data.anchor}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-24">
      <SectionHeading
        eyebrow={`${data.transactions.length.toLocaleString('en-US')} on record`}
        title="Transactions"
        action={
          <Button size="sm" tone="ghost" onClick={exportCsv} disabled={results.length === 0}>
            <IconDownload size={14} />
            Export CSV
          </Button>
        }
      />

      {/* ------------------------------------------------------- filters */}
      <Card padded={false} className="p-16 sm:p-20">
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search merchants, categories, accounts"
              className="lg:max-w-[380px] lg:flex-1"
            />
            <SegmentedControl
              label="Flow"
              value={flow}
              onChange={setFlow}
              options={FLOW_OPTIONS}
              className="self-start"
            />
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { value: 'all' as const, label: 'All categories' },
                ...CATEGORY_OPTIONS,
                { value: 'transfer' as const, label: 'Transfers', tint: CATEGORIES.transfer.tint },
                { value: 'income' as const, label: 'Income', tint: CATEGORIES.income.tint },
              ]}
            />
            <Select
              label="Account"
              value={account}
              onChange={setAccount}
              options={[
                { value: 'all', label: 'All accounts' },
                ...data.accounts.map((a) => ({
                  value: a.id,
                  label: a.name,
                  meta: ACCOUNT_KIND_LABEL[a.kind],
                })),
              ]}
            />
            <Select label="Period" value={range} onChange={setRange} options={RANGE_OPTIONS} />
            <Select label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-12 border-t border-hairline pt-12">
            <div className="flex flex-wrap items-center gap-x-16 gap-y-6">
              <span className="mono-data text-[10px] text-fog">
                <IconFilter size={12} className="mr-4 inline align-[-2px]" />
                {results.length.toLocaleString('en-US')} results
              </span>
              <span className="mono-data text-[10px] text-fog">
                In <span className="text-cloud">+{currency(totals.inflow, { cents: false })}</span>
              </span>
              <span className="mono-data text-[10px] text-fog">
                Out <span className="text-cloud">&minus;{currency(totals.outflow, { cents: false })}</span>
              </span>
              <span className="mono-data text-[10px] text-fog">
                <IconSort size={12} className="mr-4 inline align-[-2px]" />
                {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              </span>
            </div>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="mono-data text-[10px] text-ash underline-offset-4 transition-colors hover:text-cloud hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* --------------------------------------------------------- list */}
      <Card padded={false} className="px-8 pb-12 pt-4 sm:px-12">
        {loading ? (
          <div className="py-8">
            {Array.from({ length: 10 }, (_, i) => (
              <TransactionRowSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters"
            body={
              query.trim()
                ? `No transactions mention “${query.trim()}” in this period. Try widening the date range or clearing a filter.`
                : 'Nothing was recorded in this period with those filters applied.'
            }
            action={
              filtersActive && (
                <Button tone="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <>
            <TransactionGroups
              transactions={results.slice(0, visible)}
              accountNameFor={(id) => data.accountById.get(id)?.name}
              onSelect={setSelected}
              today={data.anchor}
              selectedId={selected?.id}
            />
            {visible < results.length && (
              <div className="flex flex-col items-center gap-8 px-8 pt-20">
                <Button tone="ghost" onClick={() => setVisible((prev) => prev + PAGE_SIZE)}>
                  Show {Math.min(PAGE_SIZE, results.length - visible)} more
                </Button>
                <MonoLabel>
                  {visible} of {results.length}
                </MonoLabel>
              </div>
            )}
          </>
        )}
      </Card>

      <TransactionDetail transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
