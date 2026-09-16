import type { Transaction } from '../../data';
import { categoryLabel } from '../../data';
import { cn } from '../../lib/cn';
import { formatDay, relativeDay } from '../../lib/format';
import { Badge, Skeleton } from '../ui/primitives';
import { IconRepeat } from '../ui/icons';
import { Amount, MerchantMark } from './atoms';

interface TransactionRowProps {
  transaction: Transaction;
  accountName?: string;
  onSelect: (transaction: Transaction) => void;
  /** Dense list used in side panels and the overview. */
  compact?: boolean;
  showAccount?: boolean;
  selected?: boolean;
}

export function TransactionRow({
  transaction,
  accountName,
  onSelect,
  compact = false,
  showAccount = true,
  selected = false,
}: TransactionRowProps) {
  const incoming = transaction.amount > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      aria-label={`${transaction.merchant}, ${categoryLabel(transaction.categoryId)}`}
      className={cn(
        'group flex w-full items-center gap-12 rounded-lg px-8 text-left sm:gap-16 sm:px-12',
        'transition-colors duration-200 ease-[var(--ease-state)] hover:bg-glass',
        compact ? 'py-10' : 'py-12',
        selected && 'bg-glass',
      )}
    >
      <MerchantMark
        name={transaction.merchant}
        categoryId={transaction.categoryId}
        size={compact ? 32 : 36}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-8">
          <span className="truncate text-body-sm text-cloud">{transaction.merchant}</span>
          {transaction.recurring && (
            <IconRepeat size={12} className="shrink-0 text-ash" aria-label="Recurring" />
          )}
          {transaction.pending && (
            <Badge className="shrink-0 px-6 py-1">Pending</Badge>
          )}
        </span>
        <span className="mt-4 flex items-center gap-6 truncate text-caption text-ash">
          <span className="truncate">{categoryLabel(transaction.categoryId)}</span>
          {/* The account is dropped on a phone — the category needs the room. */}
          {showAccount && accountName && (
            <>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="hidden truncate sm:inline">{accountName}</span>
            </>
          )}
        </span>
      </span>

      <span className="hidden w-52 shrink-0 text-right sm:block">
        <span className="mono-data text-[10px] text-ash">{formatDay(transaction.date)}</span>
      </span>

      <span className="w-88 shrink-0 text-right sm:w-108">
        <span
          className={cn(
            'block text-body-sm tabular-nums',
            incoming ? 'text-cloud' : 'text-ash group-hover:text-cloud',
          )}
        >
          <Amount value={transaction.amount} signed />
        </span>
      </span>
    </button>
  );
}

export function TransactionRowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-16 px-12', compact ? 'py-10' : 'py-12')}>
      <Skeleton className="size-36 shrink-0" radius={8} />
      <div className="flex-1">
        <Skeleton className="h-10 w-140" />
        <Skeleton className="mt-8 h-8 w-96" />
      </div>
      <Skeleton className="h-10 w-72" />
    </div>
  );
}

/** Groups a list by day with a sticky-feeling date rule. */
export function TransactionGroups({
  transactions,
  accountNameFor,
  onSelect,
  today,
  compact,
  showAccount = true,
  selectedId,
}: {
  transactions: Transaction[];
  accountNameFor: (id: string) => string | undefined;
  onSelect: (transaction: Transaction) => void;
  today: string;
  compact?: boolean;
  showAccount?: boolean;
  selectedId?: string | null;
}) {
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const transaction of transactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === transaction.date) last.items.push(transaction);
    else groups.push({ date: transaction.date, items: [transaction] });
  }

  return (
    <div className="flex flex-col">
      {groups.map((group) => {
        const dayTotal = group.items.reduce((acc, item) => acc + item.amount, 0);
        return (
          <section key={group.date}>
            <header className="flex items-baseline justify-between gap-16 border-b border-hairline px-8 pb-8 pt-20 sm:px-12">
              <h3 className="mono-label">{relativeDay(group.date, today)}</h3>
              <span className="mono-data text-[10px] text-ash">
                <Amount value={dayTotal} signed cents={false} />
              </span>
            </header>
            <div className="pt-4">
              {group.items.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  accountName={accountNameFor(transaction.accountId)}
                  onSelect={onSelect}
                  compact={compact}
                  showAccount={showAccount}
                  selected={selectedId === transaction.id}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
