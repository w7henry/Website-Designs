import type { PortfolioMetrics } from '../../data';
import { cn } from '../../lib/cn';
import { currency, number, signedPercent } from '../../lib/format';
import { Change, Skeleton } from '../ui/primitives';
import { Amount, MerchantMark } from './atoms';

type Holding = PortfolioMetrics['holdings'][number];

export function HoldingRow({
  holding,
  onSelect,
  selected,
}: {
  holding: Holding;
  onSelect?: (holding: Holding) => void;
  selected?: boolean;
}) {
  const isCash = holding.kind === 'cash';

  return (
    <button
      type="button"
      onClick={() => onSelect?.(holding)}
      className={cn(
        'group grid w-full grid-cols-[auto_1fr_auto] items-center gap-12 rounded-lg px-8 py-12 text-left',
        'transition-colors duration-200 ease-[var(--ease-state)] hover:bg-glass',
        'sm:grid-cols-[auto_1fr_88px_88px_88px] sm:gap-16 sm:px-12',
        selected && 'bg-glass',
      )}
    >
      <MerchantMark name={holding.ticker} size={34} />

      <span className="min-w-0">
        <span className="flex items-center gap-8">
          <span className="mono-data text-[11px] text-cloud">{holding.ticker}</span>
          {!isCash && (
            <span className="mono-data hidden text-[10px] text-ash sm:inline">
              {number(holding.weight, 1)}%
            </span>
          )}
        </span>
        <span className="mt-4 block truncate text-caption text-ash">{holding.name}</span>
      </span>

      <span className="hidden text-right sm:block">
        <span className="tnum block text-body-sm text-cloud">{currency(holding.price)}</span>
        <span className="mt-4 block">
          {isCash ? (
            <span className="mono-data text-[10px] text-ash">—</span>
          ) : (
            <Change value={holding.dayChange} className="text-[10px]">
              {signedPercent(Math.abs(holding.dayChangePercent), 2).replace(/^\+/, '')}
            </Change>
          )}
        </span>
      </span>

      <span className="hidden text-right sm:block">
        <span className="tnum block text-body-sm text-cloud">
          {isCash ? '—' : number(holding.shares, holding.shares % 1 === 0 ? 0 : 2)}
        </span>
        <span className="mono-data mt-4 block text-[10px] text-ash">
          {isCash ? 'Cash' : `avg ${currency(holding.costPerShare)}`}
        </span>
      </span>

      <span className="text-right">
        <span className="tnum block text-body-sm text-cloud">
          <Amount value={holding.value} />
        </span>
        <span className="mt-4 block">
          {isCash ? (
            <span className="mono-data text-[10px] text-ash">No return</span>
          ) : (
            <Change value={holding.totalReturn} className="text-[10px]">
              {signedPercent(Math.abs(holding.returnPercent), 1).replace(/^\+/, '')}
            </Change>
          )}
        </span>
      </span>
    </button>
  );
}

export function HoldingRowSkeleton() {
  return (
    <div className="flex items-center gap-16 px-12 py-12">
      <Skeleton className="size-34 shrink-0" radius={8} />
      <div className="flex-1">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-6 h-8 w-140" />
      </div>
      <Skeleton className="h-10 w-72" />
    </div>
  );
}
