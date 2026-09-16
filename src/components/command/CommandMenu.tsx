import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_KIND_LABEL, CATEGORIES, SPENDING_CATEGORIES, data } from '../../data';
import type { CategoryId } from '../../data';
import { cn } from '../../lib/cn';
import { currency, formatDay } from '../../lib/format';
import { useStore } from '../../state/store';
import { Overlay } from '../ui/overlays';
import { MerchantMark } from '../finance/atoms';
import {
  IconAccounts,
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconGoals,
  IconSearch,
  IconTag,
  IconTransactions,
} from '../ui/icons';
import { ALL_NAV_ITEMS } from '../layout/nav';

type CommandKind = 'page' | 'account' | 'transaction' | 'merchant' | 'category' | 'goal' | 'action';

interface Command {
  id: string;
  kind: CommandKind;
  title: string;
  subtitle?: string;
  meta?: string;
  keywords: string;
  run: () => void;
  icon?: React.ReactNode;
}

const GROUP_ORDER: { kind: CommandKind; label: string }[] = [
  { kind: 'page', label: 'Go to' },
  { kind: 'account', label: 'Accounts' },
  { kind: 'merchant', label: 'Merchants' },
  { kind: 'category', label: 'Categories' },
  { kind: 'goal', label: 'Goals' },
  { kind: 'transaction', label: 'Transactions' },
  { kind: 'action', label: 'Actions' },
];

/** Contiguous-prefix scoring — cheap, predictable, and good enough. */
function score(haystack: string, needle: string): number {
  if (!needle) return 1;
  const text = haystack.toLowerCase();
  const query = needle.toLowerCase();
  const index = text.indexOf(query);
  if (index === 0) return 3;
  if (index > 0) return text[index - 1] === ' ' ? 2.5 : 2;
  let cursor = 0;
  for (const char of query) {
    cursor = text.indexOf(char, cursor);
    if (cursor === -1) return 0;
    cursor += 1;
  }
  return 1;
}

