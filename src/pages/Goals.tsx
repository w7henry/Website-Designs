import { useMemo, useState } from 'react';
import {
  buildGoalStatus,
  data,
  monthsToHumanSafe,
  unallocated,
  type GoalStatus,
} from '../data';
import { currency, monthsToHuman } from '../lib/format';
import { useFirstLoad } from '../lib/hooks';
import { useStore } from '../state/store';
import { GoalCard, GoalCardSkeleton } from '../components/finance/GoalCard';
import { NewItemCard } from '../components/finance/NewItemCard';
import { Amount, AnimatedAmount, SectionHeading } from '../components/finance/atoms';
import { Button, Card, MonoLabel, ProgressBar } from '../components/ui/primitives';
import { Modal } from '../components/ui/overlays';
import { Field, Input } from '../components/ui/controls';

const QUICK_AMOUNTS = [100, 250, 500];

export function Goals() {
  const loading = useFirstLoad('goals');
  const { goals, topUpGoal, setGoalContribution } = useStore();
  const [active, setActive] = useState<GoalStatus | null>(null);
  const [amount, setAmount] = useState('250');
  const [monthly, setMonthly] = useState('');

  const status = useMemo(() => buildGoalStatus(goals), [goals]);

  const totals = useMemo(() => {
    const saved = status.reduce((acc, goal) => acc + goal.current, 0);
    const target = status.reduce((acc, goal) => acc + goal.target, 0);
    const monthlyTotal = status.reduce((acc, goal) => acc + goal.monthlyContribution, 0);
    const longest = status.reduce(
      (acc, goal) => (Number.isFinite(goal.monthsToGo) ? Math.max(acc, goal.monthsToGo) : acc),
      0,
    );
    return { saved, target, monthlyTotal, longest };
  }, [status]);

  const spare = useMemo(
    () => ({
      savings: unallocated('acc-savings', goals),
      reserve: unallocated('acc-reserve', goals),
      invest: unallocated('acc-invest', goals),
    }),
    [goals],
  );

  const openContribute = (goal: GoalStatus) => {
    setActive(goal);
    setAmount('250');
    setMonthly(String(goal.monthlyContribution));
  };

  const commit = () => {
    if (!active) return;
    const topUp = Number.parseFloat(amount);
    if (Number.isFinite(topUp) && topUp > 0) topUpGoal(active.id, topUp);
    const contribution = Number.parseFloat(monthly);
    if (Number.isFinite(contribution) && contribution >= 0)
      setGoalContribution(active.id, Math.round(contribution));
    setActive(null);
  };

  return (
    <div className="flex flex-col gap-32">
      <SectionHeading eyebrow={`${status.length} in progress`} title="Goals" />

      <Card className="flex flex-col gap-24 lg:flex-row lg:items-center lg:gap-40">
        <div className="lg:w-[300px] lg:shrink-0">
          <MonoLabel>Saved towards goals</MonoLabel>
          <p className="mt-12 font-lyon-display text-heading-lg leading-none text-cloud">
            <AnimatedAmount value={totals.saved} cents={false} />
          </p>
          <p className="mt-10 text-body-sm text-ash">
            of {currency(totals.target, { cents: false })} targeted
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <ProgressBar
            value={(totals.saved / totals.target) * 100}
            height={8}
            label="Total goal progress"
          />
          <dl className="mt-20 grid grid-cols-2 gap-x-24 gap-y-14 sm:grid-cols-4">
            <div>
              <dt className="mono-label">Monthly</dt>
              <dd className="tnum mt-6 text-body-sm text-cloud">
                <Amount value={totals.monthlyTotal} cents={false} />
              </dd>
            </div>
            <div>
              <dt className="mono-label">Longest</dt>
              <dd className="mt-6 text-body-sm text-cloud">{monthsToHuman(totals.longest)}</dd>
            </div>
            <div>
              <dt className="mono-label">Unallocated cash</dt>
              <dd className="tnum mt-6 text-body-sm text-cloud">
                <Amount value={spare.savings + spare.reserve} cents={false} />
              </dd>
            </div>
            <div>
              <dt className="mono-label">Unallocated invested</dt>
              <dd className="tnum mt-6 text-body-sm text-cloud">
                <Amount value={spare.invest} cents={false} />
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      <section>
        <SectionHeading
          eyebrow="Each goal is backed by a real balance"
          title="In progress"
          action={<MonoLabel className="hidden sm:block">Funded from linked accounts</MonoLabel>}
        />
        <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? data.goals.map((goal) => <GoalCardSkeleton key={goal.id} />)
            : [
                ...status.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onContribute={openContribute} />
                )),
                <NewItemCard
                  key="new-goal"
                  title="Start a goal"
                  body="Name a target, choose the account behind it, and Origin works out the date."
                  onClick={() => openContribute(status[0]!)}
                />,
              ]}
        </div>
      </section>

      <Card surface="raised" className="flex flex-col gap-12">
        <MonoLabel>How allocation works</MonoLabel>
        <p className="max-w-[720px] text-body-sm leading-relaxed text-ash">
          A goal is an earmark against money you already hold, not a separate pot. Vantage Savings
          carries {currency(spare.savings, { cents: false })} beyond what your goals claim, and the
          Emergency Reserve is fully allocated. Nothing is double counted, which is why the goal
          totals and your net worth always agree.
        </p>
      </Card>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? `Add to ${active.name}` : ''}
        description={active ? `Funded from ${active.accountName}` : undefined}
        size="sm"
        footer={
          <>
            <Button tone="quiet" size="sm" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={commit}>
              Confirm
            </Button>
          </>
        }
      >
        {active && (
          <div className="flex flex-col gap-20">
            <div>
              <Field label="One-off contribution" htmlFor="goal-amount">
                <Input
                  id="goal-amount"
                  type="number"
                  min="0"
                  step="10"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </Field>
              <div className="mt-10 flex gap-8">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className="mono-data rounded-full border border-hairline px-12 py-5 text-[10px] text-ash transition-colors duration-200 hover:border-hairline-strong hover:text-cloud"
                  >
                    {currency(value, { cents: false })}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Monthly contribution"
              htmlFor="goal-monthly"
              hint={`Currently ${currency(active.monthlyContribution, { cents: false })} a month, reaching the target in ${monthsToHuman(active.monthsToGo)}.`}
            >
              <Input
                id="goal-monthly"
                type="number"
                min="0"
                step="25"
                value={monthly}
                onChange={(event) => setMonthly(event.target.value)}
              />
            </Field>

            <p className="rounded-lg border border-hairline bg-abyss px-12 py-12 text-caption leading-relaxed text-ash">
              {currency(active.remaining, { cents: false })} remaining. At{' '}
              {currency(Number.parseFloat(monthly) || active.monthlyContribution, { cents: false })} a
              month you reach {currency(active.target, { cents: false })} in{' '}
              {monthsToHumanSafe(
                active.remaining - (Number.parseFloat(amount) || 0),
                Number.parseFloat(monthly) || active.monthlyContribution,
              )}
              .
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
