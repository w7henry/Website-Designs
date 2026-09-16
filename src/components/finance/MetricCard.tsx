import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Card, Change, MonoLabel, Skeleton } from '../ui/primitives';
import { Amount } from './atoms';
import { signedPercent } from '../../lib/format';

interface MetricCardProps {
  label: string;
  value: number;
  /** Percentage change against the comparable prior period. */
  change?: number;
  changeLabel?: string;
  /** Percentages compare like with like; points compare two rates. */
  changeUnit?: 'percent' | 'points';
  signed?: boolean;
  /** Renders instead of a currency figure — used for rates. */
  display?: ReactNode;
  footnote?: string;
  visual?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  changeUnit = 'percent',
  signed = false,
  display,
  footnote,
  visual,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('flex flex-col justify-between gap-16', className)}>
      <div className="flex items-start justify-between gap-12">
        <MonoLabel>{label}</MonoLabel>
        {visual}
      </div>

      <div>
        <p className="font-lyon-display text-figure leading-none text-cloud sm:text-figure-lg">
          {display ?? <Amount value={value} signed={signed} cents={false} />}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          {change !== undefined && (
            <Change value={change} className="text-[11px]">
              {changeUnit === 'points'
                ? `${Math.abs(change).toFixed(1)} pts`
                : signedPercent(Math.abs(change), 1).replace(/^\+/, '')}
            </Change>
          )}
          {changeLabel && <span className="text-caption text-fog">{changeLabel}</span>}
        </div>

        {footnote && <p className="mt-8 text-caption leading-snug text-fog">{footnote}</p>}
      </div>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between gap-16">
      <Skeleton className="h-10 w-72" />
      <div>
        <Skeleton className="h-30 w-124" />
        <Skeleton className="mt-12 h-9 w-88" />
      </div>
    </Card>
  );
}
