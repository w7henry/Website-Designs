import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoryLabel, data, formatDayYear } from '../data';
import { currency } from '../lib/format';
import { useFirstLoad } from '../lib/hooks';
import { useStore } from '../state/store';
import { AskOrigin } from '../components/finance/AskOrigin';
import { InsightCard, InsightCardSkeleton } from '../components/finance/InsightCard';
import { Amount, MerchantMark, SectionHeading } from '../components/finance/atoms';
import { Button, ButtonLink, Card, MonoLabel } from '../components/ui/primitives';
import { EmptyState } from '../components/ui/states';

/** Ranks the derived insights against a typed question. */
function rank(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return data.insights;
  const words = needle.split(/\s+/).filter((word) => word.length > 2);
  return [...data.insights].sort((a, b) => scoreOf(b, words) - scoreOf(a, words));
}

function scoreOf(insight: { eyebrow: string; headline: string; detail: string }, words: string[]) {
  const haystack = `${insight.eyebrow} ${insight.headline} ${insight.detail}`.toLowerCase();
  return words.reduce((acc, word) => acc + (haystack.includes(word) ? 1 : 0), 0);
}

export function Insights() {
  const loading = useFirstLoad('insights');
  const [params] = useSearchParams();
  const { dismissedInsights, dismissInsight, restoreInsights } = useStore();

  const query = params.get('q') ?? '';
  const ranked = useMemo(() => rank(query), [query]);
  const visible = ranked.filter((insight) => !dismissedInsights.includes(insight.id));
  const [lead, ...rest] = visible;

  const month = data.currentMonth;
  const upcoming = data.recurring.slice(0, 8);
  const committed = data.recurring.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="flex flex-col gap-32">
      <SectionHeading
        eyebrow={`${month.label} · day ${month.daysElapsed} of ${month.daysInMonth}`}
        title="Insights"
        action={
          dismissedInsights.length > 0 && (
            <Button size="sm" tone="quiet" onClick={restoreInsights}>
              Restore {dismissedInsights.length} dismissed
            </Button>
          )
        }
      />

      <Card surface="raised">
        <AskOrigin />
      </Card>

      {query && (
        <p className="text-body-sm text-ash">
          Showing what Origin knows about “<span className="text-cloud">{query}</span>”, ordered by
          relevance. Every figure below is computed from your own ledger.
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <InsightCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="You have cleared every insight"
          body="Origin will surface something new as your spending, markets or goals move. Nothing is hidden permanently."
          action={
            <Button tone="ghost" size="sm" onClick={restoreInsights}>
              Restore dismissed
            </Button>
          }
        />
      ) : (
        <>
          {lead && (
            <InsightCard
              insight={lead}
              onDismiss={dismissInsight}
              className="lg:[&_p:nth-of-type(1)]:text-[26px]"
            />
          )}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 xl:grid-cols-3">
            {rest.map((insight) => (
              <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
            ))}
          </div>
        </>
      )}

      {/* ------------------------------------------------------ recurring */}
      <section>
        <SectionHeading
          eyebrow={`${data.recurring.length} charges · ${currency(committed, { cents: false })} a month`}
          title="What repeats"
          action={
            <ButtonLink to="/transactions?filter=recurring" size="sm" tone="quiet" trailingArrow>
              See every charge
            </ButtonLink>
          }
        />

        <Card padded={false} className="mt-20">
          <ul className="divide-y divide-white/6 px-16 sm:px-20">
            {upcoming.map((item) => (
              <li key={item.merchant} className="flex items-center gap-12 py-14 sm:gap-16">
                <MerchantMark name={item.merchant} categoryId={item.categoryId} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm text-cloud">{item.merchant}</span>
                  <span className="mono-data mt-4 block text-[10px] text-fog">
                    {categoryLabel(item.categoryId)} · next {formatDayYear(item.nextDate)}
                  </span>
                </span>
                <span className="tnum shrink-0 text-body-sm text-ash">
                  <Amount value={item.amount} />
                </span>
              </li>
            ))}
          </ul>
          <footer className="flex items-center justify-between gap-12 border-t border-hairline px-16 py-14 sm:px-20">
            <MonoLabel>Committed each month</MonoLabel>
            <span className="tnum text-body-sm text-cloud">
              <Amount value={committed} />
            </span>
          </footer>
        </Card>
      </section>
    </div>
  );
}
