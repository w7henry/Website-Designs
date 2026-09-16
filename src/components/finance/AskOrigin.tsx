import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, SPENDING_CATEGORIES, data } from '../../data';
import { cn } from '../../lib/cn';
import { IconArrowRight } from '../ui/icons';
import { MonoLabel } from '../ui/primitives';

const SUGGESTIONS = [
  'Where am I overspending this month?',
  'What do my subscriptions cost?',
  'How much did I spend on food?',
  'Am I on track for my emergency fund?',
];

/**
 * The system's AI prompt field. It routes rather than invents: a merchant
 * or category takes you to the filtered ledger, anything else to Insights,
 * which answers from the same derived figures the rest of the app uses.
 */
export function AskOrigin({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  const submit = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();

    const category = SPENDING_CATEGORIES.find((id) =>
      lower.includes(CATEGORIES[id].label.split(' ')[0]!.toLowerCase()),
    );
    const merchant = data.transactions.find((tx) => lower.includes(tx.merchant.toLowerCase()));

    if (merchant) navigate(`/transactions?q=${encodeURIComponent(merchant.merchant)}`);
    else if (category) navigate(`/transactions?category=${category}`);
    else navigate(`/insights?q=${encodeURIComponent(trimmed)}`);

    setValue('');
  };

  return (
    <div className={cn('min-w-0', className)}>
      {!compact && <MonoLabel className="mb-12">Ask Origin</MonoLabel>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
        className={cn(
          'flex items-center gap-8 rounded-lg border border-hairline bg-void py-8 pl-22 pr-8',
          'transition-colors duration-200 ease-[var(--ease-state)] focus-within:border-hairline-strong',
        )}
      >
        <label htmlFor="ask-origin" className="sr-only">
          Ask Origin about your money
        </label>
        <input
          id="ask-origin"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Where am I overspending this month?"
          className="h-28 min-w-0 flex-1 bg-transparent text-body-sm text-cloud outline-none placeholder:text-fog"
        />
        <button
          type="submit"
          aria-label="Ask"
          disabled={!value.trim()}
          className={cn(
            'inline-flex size-32 shrink-0 items-center justify-center rounded-full bg-white/20 text-pure',
            'transition-[background-color,opacity] duration-200 ease-[var(--ease-state)]',
            'hover:bg-white/30 disabled:opacity-35',
          )}
        >
          <IconArrowRight size={15} />
        </button>
      </form>

      {!compact && (
        <div className="mt-12 flex flex-wrap gap-8">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className={cn(
                'rounded-full border border-hairline px-12 py-6 text-caption text-ash',
                'transition-colors duration-200 ease-[var(--ease-state)] hover:border-hairline-strong hover:text-cloud',
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
