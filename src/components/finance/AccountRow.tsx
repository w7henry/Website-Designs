import { Link } from 'react-router-dom';
import type { Account, SeriesPoint } from '../../data';
import { ACCOUNT_KIND_LABEL } from '../../data';
import { cn } from '../../lib/cn';
import { currency, relativeDay } from '../../lib/format';
import { Sparkline } from '../charts/LineChart';
import { Skeleton } from '../ui/primitives';
import { IconChevronRight } from '../ui/icons';
import { Amount, MerchantMark } from './atoms';

/**
 * A full-width ledger row. Grouped lists read better than a card grid
 * once the number of accounts stops dividing neatly by three.
 */
export function AccountRow({
  account,
  series,
  lastActivity,
  today,
}: {
  account: Account;
  series: SeriesPoint[];
  lastActivity?: string;
  today: string;
}) {
  const isCredit = account.kind === 'credit';
  const utilisation =
    isCredit && account.creditLimit
      ? (Math.abs(account.balance) / account.creditLimit) * 100
      : null;

  const context = isCredit && utilisation !== null
    ? `${Math.round(utilisation)}% of ${currency(account.creditLimit!, { cents: false })} limit`
    : account.apy
      ? `${account.apy.toFixed(2)}% APY`
      : account.blurb;

  return (
    <Link
      to={`/accounts/${account.id}`}
      className={cn(
        'group flex items-center gap-12 rounded-lg px-8 py-14 sm:gap-16 sm:px-12',
        'transition-colors duration-200 ease-[var(--ease-state)] hover:bg-glass',
      )}
    >
      <MerchantMark name={account.name} size={38} />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm text-cloud">{account.name}</span>
        <span className="mono-data mt-4 block truncate text-[10px] text-fog">
          {ACCOUNT_KIND_LABEL[account.kind]} · {account.institution} ·· {account.mask}
        </span>
      </span>

      <span className="hidden min-w-0 flex-1 text-caption text-fog lg:block">
        <span className="block truncate">{context}</span>
        {lastActivity && (
          <span className="mono-data mt-4 block text-[10px] text-fog">
            Last activity {relativeDay(lastActivity, today)}
          </span>
        )}
      </span>

      <span className="hidden shrink-0 opacity-70 transition-opacity duration-200 group-hover:opacity-100 sm:block">
        <Sparkline series={series} tone={isCredit ? 'muted' : 'line'} />
      </span>

      <span className="w-[112px] shrink-0 text-right sm:w-[136px]">
        <span className="block text-body-sm text-cloud">
          <Amount value={account.balance} signed={isCredit} />
        </span>
        <span className="mono-data mt-4 block truncate text-[10px] text-fog lg:hidden">
          {context}
        </span>
      </span>

      <IconChevronRight
        size={15}
        className="shrink-0 text-fog transition-transform duration-200 ease-[var(--ease-state)] group-hover:translate-x-2 group-hover:text-cloud"
      />
    </Link>
  );
}

export function AccountRowSkeleton() {
  return (
    <div className="flex items-center gap-16 px-12 py-14">
      <Skeleton className="size-38 shrink-0" radius={8} />
      <div className="flex-1">
        <Skeleton className="h-10 w-140" />
        <Skeleton className="mt-8 h-8 w-180" />
      </div>
      <Skeleton className="h-12 w-100" />
    </div>
  );
}
