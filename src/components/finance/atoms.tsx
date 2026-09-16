import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { currency, initials, signedCurrency, splitCurrency } from '../../lib/format';
import { categoryTint, type CategoryId } from '../../data';
import { useStore } from '../../state/store';

/* --------------------------------------------------------------- amount */

/**
 * Every figure on screen passes through here: tabular numerals, an
 * explicit sign, and the privacy preference honoured in one place.
 */
export function Amount({
  value,
  signed = false,
  cents = true,
  className,
  muted = false,
}: {
  value: number;
  signed?: boolean;
  cents?: boolean;
  className?: string;
  muted?: boolean;
}) {
  const { preferences } = useStore();
  if (preferences.hideBalances) {
    return (
      <span className={cn('tnum tracking-[0.12em] text-fog', className)} aria-label="Hidden">
        ••••
      </span>
    );
  }
  const rounded = preferences.roundedFigures ? false : cents;
  return (
    <span className={cn('tnum', muted && 'text-ash', className)}>
      {signed ? signedCurrency(value, { cents: rounded }) : currency(value, { cents: rounded })}
    </span>
  );
}

/** The hero figure — serif display, with the cents set back. */
export function DisplayAmount({
  value,
  signed = false,
  className,
  centsClassName,
}: {
  value: number;
  signed?: boolean;
  className?: string;
  centsClassName?: string;
}) {
  const { preferences } = useStore();
  if (preferences.hideBalances) {
    return (
      <span className={cn('font-lyon-display tracking-[0.08em] text-fog', className)}>••••••</span>
    );
  }
  const { sign, whole, cents } = splitCurrency(value, { plus: signed });
  return (
    <span className={cn('tnum font-lyon-display', className)}>
      {sign}
      {whole}
      <span className={cn('text-ash', centsClassName)}>.{cents}</span>
    </span>
  );
}

/* ------------------------------------------------------------- merchant */

/**
 * Merchants are shown as monogram marks on a graphite tile — a silhouette
 * treatment consistent with the system's icon language, and free of
 * third-party brand assets.
 */
export function MerchantMark({
  name,
  categoryId,
  size = 36,
  className,
}: {
  name: string;
  categoryId?: CategoryId;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-lg border border-hairline',
        'bg-graphite font-roboto-mono uppercase tracking-[0.02em] text-ash',
        className,
      )}
    >
      <span style={{ fontSize: Math.max(9, Math.round(size * 0.3)) }}>{initials(name)}</span>
      {categoryId && (
        <span
          className="absolute -bottom-1 -right-1 size-8 rounded-full border-2 border-obsidian"
          style={{ backgroundColor: categoryTint(categoryId) }}
        />
      )}
    </span>
  );
}

export function CategoryDot({ categoryId, className }: { categoryId: CategoryId; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-8 shrink-0 rounded-full', className)}
      style={{ backgroundColor: categoryTint(categoryId) }}
    />
  );
}

/* ----------------------------------------------------------------- misc */

export function KeyValue({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-16 py-10', className)}>
      <dt className="shrink-0 text-body-sm text-fog">{label}</dt>
      <dd className="min-w-0 text-right text-body-sm text-cloud">{children}</dd>
    </div>
  );
}

export function SectionHeading({
  title,
  eyebrow,
  action,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-12', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mono-label mb-8">{eyebrow}</p>}
        <h2 className="font-lyon-display text-title leading-tight text-cloud sm:text-[26px]">
          {title}
        </h2>
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