export function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { preferences, setPreference } = useStore();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => {
      navigate(to);
      onClose();
    };

    const merchants = new Map<string, { total: number; count: number; category: CategoryId }>();
    for (const tx of data.transactions) {
      if (tx.categoryId === 'transfer' || tx.amount >= 0) continue;
      const entry = merchants.get(tx.merchant) ?? { total: 0, count: 0, category: tx.categoryId };
      entry.total += -tx.amount;
      entry.count += 1;
      merchants.set(tx.merchant, entry);
    }

    return [
      ...ALL_NAV_ITEMS.map<Command>((item) => ({
        id: `page-${item.to}`,
        kind: 'page',
        title: item.pageTitle,
        subtitle: item.description,
        keywords: `${item.pageTitle} ${item.description}`,
        run: go(item.to),
        icon: <item.icon size={15} />,
      })),
      ...data.accounts.map<Command>((account) => ({
        id: `account-${account.id}`,
        kind: 'account',
        title: account.name,
        subtitle: `${ACCOUNT_KIND_LABEL[account.kind]} ·· ${account.mask}`,
        meta: currency(account.balance, { cents: false }),
        keywords: `${account.name} ${account.institution} ${account.mask} ${ACCOUNT_KIND_LABEL[account.kind]}`,
        run: go(`/accounts/${account.id}`),
        icon: <IconAccounts size={15} />,
      })),
      ...[...merchants.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 28)
        .map<Command>(([name, stats]) => ({
          id: `merchant-${name}`,
          kind: 'merchant',
          title: name,
          subtitle: `${stats.count} charges · ${CATEGORIES[stats.category].label}`,
          meta: currency(stats.total, { cents: false }),
          keywords: name,
          run: go(`/transactions?q=${encodeURIComponent(name)}`),
          icon: <MerchantMark name={name} size={22} />,
        })),
      ...SPENDING_CATEGORIES.map<Command>((id) => ({
        id: `category-${id}`,
        kind: 'category',
        title: CATEGORIES[id].label,
        subtitle: 'Filter transactions by category',
        keywords: `${CATEGORIES[id].label} category`,
        run: go(`/transactions?category=${id}`),
        icon: (
          <span
            aria-hidden="true"
            className="size-10 rounded-full"
            style={{ backgroundColor: CATEGORIES[id].tint }}
          />
        ),
      })),
      ...data.goals.map<Command>((goal) => ({
        id: `goal-${goal.id}`,
        kind: 'goal',
        title: goal.name,
        subtitle: `${currency(goal.current, { cents: false })} of ${currency(goal.target, { cents: false })}`,
        keywords: `${goal.name} goal saving`,
        run: go('/goals'),
        icon: <IconGoals size={15} />,
      })),
      ...data.transactions.slice(0, 60).map<Command>((tx) => ({
        id: `tx-${tx.id}`,
        kind: 'transaction',
        title: tx.merchant,
        subtitle: `${formatDay(tx.date)} · ${CATEGORIES[tx.categoryId].label}`,
        meta: currency(tx.amount),
        keywords: `${tx.merchant} ${CATEGORIES[tx.categoryId].label} ${tx.date}`,
        run: go(`/transactions?q=${encodeURIComponent(tx.merchant)}`),
        icon: <IconTransactions size={15} />,
      })),
      {
        id: 'action-privacy',
        kind: 'action',
        title: preferences.hideBalances ? 'Show balances' : 'Hide balances',
        subtitle: 'Mask every figure on screen',
        keywords: 'privacy hide balances mask screen share',
        run: () => {
          setPreference('hideBalances', !preferences.hideBalances);
          onClose();
        },
        icon: preferences.hideBalances ? <IconEye size={15} /> : <IconEyeOff size={15} />,
      },
      {
        id: 'action-recurring',
        kind: 'action',
        title: 'Review recurring charges',
        subtitle: `${data.recurring.length} scheduled every month`,
        keywords: 'recurring subscriptions bills',
        run: go('/transactions?filter=recurring'),
        icon: <IconTag size={15} />,
      },
    ];
  }, [navigate, onClose, preferences.hideBalances, setPreference]);

  const results = useMemo(() => {
    const scored = commands
      .map((command) => ({ command, value: score(command.keywords, query.trim()) }))
      .filter((entry) => entry.value > 0);

    if (!query.trim()) {
      return scored
        .filter((entry) => entry.command.kind === 'page' || entry.command.kind === 'action')
        .map((entry) => entry.command);
    }

    return scored
      .sort((a, b) => b.value - a.value)
      .slice(0, 24)
      .map((entry) => entry.command);
  }, [commands, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    node?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((prev) => (prev + 1) % Math.max(results.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((prev) => (prev - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      results[active]?.run();
    }
  };

  const grouped = GROUP_ORDER.map((group) => ({
    ...group,
    items: results.filter((command) => command.kind === group.kind),
  })).filter((group) => group.items.length > 0);

  return (
    <Overlay open={open} onClose={onClose} label="Search Origin">
      <div
        className="overflow-hidden rounded-2xl border border-hairline bg-graphite"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-12 border-b border-hairline px-16">
          <IconSearch size={17} className="shrink-0 text-ash" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search accounts, merchants, categories, goals…"
            aria-label="Search Origin"
            className="h-56 w-full bg-transparent text-body text-cloud outline-none placeholder:text-ash"
          />
          <kbd className="mono-data hidden shrink-0 rounded-md border border-hairline px-6 py-2 text-[10px] text-ash sm:block">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-8">
          {results.length === 0 ? (
            <div className="px-12 py-40 text-center">
              <p className="text-body-sm text-cloud">Nothing matches “{query}”.</p>
              <p className="mt-6 text-caption text-ash">
                Try a merchant, a category like “groceries”, or an account name.
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.kind} className="mb-6 last:mb-0">
                <p className="mono-label px-10 pb-4 pt-8">{group.label}</p>
                {group.items.map((command) => {
                  const index = results.indexOf(command);
                  const isActive = index === active;
                  return (
                    <button
                      key={command.id}
                      type="button"
                      data-active={isActive}
                      onPointerEnter={() => setActive(index)}
                      onClick={command.run}
                      className={cn(
                        'flex w-full items-center gap-12 rounded-lg px-10 py-9 text-left',
                        'transition-colors duration-150 ease-[var(--ease-state)]',
                        isActive ? 'bg-glass text-cloud' : 'text-ash',
                      )}
                    >
                      <span className="flex size-22 shrink-0 items-center justify-center text-ash">
                        {command.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm text-cloud">
                          {command.title}
                        </span>
                        {command.subtitle && (
                          <span className="mt-2 block truncate text-caption text-ash">
                            {command.subtitle}
                          </span>
                        )}
                      </span>
                      {command.meta && (
                        <span className="mono-data shrink-0 text-[10px] text-ash">
                          {command.meta}
                        </span>
                      )}
                      <IconArrowRight
                        size={14}
                        className={cn(
                          'shrink-0 transition-opacity duration-150',
                          isActive ? 'opacity-100 text-cloud' : 'opacity-0',
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <footer className="flex items-center gap-16 border-t border-hairline px-16 py-10">
          <Hint keys={['↑', '↓']} label="Navigate" />
          <Hint keys={['↵']} label="Open" />
          <Hint keys={['esc']} label="Close" />
        </footer>
      </div>
    </Overlay>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-6">
      {keys.map((key) => (
        <kbd
          key={key}
          className="mono-data rounded-md border border-hairline px-5 py-1 text-[10px] text-ash"
        >
          {key}
        </kbd>
      ))}
      <span className="text-caption text-ash">{label}</span>
    </span>
  );
}
