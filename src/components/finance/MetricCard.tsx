import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Card, Change, MonoLabel, Skeleton, Tooltip } from '../ui/primitives';
import { IconInfo } from '../ui/icons';
import { Amount } from './atoms';
import { signedPercent } from '../../lib/format';

interface MetricCardProps {
  label: string;
  value: number;
  /** Percentage change against the comparable prior period. */
  change?: number;
  changeLabel?: string;
  /** Used below the sm breakpoint, where the full phrase would wrap badly. */
  changeLabelShort?: string;
  /** Percentages compare like with like; points compare two rates. */
  changeUnit?: 'percent' | 'points';
  signed?: boolean;
  /** Renders instead of a currency figure — used for rates. */
  display?: ReactNode;
  footnote?: string;
  /** How the figure is derived — shown on hover and focus. */
  hint?: string;
  visual?: ReactNode;
  className?: string;
}

/**
 * Label, figure and change flow from the top so a row of cards aligns on
 * the number; the footnote is pushed to the bottom edge.
 */
export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  changeLabelShort,
  changeUnit = 'percent',
  signed = false,
  display,
  footnote,
  hint,
  visual,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('flex flex-col gap-14', className)}>
      <div className="flex items-start justify-between gap-12">
        <span className="flex items-center gap-6">
          <MonoLabel>{label}</MonoLabel>
          {hint && (
            <Tooltip content={hint} className="hidden sm:inline-flex">
              <button
                type="button"
                aria-label={`How ${label.toLowerCase()} is calculated`}
                className="inline-flex size-16 items-center justify-center rounded-full text-ash transition-colors duration-200 hover:text-cloud"
              >
                <IconInfo size={12} />
              </button>
            </Tooltip>
          )}
        </span>
        {visual}
      </div>

      <div>
        <p className="font-lyon-display text-figure leading-none text-cloud sm:text-figure-lg">
          {display ?? <Amount value={value} signed={signed} cents={false} />}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2">
          {change !== undefined && (
            <Change value={change} className="text-[11px]">
              {changeUnit === 'points'
                ? `${Math.abs(change).toFixed(1)} pts`
                : signedPercent(Math.abs(change), 1).replace(/^\+/, '')}
            </Change>
          )}
          {changeLabel && (
            <span className="text-caption text-ash">
              {changeLabelShort ? (
                <>
                  <span className="sm:hidden">{changeLabelShort}</span>
                  <span className="hidden sm:inline">{changeLabel}</span>
                </>
              ) : (
                changeLabel
              )}
            </span>
          )}
        </div>
      </div>

      {footnote && (
        <p className="mt-auto pt-2 text-caption leading-snug text-ash">{footnote}</p>
      )}
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="flex flex-col gap-14">
      <Skeleton className="h-10 w-72" />
      <div>
        <Skeleton className="h-28 w-110" />
        <Skeleton className="mt-12 h-9 w-88" />
      </div>
      <Skeleton className="mt-auto h-8 w-full" />
    </Card>
  );
}
