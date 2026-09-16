import { useMemo, useState } from 'react';
import {
  BUDGETS,
  buildBudgetStatus,
  categoryLabel,
  data,
  projectSpending,
  type BudgetStatus,
} from '../data';
import { currency, percent } from '../lib/format';
import { useCountUp, useFirstLoad } from '../lib/hooks';
import { useStore } from '../state/store';
import { BudgetCard, BudgetCardSkeleton } from '../components/finance/BudgetCard';
import { NewItemCard } from '../components/finance/NewItemCard';
import { Amount, SectionHeading } from '../components/finance/atoms';
import { Button, Card, MonoLabel, ProgressBar } from '../components/ui/primitives';
import { Modal } from '../components/ui/overlays';
import { Field, Input } from '../components/ui/controls';

export function Budgets() {
  const loading = useFirstLoad('budgets');
  const { budgetLimits, setBudgetLimit, resetBudgets } = useStore();
  const [editing, setEditing] = useState<BudgetStatus | null>(null);
  const [draft, setDraft] = useState('');

  const month = data.currentMonth;
  const elapsed = month.daysElapsed / month.daysInMonth;

  const budgets = useMemo(() => {
    const base = buildBudgetStatus(month);
    if (Object.keys(budgetLimits).length === 0) return base;
    // Re-derive against the user's own limits so pacing stays truthful.
    return buildBudgetStatus(month)
      .map((budget) => {
        const limit = budgetLimits[budget.categoryId];
        if (limit === undefined) return budget;
        const used = limit === 0 ? 0 : (budget.spent / limit) * 100;
        const projected = budget.fixed ? budget.spent : budget.spent / Math.max(elapsed, 0.05);
        const state: BudgetStatus['state'] =
          budget.spent === 0
            ? 'untouched'
            : budget.spent > limit
              ? 'over'
              : budget.fixed
                ? 'on-track'
                : used > elapsed * 100 + 12
                  ? 'ahead'
                  : 'on-track';
        const message =
          state === 'over'
            ? `Over by ${currency(budget.spent - limit, { cents: false })}`
            : state === 'untouched'
              ? `Nothing spent yet — ${month.daysInMonth - month.daysElapsed} days left`
              : budget.fixed
                ? `${Math.round(used)}% of the monthly commitment`
                : state === 'ahead'
                  ? projected > limit
                    ? `On pace for ${currency(projected, { cents: false })} — ${currency(projected - limit, { cents: false })} over`
                    : 'A little higher than usual, still inside the limit'
                  : `On pace for ${currency(projected, { cents: false })} — you're on track`;
        return { ...budget, limit, used, projected, state, message, remaining: limit - budget.spent };
      })
      .sort((a, b) => b.used - a.used);
  }, [month, budgetLimits, elapsed]);

  const totals = useMemo(() => {
    const limit = budgets.reduce((acc, budget) => acc + budget.limit, 0);
    const projected = budgets.reduce((acc, budget) => acc + budget.projected, 0);
    return { limit, projected, used: limit === 0 ? 0 : (month.spending / limit) * 100 };
  }, [budgets, month.spending]);

  const easedUsed = useCountUp(totals.used);
  const overCount = budgets.filter((b) => b.state === 'over').length;
  const aheadCount = budgets.filter((b) => b.state === 'ahead').length;
  const customised = Object.keys(budgetLimits).length > 0;

  const openEditor = (budget: BudgetStatus) => {
    setEditing(budget);
    setDraft(String(budget.limit));
  };

  const saveEditor = () => {
    if (!editing) return;
    const value = Number.parseFloat(draft);
    if (Number.isFinite(value) && value >= 0) setBudgetLimit(editing.categoryId, Math.round(value));
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-32">
      <SectionHeading
        eyebrow={`${month.label} · ${month.daysInMonth - month.daysElapsed} days left`}
        title="Budgets"
        action={
          customised && (
            <Button size="sm" tone="quiet" onClick={resetBudgets}>
              Reset to defaults
            </Button>
          )
        }
      />

      {/* --------------------------------------------------- the headline */}
      <Card className="flex flex-col gap-24 lg:flex-row lg:items-center lg:gap-40">
        <div className="min-w-0 lg:w-[300px] lg:shrink-0">
          <MonoLabel>Used so far</MonoLabel>
          <p className="mt-12 font-lyon-display text-heading-lg leading-none text-cloud">
            {percent(easedUsed, 0)}
          </p>
          <p className="mt-10 text-body-sm text-ash">
            <Amount value={month.spending} cents={false} /> of{' '}
            {currency(totals.limit, { cents: false })}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative">
            <ProgressBar
              value={totals.used}
              tone={totals.used > 100 ? 'attention' : 'neutral'}
              height={8}
              label="Total budget used"
            />
            <span
              aria-hidden="true"
              title="Where you should be today"
              className="absolute -top-4 h-16 w-px bg-white/45"
              style={{ left: `${Math.min(elapsed * 100, 100)}%` }}
            />
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-x-20 gap-y-6">
            <span className="mono-data text-[10px] text-ash">
              {Math.round(elapsed * 100)}% of the month elapsed
            </span>
            <span className="mono-data text-[10px] text-ash">
              On pace for{' '}
              <span className="text-cloud">
                {currency(projectSpending(month), { cents: false })}
              </span>
            </span>
          </div>

          <p className="mt-16 text-body-sm leading-relaxed text-ash">
            {overCount > 0
              ? `${overCount} ${overCount === 1 ? 'budget is' : 'budgets are'} over, and ${aheadCount} ${aheadCount === 1 ? 'is' : 'are'} running ahead of pace. Nothing here needs a decision today.`
              : aheadCount > 0
                ? `${aheadCount} ${aheadCount === 1 ? 'category is' : 'categories are'} running ahead of pace. At the current rate you finish the month around ${currency(projectSpending(month), { cents: false })}.`
                : `Everything is tracking where it should be for day ${month.daysElapsed}.`}
          </p>
        </div>
      </Card>

      {/* ------------------------------------------------------ the grid */}
      <section>
        <SectionHeading
          eyebrow={`${budgets.length} categories`}
          title="By category"
          action={<MonoLabel className="hidden sm:block">Marker shows today's pace</MonoLabel>}
        />
        <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? BUDGETS.map((budget) => <BudgetCardSkeleton key={budget.categoryId} />)
            : [
                ...budgets.map((budget) => (
                  <BudgetCard
                    key={budget.categoryId}
                    budget={budget}
                    monthElapsed={elapsed}
                    onEdit={openEditor}
                  />
                )),
                <NewItemCard
                  key="new-budget"
                  title="Set another limit"
                  body="Pick a category and Origin will pace it against the rest of the month."
                  onClick={() => openEditor(budgets[0]!)}
                />,
              ]}
        </div>
      </section>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.label} budget` : ''}
        description="Changes apply immediately and stay on this device."
        size="sm"
        footer={
          <>
            <Button tone="quiet" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={saveEditor}>
              Save limit
            </Button>
          </>
        }
      >
        {editing && (
          <>
            <Field label="Monthly limit" htmlFor="budget-limit">
              <Input
                id="budget-limit"
                type="number"
                min="0"
                step="10"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && saveEditor()}
              />
            </Field>
            <p className="mt-16 text-caption leading-relaxed text-ash">
              You have spent {currency(editing.spent)} on{' '}
              {categoryLabel(editing.categoryId).toLowerCase()} so far this month. Over the last
              three months this category averaged{' '}
              {currency(
                [1, 2, 3]
                  .map((i) => data.trailingMonths.at(-1 - i)?.byCategory[editing.categoryId] ?? 0)
                  .reduce((a, b) => a + b, 0) / 3,
                { cents: false },
              )}
              .
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}
