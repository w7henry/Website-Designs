import { Link } from 'react-router-dom';
import type { Account, SeriesPoint } from '../../data';
import { ACCOUNT_KIND_LABEL } from '../../data';
import { cn } from '../../lib/cn';
import { currency, relativeDay } from '../../lib/format';
import { Sparkline } from '../charts/LineChart';
import { Card, Skeleton } from '../ui/primitives';
import { IconChevronRight } from '../ui/icons';
import { Amount } from './atoms';

interface AccountCardProps {
  account: Account;
  series: SeriesPoint[];
  lastActivity?: string;
  today: string;
  className?: string;
}

export function AccountCard({ account, series, lastActivity, today, className }: AccountCardProps) {
  const isCredit = account.kind === 'credit';
  const utilisation =
    isCredit && account.creditLimit
      ? (Math.abs(account.balance) / account.creditLimit) * 100
      : null;

  return (
    <Link
      to={`/accounts/${account.id}`}
      className={cn(
        'group block rounded-2xl focus-visible:outline-offset-4',
        className,
      )}
    >
      <Card
        interactive
        className="flex h-full flex-col justify-between gap-20 transition-transform duration-200 ease-[var(--ease-state)]"
      >
        <div className="flex items-start justify-between gap-12">
          <div className="min-w-0">
            <p className="truncate text-body-sm text-cloud">{account.name}</p>
            <p className="mono-data mt-6 text-[10px] text-ash">
              {ACCOUNT_KIND_LABEL[account.kind]} · {account.institution} ·· {account.mask}
            </p>
          </div>
          <IconChevronRight
            size={15}
            className="mt-2 shrink-0 text-ash transition-transform duration-200 ease-[var(--ease-state)] group-hover:translate-x-2 group-hover:text-cloud"
          />
        </div>

        <div className="flex items-end justify-between gap-16">
          <div className="min-w-0">
            <p className="font-lyon-display text-title leading-none text-cloud sm:text-[26px]">
              <Amount value={account.balance} signed={isCredit} />
            </p>
            <p className="mt-8 truncate text-caption text-ash">
              {isCredit && utilisation !== null
                ? `${Math.round(utilisation)}% of ${currency(account.creditLimit!, { cents: false })} limit`
                : account.apy
                  ? `${account.apy.toFixed(2)}% APY`
                  : account.blurb}
            </p>
          </div>
          <div className="shrink-0 pb-2 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
            <Sparkline series={series} tone={isCredit ? 'muted' : 'line'} />
          </div>
        </div>

        {lastActivity && (
          <p className="mono-data border-t border-hairline pt-12 text-[10px] text-ash">
            Last activity {relativeDay(lastActivity, today)}
          </p>
        )}
      </Card>
    </Link>
  );
}

export function AccountCardSkeleton() {
  return (
    <Card className="flex h-full flex-col justify-between gap-20">
      <div>
        <Skeleton className="h-10 w-128" />
        <Skeleton className="mt-10 h-8 w-160" />
      </div>
      <div className="flex items-end justify-between">
        <Skeleton className="h-24 w-110" />
        <Skeleton className="h-24 w-88" />
      </div>
      <Skeleton className="h-8 w-96" />
    </Card>
  );
}
