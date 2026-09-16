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
        <span className="mb-2 inline-flex size-40 items-center justify-center rounded-full border border-hairline text-fog">
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
  title = 'We could not load this',
  body = 'The data did not come back. Nothing has been changed, and trying again usually settles it.',
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={<IconAlert size={18} />}
      title={title}
      body={body}
      action={
        onRetry && (
          <Button tone="ghost" onClick={onRetry}>
            <IconRefresh size={15} />
            Try again
          </Button>
        )
      }
    />
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
      <div className="flex min-h-[60vh] items-center justify-center px-24">
        <div className="max-w-[440px] text-center">
          <p className="mono-label">Something went wrong</p>
          <h1 className="mt-16 font-lyon-display text-heading-lg leading-none text-cloud">
            This screen stopped responding.
          </h1>
          <p className="mt-16 text-body-sm leading-relaxed text-ash">
            Your accounts and data are untouched. Reloading the workspace will bring you back to
            where you were.
          </p>
          <div className="mt-24 flex items-center justify-center gap-10">
            <Button tone="primary" onClick={() => window.location.reload()}>
              Reload workspace
            </Button>
            <Link
              to="/dashboard"
              className="text-body-sm text-ash underline-offset-4 transition-colors hover:text-cloud hover:underline"
            >
              Back to overview
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
