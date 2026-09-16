import { useMemo } from 'react';
import { data, lastActivity, sliceRange, type Account } from '../data';
import { useFirstLoad } from '../lib/hooks';
import { AddAccountCard } from '../components/finance/AddAccountCard';
import { AccountRow, AccountRowSkeleton } from '../components/finance/AccountRow';
import { Amount, DisplayAmount, SectionHeading } from '../components/finance/atoms';
import { Card, MonoLabel, Skeleton } from '../components/ui/primitives';

const GROUPS: { label: string; blurb: string; kinds: Account['kind'][] }[] = [
  { label: 'Cash', blurb: 'Immediately available', kinds: ['checking', 'savings', 'reserve'] },
  { label: 'Invested', blurb: 'Market exposed', kinds: ['investment'] },
  { label: 'Credit', blurb: 'Owed', kinds: ['credit'] },
];

export function Accounts() {
  const loading = useFirstLoad('accounts');

  const totals = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    for (const account of data.accounts) {
      if (account.balance >= 0) assets += account.balance;
      else liabilities += -account.balance;
    }
    return { assets, liabilities };
  }, []);

  const institutions = new Set(data.accounts.map((a) => a.institution)).size;

  return (
    <div className="flex flex-col gap-32">
      <section className="animate-reveal">
        <MonoLabel>Net worth</MonoLabel>
        {loading ? (
          <Skeleton className="mt-16 h-48 w-[300px]" />
        ) : (
          <p className="mt-12 leading-none text-cloud">
            <DisplayAmount
              value={data.netWorth}
              className="text-[40px] leading-[0.95] sm:text-[56px]"
              centsClassName="text-[0.44em]"
            />
          </p>
        )}
        <p className="mt-16 flex flex-wrap items-center gap-x-20 gap-y-6">
          <span className="text-body-sm text-ash">
            <span className="mono-label mr-8 inline">Assets</span>
            <Amount value={totals.assets} cents={false} className="text-cloud" />
          </span>
          <span className="text-body-sm text-ash">
            <span className="mono-label mr-8 inline">Liabilities</span>
            <Amount value={-totals.liabilities} signed cents={false} className="text-cloud" />
          </span>
          <span className="text-body-sm text-ash">
            {data.accounts.length} accounts across {institutions} institutions
          </span>
        </p>
      </section>

      <Card padded={false} className="px-8 pb-8 pt-4 sm:px-12">
        {GROUPS.map((group) => {
          const accounts = data.accounts.filter((account) => group.kinds.includes(account.kind));
          if (accounts.length === 0) return null;
          const subtotal = accounts.reduce((acc, account) => acc + account.balance, 0);

          return (
            <section key={group.label}>
              <header className="flex items-baseline justify-between gap-16 border-b border-hairline px-8 pb-10 pt-20 sm:px-12">
                <div className="flex items-baseline gap-12">
                  <h2 className="mono-label">{group.label}</h2>
                  <span className="text-caption text-ash">{group.blurb}</span>
                </div>
                <span className="tnum text-body-sm text-cloud">
                  <Amount value={subtotal} signed={subtotal < 0} />
                </span>
              </header>

              <div className="pt-4">
                {loading
                  ? accounts.map((account) => <AccountRowSkeleton key={account.id} />)
                  : accounts.map((account) => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        series={sliceRange(data.accountSeries.get(account.id) ?? [], '3M')}
                        lastActivity={lastActivity(account.id)}
                        today={data.anchor}
                      />
                    ))}
              </div>
            </section>
          );
        })}

        <footer className="mt-12 flex items-center justify-between gap-16 border-t border-hairline px-8 pb-6 pt-16 sm:px-12">
          <span className="mono-label">Net worth</span>
          <span className="tnum text-subheading text-cloud">
            <Amount value={data.netWorth} />
          </span>
        </footer>
      </Card>

      <section>
        <SectionHeading eyebrow="Coverage" title="Add something we're missing" />
        <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <AddAccountCard />
          <Card surface="inverted" className="flex flex-col justify-between gap-16">
            <p className="mono-data text-[10px] tracking-[0.18em] text-void/55">Why link more</p>
            <p className="font-lyon-display text-title leading-snug text-void">
              A complete picture is the only picture worth acting on.
            </p>
            <p className="text-body-sm leading-relaxed text-void/70">
              Every account you connect sharpens your net worth, your cash flow and the pace of
              every budget. Read-only, revocable, and never sold.
            </p>
          </Card>
          <Card className="flex flex-col justify-between gap-16">
            <MonoLabel>Connected today</MonoLabel>
            <ul className="flex flex-col gap-10">
              {[...new Set(data.accounts.map((a) => a.institution))].map((institution) => (
                <li key={institution} className="flex items-center justify-between gap-12">
                  <span className="truncate text-body-sm text-ash">{institution}</span>
                  <span className="mono-data shrink-0 text-[10px] text-ash">
                    {(() => {
                      const count = data.accounts.filter(
                        (a) => a.institution === institution,
                      ).length;
                      return `${count} ${count === 1 ? 'account' : 'accounts'}`;
                    })()}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-caption leading-relaxed text-ash">
              Balances refreshed today at 6:05am. Nothing here is delayed.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
