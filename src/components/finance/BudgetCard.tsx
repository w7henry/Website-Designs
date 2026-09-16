import type { BudgetStatus } from '../../data';
import { categoryTint } from '../../data';
import { cn } from '../../lib/cn';
import { currency } from '../../lib/format';
import { Card, ProgressBar, Skeleton } from '../ui/primitives';
import { Amount } from './atoms';

const stateCopy: Record<BudgetStatus['state'], string> = {
  untouched: 'Untouched',
  'on-track': 'On track',
  ahead: 'Ahead of pace',
  over: 'Over',
};

export function BudgetCard({
  budget,
  monthElapsed,
  onEdit,
}: {
  budget: BudgetStatus;
  /** 0–1 through the month, drawn as the pace marker. */
  monthElapsed: number;
  onEdit?: (budget: BudgetStatus) => void;
}) {
  // Attention escalates through brightness; the chromatic step is kept
  // for the one state that genuinely needs it.
  const tone =
    budget.state === 'over' ? 'attention' : budget.state === 'ahead' ? 'neutral' : 'muted';

  return (
    <Card className="flex flex-col gap-16">
      <div className="flex items-start justify-between gap-12">
        <div className="flex min-w-0 items-center gap-10">
          <span
            aria-hidden="true"
            className="size-10 shrink-0 rounded-full"
            style={{ backgroundColor: categoryTint(budget.categoryId) }}
          />
          <p className="truncate text-body-sm text-cloud">{budget.label}</p>
        </div>
        <span
          className={cn(
            'mono-data shrink-0 rounded-full px-8 py-2 text-[10px]',
            budget.state === 'over'
              ? 'border border-orchid-bloom/40 text-orchid-bloom'
              : 'bg-glass text-ash',
          )}
        >
          {stateCopy[budget.state]}
        </span>
      </div>

      <div>
        <p className="flex items-baseline gap-6">
          <span className="font-lyon-display text-title leading-none text-cloud">
            <Amount value={budget.spent} cents={false} />
          </span>
          <span className="tnum text-body-sm text-ash">
            / {currency(budget.limit, { cents: false })}
          </span>
        </p>

        <div className="relative mt-14">
          <ProgressBar
            value={budget.used}
            tone={tone}
            height={5}
            label={`${budget.label} budget`}
          />
          {!budget.fixed && (
            <span
              aria-hidden="true"
              title="Where you should be today"
              className="absolute -top-3 h-11 w-px bg-white/45"
              style={{ left: `${Math.min(monthElapsed * 100, 100)}%` }}
            />
          )}
        </div>

        <p className="mt-12 text-caption leading-snug text-ash">{budget.message}</p>
      </div>

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(budget)}
          className="mono-data self-start text-[10px] text-ash underline-offset-4 transition-colors hover:text-cloud hover:underline"
        >
          Adjust limit
        </button>
      )}
    </Card>
  );
}

export function BudgetCardSkeleton() {
  return (
    <Card className="flex flex-col gap-16">
      <Skeleton className="h-10 w-110" />
      <div>
        <Skeleton className="h-22 w-140" />
        <Skeleton className="mt-16 h-5 w-full" radius={999} />
        <Skeleton className="mt-14 h-8 w-180" />
      </div>
    </Card>
  );
}
