import type { GoalStatus } from '../../data';
import { currency, monthsToHuman } from '../../lib/format';
import { Button, Card, ProgressBar, Skeleton } from '../ui/primitives';
import { Amount } from './atoms';

export function GoalCard({
  goal,
  onContribute,
}: {
  goal: GoalStatus;
  onContribute: (goal: GoalStatus) => void;
}) {
  const reached = goal.remaining === 0;

  return (
    <Card className="flex h-full flex-col justify-between gap-20">
      <div>
        <div className="flex items-start justify-between gap-12">
          <div className="min-w-0">
            <p className="truncate text-body-sm text-cloud">{goal.name}</p>
            <p className="mono-data mt-6 text-[10px] text-fog">{goal.accountName}</p>
          </div>
          <span className="tnum shrink-0 font-roboto-mono text-[11px] text-ash">
            {goal.progress.toFixed(0)}%
          </span>
        </div>

        <p className="mt-16 flex items-baseline gap-6">
          <span className="font-lyon-display text-title leading-none text-cloud sm:text-[26px]">
            <Amount value={goal.current} cents={false} />
          </span>
          <span className="tnum text-body-sm text-fog">
            / {currency(goal.target, { cents: false })}
          </span>
        </p>

        <ProgressBar
          value={goal.progress}
          tone={reached ? 'accent' : 'neutral'}
          height={5}
          className="mt-14"
          label={`${goal.name} progress`}
        />

        <dl className="mt-16 flex flex-wrap gap-x-24 gap-y-8">
          <div>
            <dt className="mono-label">Remaining</dt>
            <dd className="tnum mt-4 text-body-sm text-cloud">
              <Amount value={goal.remaining} cents={false} />
            </dd>
          </div>
          <div>
            <dt className="mono-label">Monthly</dt>
            <dd className="tnum mt-4 text-body-sm text-cloud">
              <Amount value={goal.monthlyContribution} cents={false} />
            </dd>
          </div>
          <div>
            <dt className="mono-label">On track for</dt>
            <dd className="mt-4 text-body-sm text-cloud">
              {reached ? 'Reached' : goal.estimatedCompletion}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-between gap-12 border-t border-hairline pt-16">
        <p className="min-w-0 truncate text-caption text-fog">
          {reached ? goal.note : `${monthsToHuman(goal.monthsToGo)} to go`}
        </p>
        <Button size="sm" tone="ghost" onClick={() => onContribute(goal)} disabled={reached}>
          Add funds
        </Button>
      </div>
    </Card>
  );
}

export function GoalCardSkeleton() {
  return (
    <Card className="flex h-full flex-col justify-between gap-20">
      <div>
        <Skeleton className="h-10 w-120" />
        <Skeleton className="mt-20 h-24 w-160" />
        <Skeleton className="mt-16 h-5 w-full" radius={999} />
        <Skeleton className="mt-20 h-10 w-full" />
      </div>
      <Skeleton className="h-32 w-full" radius={8} />
    </Card>
  );
}
