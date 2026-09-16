import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, sliceRange } from '../data';
import { cn } from '../lib/cn';
import { currency, percent } from '../lib/format';
import { LineChart } from '../components/charts/LineChart';
import { AskOrigin } from '../components/finance/AskOrigin';
import { DisplayAmount } from '../components/finance/atoms';
import { Button, ButtonLink, MonoLabel, PillChip } from '../components/ui/primitives';
import { IconArrowRight, IconClose, IconLogo, IconMenu } from '../components/ui/icons';

const NAV = [
  { label: 'Product', to: '/dashboard' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Investing', to: '/investments' },
];

/** The chromatic tiles — the one place the palette is allowed to carry a surface. */
const MODULES = [
  {
    title: 'Spending',
    tint: 'var(--color-iris-gleam)',
    ink: 'var(--color-pure)',
    body: 'Every charge categorised the moment it lands, with the pace of the month drawn against each limit rather than a flat percentage.',
  },
  {
    title: 'Investing',
    tint: 'var(--color-cyan-signal)',
    ink: 'var(--color-void)',
    body: 'Holdings, cost basis and return measured against what you actually paid — contributions never masquerade as performance.',
  },
  {
    title: 'Forecasting',
    tint: 'var(--color-orchid-bloom)',
    ink: 'var(--color-void)',
    body: 'What the month ends at, when each goal lands, and what a different contribution would change. Arithmetic, not optimism.',
  },
];

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = 'Origin — Private Wealth Workspace';
  }, []);

  const month = data.currentMonth;
  const spark = sliceRange(data.netWorthSeries, '3M');

  return (
    <div className="min-h-dvh bg-obsidian">
      {/* ------------------------------------------------------------ nav */}
      <header className="glass-chrome sticky top-0 z-50 border-b border-hairline">
        <div className="mx-auto flex h-64 max-w-[1200px] items-center gap-16 px-16 sm:px-24">
          <Link to="/" className="inline-flex items-center gap-10 text-cloud">
            <IconLogo size={22} className="text-pure" />
            <span className="font-lyon-display text-subheading leading-none">Origin</span>
          </Link>

          <nav aria-label="Marketing" className="ml-16 hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  'rounded-lg border border-white/18 bg-white/10 px-12 py-8 text-body-sm text-cloud',
                  'transition-colors duration-200 ease-[var(--ease-state)] hover:bg-white/16',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-10">
            <Link
              to="/dashboard"
              className="hidden text-body-sm text-ash transition-colors duration-200 hover:text-cloud sm:block"
            >
              Log in
            </Link>
            <ButtonLink to="/dashboard" tone="primary" size="sm" trailingArrow>
              Get started
            </ButtonLink>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="inline-flex size-34 items-center justify-center rounded-lg text-ash transition-colors hover:bg-glass hover:text-cloud lg:hidden"
            >
              {menuOpen ? <IconClose size={17} /> : <IconMenu size={17} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            aria-label="Marketing"
            className="animate-pop border-t border-hairline px-16 py-12 lg:hidden"
          >
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-10 py-10 text-body-sm text-ash transition-colors hover:bg-glass hover:text-cloud"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        {/* The system's one atmospheric gradient, masked so it dissolves
            into the canvas instead of ending on a seam. */}
        <div
          aria-hidden="true"
          className="sky-atmosphere pointer-events-none absolute inset-x-0 top-0 h-[720px] opacity-[0.2]"
          style={{
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)',
          }}
        />

        <div className="relative mx-auto max-w-[1200px] px-16 pb-60 pt-60 text-center sm:px-24 sm:pb-100 sm:pt-100">
          <div className="animate-reveal">
            <PillChip>Origin Private · invitation only</PillChip>
          </div>

          <h1 className="animate-reveal mx-auto mt-32 max-w-[900px] font-lyon-display text-[44px] leading-[1] text-pure sm:text-[68px] lg:text-display-sm lg:leading-[1]">
            <em className="italic">Own</em> the whole picture,
            <br className="hidden sm:block" /> not the pieces.
          </h1>

          <p className="animate-reveal mx-auto mt-24 max-w-[560px] text-body leading-relaxed text-ash sm:text-subheading">
            Every account, every movement and what it means — in one quiet room. No dashboards for
            their own sake, no numbers you cannot trace back to a charge.
          </p>

          <div className="animate-reveal mx-auto mt-32 max-w-[560px] text-left">
            <AskOrigin compact />
            <p className="mt-10 text-center text-caption text-fog">
              Ask in plain words. Origin answers from your own ledger.
            </p>
          </div>

          <div className="animate-reveal mt-40 flex flex-wrap items-center justify-center gap-x-40 gap-y-16">
            {[
              { name: 'Forbes', note: 'Best personal finance app, 2026' },
              { name: 'Fast Company', note: 'Innovation by design' },
            ].map((award) => (
              <span key={award.name} className="flex items-center gap-10 text-cloud">
                <Laurel />
                <span className="text-left">
                  <span className="block font-lyon-display text-subheading leading-none">
                    {award.name}
                  </span>
                  <span className="mono-data mt-4 block text-[9px] text-fog">{award.note}</span>
                </span>
                <Laurel flipped />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- product proof */}
      <section className="mx-auto max-w-[1200px] px-16 pb-60 sm:px-24 sm:pb-100">
        <div className="rounded-[30px] border border-hairline bg-abyss p-20 sm:p-40">
          <div className="flex flex-col gap-32 lg:flex-row lg:items-center lg:gap-60">
            <div className="min-w-0 lg:w-[360px] lg:shrink-0">
              <MonoLabel>Net worth, today</MonoLabel>
              <p className="mt-16 leading-none text-cloud">
                <DisplayAmount
                  value={data.netWorth}
                  className="text-[40px] leading-[0.95] sm:text-[52px]"
                  centsClassName="text-[0.44em]"
                />
              </p>
              <p className="mt-16 text-body-sm leading-relaxed text-ash">
                Five accounts, {data.transactions.length.toLocaleString('en-US')} movements, one
                figure that always reconciles. Open the workspace and every number on this page is
                traceable to a transaction.
              </p>
              <ButtonLink to="/dashboard" tone="primary" className="mt-24" trailingArrow>
                Open the workspace
              </ButtonLink>
            </div>

            <div className="min-w-0 flex-1">
              <div className="dark-chrome rounded-2xl border border-hairline p-8">
                <div className="rounded-xl bg-obsidian p-16 sm:p-24">
                  <div className="flex items-start justify-between gap-16">
                    <div>
                      <MonoLabel>Month to date</MonoLabel>
                      <p className="mt-10 font-lyon-display text-figure leading-none text-cloud">
                        {percent(month.savingsRate, 1)}
                      </p>
                      <p className="mt-6 text-caption text-fog">kept of what was earned</p>
                    </div>
                    <div className="text-right">
                      <MonoLabel>Spent</MonoLabel>
                      <p className="tnum mt-10 text-subheading text-cloud">
                        {currency(month.spending, { cents: false })}
                      </p>
                      <p className="mt-6 text-caption text-fog">
                        of {currency(month.income, { cents: false })} in
                      </p>
                    </div>
                  </div>

                  <div className="mt-20 border-t border-hairline pt-16">
                    <LineChart
                      series={spark}
                      label="Net worth, last three months"
                      height={96}
                      compact
                      baseline={false}
                    />
                  </div>

                  <ul className="mt-16 divide-y divide-white/6">
                    {data.transactions
                      .filter((tx) => tx.categoryId !== 'transfer')
                      .slice(0, 3)
                      .map((tx) => (
                        <li key={tx.id} className="flex items-center justify-between gap-16 py-10">
                          <span className="truncate text-caption text-ash">{tx.merchant}</span>
                          <span className="tnum shrink-0 text-caption text-cloud">
                            {tx.amount < 0 ? '−' : '+'}
                            {currency(tx.amount)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- modules */}
      <section className="mx-auto max-w-[1200px] px-16 pb-60 sm:px-24 sm:pb-100">
        <h2 className="mx-auto max-w-[720px] text-center font-lyon-display text-[32px] leading-tight text-cloud sm:text-heading-lg">
          Three questions, answered <em className="italic">properly</em>.
        </h2>

        <div className="mt-40 grid grid-cols-1 gap-12 lg:grid-cols-3">
          {MODULES.map((module) => (
            <article
              key={module.title}
              className="rounded-[30px] p-32 transition-transform duration-200 ease-[var(--ease-state)] hover:-translate-y-2"
              style={{ backgroundColor: module.tint, color: module.ink }}
            >
              <h3 className="font-lyon-display text-[32px] leading-none sm:text-heading-lg">
                {module.title}
              </h3>
              <p className="mt-20 text-body leading-relaxed" style={{ opacity: 0.82 }}>
                {module.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- stat block */}
      <section className="mx-auto max-w-[1200px] px-16 pb-60 sm:px-24 sm:pb-100">
        <div className="rounded-[30px] bg-silver p-32 text-void sm:p-48">
          <div className="flex flex-col gap-32 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[600px]">
              <p className="mono-data text-[10px] tracking-[0.18em] text-void/55">
                Why people stay
              </p>
              <p className="mt-20 font-lyon-display text-[30px] leading-[1.15] sm:text-heading-lg sm:leading-[1.1]">
                “It is the first money app I have not had to argue with. The number at the top is
                the number, and I can always find out why.”
              </p>
              <p className="mt-20 text-body-sm text-void/70">
                Priya Raman · member since 2022
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-32 gap-y-20 lg:shrink-0">
              <div>
                <dt className="mono-data text-[10px] tracking-[0.18em] text-void/55">Median rate</dt>
                <dd className="mt-8 font-lyon-display text-[32px] leading-none">31%</dd>
              </div>
              <div>
                <dt className="mono-data text-[10px] tracking-[0.18em] text-void/55">Kept year one</dt>
                <dd className="mt-8 font-lyon-display text-[32px] leading-none">94%</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- closing */}
      <section className="mx-auto max-w-[1200px] px-16 pb-60 text-center sm:px-24 sm:pb-100">
        <h2 className="mx-auto max-w-[760px] font-lyon-display text-[36px] leading-[1.05] text-cloud sm:text-[56px]">
          Start with what you <em className="italic">already</em> have.
        </h2>
        <p className="mx-auto mt-20 max-w-[520px] text-body leading-relaxed text-ash">
          Link an account and the picture assembles itself. Nothing to configure, nothing to score.
        </p>
        <div className="mt-32 flex flex-wrap items-center justify-center gap-12">
          <ButtonLink to="/dashboard" tone="primary" size="lg" trailingArrow>
            Open the workspace
          </ButtonLink>
          <Button
            tone="ghost"
            size="lg"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to top
          </Button>
        </div>
      </section>

      {/* -------------------------------------------------------- footer */}
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-24 px-16 py-40 sm:flex-row sm:items-center sm:justify-between sm:px-24">
          <div className="flex items-center gap-10 text-cloud">
            <IconLogo size={20} className="text-pure" />
            <span className="font-lyon-display text-subheading leading-none">Origin</span>
          </div>
          <p className="max-w-[440px] text-caption leading-relaxed text-fog">
            Origin is a design exercise built on a synthetic ledger. Figures are derived, internally
            consistent, and not financial advice.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-6 text-body-sm text-ash transition-colors hover:text-cloud"
          >
            Enter the workspace
            <IconArrowRight size={14} />
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Press-recognition laurel: leaves sit on the branch, not beside it. */
function Laurel({ flipped = false }: { flipped?: boolean }) {
  const leaves = [
    { x: 8.6, y: 4.6, r: -58 },
    { x: 5.8, y: 7.8, r: -32 },
    { x: 4.3, y: 12.2, r: -6 },
    { x: 4.9, y: 17.2, r: 26 },
    { x: 7.4, y: 21.4, r: 54 },
  ];
  return (
    <svg
      width="17"
      height="28"
      viewBox="0 0 17 28"
      fill="none"
      aria-hidden="true"
      style={flipped ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M13 2.4C7.4 5.3 4.6 9.3 4.6 14s2.8 8.7 8.4 11.6"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
      />
      {leaves.map((leaf) => (
        <ellipse
          key={`${leaf.x}-${leaf.y}`}
          cx={leaf.x}
          cy={leaf.y}
          rx="3.9"
          ry="1.7"
          fill="currentColor"
          opacity="0.85"
          transform={`rotate(${leaf.r} ${leaf.x} ${leaf.y})`}
        />
      ))}
    </svg>
  );
}
