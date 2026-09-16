import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AppNotification, NotificationKind } from '../../data';
import { data } from '../../data';
import { cn } from '../../lib/cn';
import { relativeTime } from '../../lib/format';
import { useEscape, useOnClickOutside } from '../../lib/hooks';
import { useStore } from '../../state/store';
import { IconButton, MonoLabel } from '../ui/primitives';
import { EmptyState } from '../ui/states';
import {
  IconAlert,
  IconBell,
  IconInvestments,
  IconShield,
  IconSpark,
  IconWallet,
} from '../ui/icons';

const KIND_ICON: Record<NotificationKind, (props: { size?: number }) => React.ReactNode> = {
  money: IconWallet,
  budget: IconAlert,
  market: IconInvestments,
  security: IconShield,
  system: IconSpark,
};

const KIND_LABEL: Record<NotificationKind, string> = {
  money: 'Money',
  budget: 'Budgets',
  market: 'Markets',
  security: 'Security',
  system: 'Workspace',
};

function NotificationItem({
  notification,
  unread,
  onOpen,
}: {
  notification: AppNotification;
  unread: boolean;
  onOpen: () => void;
}) {
  const Icon = KIND_ICON[notification.kind];
  const body = (
    <>
      <span className="relative shrink-0 pt-2">
        <span
          className={cn(
            'inline-flex size-28 items-center justify-center rounded-lg border',
            notification.priority === 'high'
              ? 'border-hairline-strong text-cloud'
              : 'border-hairline text-fog',
          )}
        >
          <Icon size={14} />
        </span>
        {unread && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 size-7 rounded-full border-2 border-graphite bg-pure"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-12">
          <span className={cn('truncate text-body-sm', unread ? 'text-cloud' : 'text-ash')}>
            {notification.title}
          </span>
          <span className="mono-data shrink-0 text-[9px] text-fog">
            {relativeTime(notification.at, data.anchorDate)}
          </span>
        </span>
        <span className="mt-4 block text-caption leading-relaxed text-fog">{notification.body}</span>
        <span className="mono-data mt-6 block text-[9px] text-fog">
          {KIND_LABEL[notification.kind]}
        </span>
      </span>
    </>
  );

  const className = cn(
    'flex w-full gap-12 rounded-lg px-10 py-12 text-left transition-colors duration-200',
    'ease-[var(--ease-state)] hover:bg-glass',
  );

  return notification.href ? (
    <Link to={notification.href} onClick={onOpen} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} className={className}>
      {body}
    </button>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { readNotifications, unreadCount, markRead, markAllRead } = useStore();

  useOnClickOutside([rootRef], () => setOpen(false), open);
  useEscape(() => setOpen(false), open);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={() => setOpen((prev) => !prev)}
        active={open}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="relative">
          <IconBell size={17} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-1 size-7 rounded-full border-2 border-obsidian bg-pure"
            />
          )}
        </span>
      </IconButton>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            'animate-pop fixed inset-x-12 top-60 z-60 max-h-[70vh] overflow-hidden rounded-xl border',
            'border-hairline bg-graphite sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[380px]',
          )}
        >
          <header className="flex items-center justify-between gap-12 border-b border-hairline px-14 py-12">
            <MonoLabel>Notifications</MonoLabel>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="mono-data text-[10px] text-fog underline-offset-4 transition-colors hover:text-cloud hover:underline"
              >
                Mark all read
              </button>
            )}
          </header>

          <div className="max-h-[52vh] overflow-y-auto p-6 sm:max-h-[420px]">
            {data.notifications.length === 0 ? (
              <EmptyState
                compact
                title="Nothing needs you"
                body="We will surface anything that changes materially — a large charge, a budget edge, a market move."
              />
            ) : (
              data.notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  unread={!readNotifications.includes(notification.id)}
                  onOpen={() => {
                    markRead(notification.id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>

          <footer className="border-t border-hairline px-14 py-10">
            <Link
              to="/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-caption text-ash underline-offset-4 transition-colors hover:text-cloud hover:underline"
            >
              Notification settings
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
}
