import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { Button } from './primitives';
import { IconAlert, IconRefresh } from './icons';

export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
  compact = false,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-10 py-32' : 'gap-12 py-60',
        className,
      )}
    >
      {icon && (
        <span className="mb-2 inline-flex size-40 items-center justify-center rounded-full border border-hairline text-ash">
          {icon}
        </span>
      )}
      <h3 className="font-lyon-display text-title text-cloud">{title}</h3>
      <p className="max-w-[380px] text-body-sm leading-relaxed text-ash">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  eyebrow = 'Something went wrong',
  title = 'We could not load this',
  body = 'The data did not come back. Nothing has been changed, and trying again usually settles it.',
  retryLabel = 'Try again',
  onRetry,
  secondary,
}: {
  eyebrow?: string;
  title?: string;
  body?: string;
  retryLabel?: string;
  onRetry?: () => void;
  secondary?: ReactNode;
}) {
  return (
    <div className="flex min-h-[58vh] items-center justify-center px-8">
      <div className="max-w-[460px] text-center">
        <span className="mb-16 inline-flex size-40 items-center justify-center rounded-full border border-hairline text-ash">
          <IconAlert size={18} />
        </span>
        <p className="mono-label">{eyebrow}</p>
        <h2 className="mt-14 font-lyon-display text-[32px] leading-[1.08] text-cloud sm:text-heading-lg">
          {title}
        </h2>
        <p className="mt-16 text-body-sm leading-relaxed text-ash">{body}</p>
        <div className="mt-24 flex flex-wrap items-center justify-center gap-10">
          {onRetry && (
            <Button tone="primary" onClick={onRetry}>
              <IconRefresh size={15} />
              {retryLabel}
            </Button>
          )}
          {secondary}
        </div>
      </div>
    </div>
  );
}

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Origin caught an unexpected error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorState
        title="This screen stopped responding."
        body="Your accounts and data are untouched. Reloading the workspace will bring you back to where you were."
        retryLabel="Reload workspace"
        onRetry={() => window.location.reload()}
        secondary={
          <Link
            to="/dashboard"
            className="text-body-sm text-ash underline-offset-4 transition-colors hover:text-cloud hover:underline"
          >
            Back to overview
          </Link>
        }
      />
    );
  }
}
