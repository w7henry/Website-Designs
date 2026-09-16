import { Link } from 'react-router-dom';
import type { Insight } from '../../data';
import { cn } from '../../lib/cn';
import { Card, IconButton, MonoLabel, Skeleton } from '../ui/primitives';
import { IconArrowRight, IconClose } from '../ui/icons';

/**
 * Insight emphasis is carried by a hairline rule and the eyebrow, not by
 * colour fills — an interface that shouts loses trust quickly.
 */
export function InsightCard({
  insight,
  onDismiss,
  className,
}: {
  insight: Insight;
  onDismiss?: (id: string) => void;
  className?: string;
}) {
  return (
    <Card className={cn('group relative flex h-full flex-col justify-between gap-16', className)}>
      <div>
        <div className="flex items-start justify-between gap-12">
          <div className="flex items-center gap-8">
            <span
              aria-hidden="true"
              className={cn(
                'h-10 w-2 rounded-full',
                insight.tone === 'attention'
                  ? 'bg-orchid-bloom'
                  : insight.tone === 'positive'
                    ? 'bg-cyan-signal'
                    : 'bg-steel',
              )}
            />
            <MonoLabel>{insight.eyebrow}</MonoLabel>
          </div>
          {onDismiss && (
            <IconButton
              label={`Dismiss insight: ${insight.eyebrow}`}
              size={26}
              onClick={() => onDismiss(insight.id)}
              className="opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <IconClose size={13} />
            </IconButton>
          )}
        </div>

        <p className="mt-14 font-lyon-display text-subheading leading-snug text-cloud sm:text-title">
          {insight.headline}
        </p>
        <p className="mt-10 text-body-sm leading-relaxed text-ash">{insight.detail}</p>
      </div>

      {insight.href && insight.action && (
        <Link
          to={insight.href}
          className="inline-flex items-center gap-6 self-start text-body-sm text-cloud transition-colors duration-200 hover:text-pure"
        >
          {insight.action}
          <IconArrowRight
            size={14}
            className="transition-transform duration-200 ease-[var(--ease-state)] group-hover:translate-x-2"
          />
        </Link>
      )}
    </Card>
  );
}

export function InsightCardSkeleton() {
  return (
    <Card className="flex h-full flex-col justify-between gap-16">
      <div>
        <Skeleton className="h-9 w-88" />
        <Skeleton className="mt-16 h-14 w-full" />
        <Skeleton className="mt-8 h-14 w-3/4" />
        <Skeleton className="mt-14 h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-110" />
    </Card>
  );
}
