import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { initials as toInitials } from '../../lib/format';
import { IconArrowRight } from './icons';

/* ----------------------------------------------------------------- card */

type Surface = 'canvas' | 'raised' | 'inverted';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: Surface;
  interactive?: boolean;
  padded?: boolean;
  children: ReactNode;
}

/** Elevation is a colour step, never a shadow (DESIGN.md → Elevation). */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { surface = 'canvas', interactive = false, padded = true, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border transition-colors duration-200 ease-[var(--ease-state)]',
        surface === 'canvas' && 'border-hairline bg-abyss',
        surface === 'raised' && 'border-hairline bg-graphite',
        surface === 'inverted' && 'border-transparent bg-silver text-void',
        interactive && surface !== 'inverted' && 'hover:border-hairline-strong hover:bg-graphite',
        padded && 'p-20 sm:p-24',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

/* --------------------------------------------------------------- button */

type ButtonTone = 'primary' | 'ghost' | 'quiet' | 'inverted' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  tone?: ButtonTone;
  size?: ButtonSize;
  trailingArrow?: boolean;
  block?: boolean;
  children: ReactNode;
}

const toneClass: Record<ButtonTone, string> = {
  // The only primary action in the system: white fill, black text, 21:1.
  primary: 'bg-pure text-void hover:bg-cloud active:bg-silver border border-transparent',
  ghost: 'border border-hairline-strong text-cloud hover:bg-glass active:bg-glass-hover',
  quiet: 'border border-transparent text-ash hover:bg-glass hover:text-cloud',
  inverted: 'bg-void text-pure hover:bg-graphite border border-transparent',
  danger: 'border border-orchid-bloom/40 text-orchid-bloom hover:bg-orchid-bloom/10',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-32 px-12 text-caption gap-6 rounded-lg',
  md: 'h-40 px-16 text-body-sm gap-8 rounded-lg',
  lg: 'h-48 px-20 text-body gap-8 rounded-lg',
};

function buttonClass({
  tone = 'ghost',
  size = 'md',
  block,
}: Pick<ButtonBaseProps, 'tone' | 'size' | 'block'>): string {
  return cn(
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-suisse-intl',
    'transition-[background-color,border-color,color,opacity] duration-200 ease-[var(--ease-state)]',
    'disabled:pointer-events-none disabled:opacity-40',
    toneClass[tone],
    sizeClass[size],
    block && 'w-full',
  );
}

type ButtonProps = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { tone, size, trailingArrow, block, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(buttonClass({ tone, size, block }), className)}
      {...rest}
    >
      {children}
      {trailingArrow && <IconArrowRight size={16} className="-mr-2" />}
    </button>
  );
});

interface ButtonLinkProps extends ButtonBaseProps {
  to: string;
  className?: string;
  'aria-label'?: string;
}

export function ButtonLink({
  to,
  className,
  children,
  trailingArrow,
  tone,
  size,
  block,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link to={to} className={cn(buttonClass({ tone, size, block }), className)} {...rest}>
      {children}
      {trailingArrow && <IconArrowRight size={16} className="-mr-2" />}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: number;
  active?: boolean;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 36, active, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent',
        'text-ash transition-colors duration-200 ease-[var(--ease-state)]',
        'hover:bg-glass hover:text-cloud disabled:pointer-events-none disabled:opacity-40',
        active && 'border-hairline bg-glass text-cloud',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

/* ---------------------------------------------------------------- label */

export function MonoLabel({
  children,
  className,
  as: As = 'span',
}: {
  children: ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'h2' | 'h3' | 'p';
}) {
  return <As className={cn('mono-label block', className)}>{children}</As>;
}

/* ---------------------------------------------------------------- badge */

type BadgeTone = 'neutral' | 'outline' | 'solid' | 'attention';

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'mono-data inline-flex items-center gap-4 rounded-full px-8 py-2 text-[10px] leading-none',
        tone === 'neutral' && 'bg-glass text-ash',
        tone === 'outline' && 'border border-hairline-strong text-ash',
        tone === 'solid' && 'bg-pure text-void',
        tone === 'attention' && 'border border-orchid-bloom/40 text-orchid-bloom',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The system's pill chip label — uppercase mono on a 12% white fill. */
export function PillChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'mono-data inline-flex items-center gap-8 rounded-full border border-white/15 bg-white/12 px-16 py-6',
        'text-[11px] text-cloud',
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- progress */

export function ProgressBar({
  value,
  tone = 'neutral',
  height = 4,
  className,
  label,
}: {
  /** 0–100 */
  value: number;
  tone?: 'neutral' | 'accent' | 'attention' | 'muted';
  height?: number;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-white/8', className)}
      style={{ height }}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-[var(--ease-reveal)]',
          tone === 'neutral' && 'bg-cloud',
          tone === 'accent' && 'bg-cyan-signal',
          tone === 'attention' && 'bg-orchid-bloom',
          tone === 'muted' && 'bg-fog',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- skeleton */

export function Skeleton({
  className,
  radius = 6,
  style,
}: {
  className?: string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse-soft bg-white/8', className)}
      style={{ borderRadius: radius, ...style }}
    />
  );
}

/* --------------------------------------------------------------- avatar */

export function Avatar({
  name,
  size = 36,
  tint,
  className,
}: {
  name: string;
  size?: number;
  tint?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.3)) }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg border border-hairline bg-graphite',
        'font-roboto-mono font-medium uppercase tracking-[0.04em] text-cloud',
        className,
      )}
    >
      {tint ? (
        <span className="size-8 rounded-full" style={{ backgroundColor: tint }} />
      ) : (
        toInitials(name)
      )}
    </span>
  );
}

/* -------------------------------------------------------------- divider */

export function Divider({ className }: { className?: string }) {
  return <div role="presentation" className={cn('h-px w-full bg-hairline', className)} />;
}

/* --------------------------------------------------------------- change */

/**
 * A change readout. Direction is carried by an arrow glyph and an explicit
 * sign, never by colour alone — and chromatic tints are never used on text
 * this small (DESIGN.md → Don'ts).
 */
export function Change({
  value,
  children,
  className,
  muted = false,
  flatLabel = 'Unchanged',
  epsilon = 0.05,
}: {
  value: number;
  children: ReactNode;
  className?: string;
  muted?: boolean;
  /** Shown instead of an arrow when the movement rounds to nothing. */
  flatLabel?: string;
  epsilon?: number;
}) {
  const flat = Math.abs(value) < epsilon;
  const up = value > 0;

  if (flat) {
    return (
      <span className={cn('mono-data inline-flex items-center gap-4 text-fog', className)}>
        <span aria-hidden="true" className="text-[9px] leading-none">
          —
        </span>
        {flatLabel}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'mono-data inline-flex items-center gap-4 tabular-nums',
        muted ? 'text-fog' : up ? 'text-cloud' : 'text-ash',
        className,
      )}
    >
      <span aria-hidden="true" className="text-[9px] leading-none">
        {up ? '▲' : '▼'}
      </span>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- tooltip */

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 w-max max-w-[220px] -translate-x-1/2 rounded-lg',
          'border border-hairline bg-graphite px-10 py-6 text-caption text-cloud',
          'opacity-0 transition-opacity duration-200 ease-[var(--ease-state)]',
          'group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          side === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
        )}
      >
        {content}
      </span>
    </span>
  );
}
