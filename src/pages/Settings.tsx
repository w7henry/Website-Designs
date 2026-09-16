import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ACCOUNT_KIND_LABEL, data } from '../data';
import { cn } from '../lib/cn';
import { formatDayYear } from '../lib/format';
import { useStore } from '../state/store';
import { AddAccountCard } from '../components/finance/AddAccountCard';
import { KeyValue, SectionHeading } from '../components/finance/atoms';
import { Button, Card, Divider, MonoLabel } from '../components/ui/primitives';
import { Field, Input, Switch } from '../components/ui/controls';
import { IconCheck, IconLock, IconShield } from '../components/ui/icons';

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'connected', label: 'Connected accounts' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'privacy', label: 'Privacy' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

export function Settings() {
  const { section = 'profile' } = useParams();
  const navigate = useNavigate();
  const store = useStore();

  const active = useMemo<SectionId>(
    () => (SECTIONS.some((s) => s.id === section) ? (section as SectionId) : 'profile'),
    [section],
  );

  return (
    <div className="flex flex-col gap-24">
      <SectionHeading eyebrow={store.profile.email} title="Settings" />

      <div className="grid grid-cols-1 gap-20 lg:grid-cols-[210px_1fr] lg:gap-32">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-84 lg:self-start">
          <ul className="no-scrollbar -mx-16 flex gap-6 overflow-x-auto px-16 lg:mx-0 lg:flex-col lg:px-0">
            {SECTIONS.map((item) => {
              const isActive = item.id === active;
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/settings/${item.id}`)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'w-full whitespace-nowrap rounded-lg px-12 py-8 text-left text-body-sm',
                      'transition-colors duration-200 ease-[var(--ease-state)]',
                      isActive ? 'bg-glass text-cloud' : 'text-ash hover:bg-glass/60 hover:text-cloud',
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 max-w-[780px]">
          {active === 'profile' && <ProfileSection />}
          {active === 'security' && <SecuritySection />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'connected' && <ConnectedSection />}
          {active === 'preferences' && <PreferencesSection />}
          {active === 'appearance' && <AppearanceSection />}
          {active === 'privacy' && <PrivacySection />}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="mb-12">
      <MonoLabel>{title}</MonoLabel>
      <p className="mt-10 max-w-[560px] text-body-sm leading-relaxed text-ash">{description}</p>
      <Divider className="my-20" />
      {children}
      {footer && <div className="mt-20 border-t border-hairline pt-16">{footer}</div>}
    </Card>
  );
}

function ProfileSection() {
  const { profile, setProfileField } = useStore();
  return (
    <>
      <Panel
        title="Profile"
        description="How you appear across Origin. Changing your email starts a verification step."
        footer={
          <p className="flex items-center gap-8 text-caption text-fog">
            <IconCheck size={13} />
            Saved automatically as you type
          </p>
        }
      >
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
          <Field label="Full name" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={profile.name}
              onChange={(event) => setProfileField('name', event.target.value)}
            />
          </Field>
          <Field label="Email" htmlFor="profile-email">
            <Input
              id="profile-email"
              type="email"
              value={profile.email}
              onChange={(event) => setProfileField('email', event.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="profile-phone">
            <Input
              id="profile-phone"
              value={profile.phone}
              onChange={(event) => setProfileField('phone', event.target.value)}
            />
          </Field>
          <Field label="Time zone" htmlFor="profile-tz">
            <Input
              id="profile-tz"
              value={profile.timezone}
              onChange={(event) => setProfileField('timezone', event.target.value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Plan" description="What your membership includes today.">
        <dl className="divide-y divide-white/6">
          <KeyValue label="Plan">{data.user.plan}</KeyValue>
          <KeyValue label="Member since">{data.user.memberSince}</KeyValue>
          <KeyValue label="Accounts linked">{data.accounts.length} of unlimited</KeyValue>
          <KeyValue label="Billing">Annual · renews 14 March</KeyValue>
        </dl>
      </Panel>
    </>
  );
}

function SecuritySection() {
  const { security, setSecurityPref } = useStore();
  return (
    <>
      <Panel
        title="Security"
        description="Origin holds read-only access to your accounts and can never move money."
      >
        <div className="divide-y divide-white/6">
          <Switch
            label="Two-factor authentication"
            description="Required at sign-in from a new device."
            checked={security.twoFactor}
            onChange={(next) => setSecurityPref('twoFactor', next)}
          />
          <Switch
            label="Biometric unlock"
            description="Face or fingerprint on supported devices."
            checked={security.biometric}
            onChange={(next) => setSecurityPref('biometric', next)}
          />
          <Switch
            label="Alert on unusual charges"
            description="A push whenever something sits well outside your pattern."
            checked={security.transactionAlerts}
            onChange={(next) => setSecurityPref('transactionAlerts', next)}
          />
        </div>
      </Panel>

      <Panel
        title="Sessions"
        description="Devices currently signed in. Revoking one ends it immediately."
      >
        <ul className="divide-y divide-white/6">
          {[
            { device: 'MacBook Pro · Safari', place: 'Brooklyn, NY', when: 'Active now', current: true },
            { device: 'iPhone 17 · Origin app', place: 'Brooklyn, NY', when: '2 hours ago', current: false },
            { device: 'iPad Air · Safari', place: 'Kingston, NY', when: '12 June', current: false },
          ].map((session) => (
            <li key={session.device} className="flex items-center justify-between gap-16 py-14">
              <div className="min-w-0">
                <p className="truncate text-body-sm text-cloud">{session.device}</p>
                <p className="mono-data mt-4 text-[10px] text-fog">
                  {session.place} · {session.when}
                </p>
              </div>
              {session.current ? (
                <span className="mono-data shrink-0 rounded-full bg-glass px-8 py-2 text-[9px] text-ash">
                  This device
                </span>
              ) : (
                <Button size="sm" tone="quiet">
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Password" description="Last changed 4 February 2026.">
        <Button tone="ghost" size="sm">
          <IconLock size={14} />
          Change password
        </Button>
      </Panel>
    </>
  );
}

function NotificationsSection() {
  const { notificationPrefs, setNotificationPref } = useStore();
  const items = [
    { key: 'paycheck', label: 'Money arriving', description: 'Paychecks, transfers and refunds as they clear.' },
    { key: 'budgets', label: 'Budget edges', description: 'When a category passes 80% of its limit.' },
    { key: 'market', label: 'Portfolio moves', description: 'Weekly summary, plus moves beyond 3% in a day.' },
    { key: 'security', label: 'Security', description: 'New sign-ins and changes to your details. Always on for high risk events.' },
    { key: 'weekly', label: 'Weekly review', description: 'Sunday evening: what moved, what is due, what changed.' },
    { key: 'productNews', label: 'Product news', description: 'Occasional notes when something meaningful ships.' },
  ] as const;

  return (
    <Panel
      title="Notifications"
      description="Origin sends few things, and only when they would change what you do next."
    >
      <div className="divide-y divide-white/6">
        {items.map((item) => (
          <Switch
            key={item.key}
            label={item.label}
            description={item.description}
            checked={notificationPrefs[item.key]}
            onChange={(next) => setNotificationPref(item.key, next)}
            disabled={item.key === 'security'}
          />
        ))}
      </div>
    </Panel>
  );
}

function ConnectedSection() {
  return (
    <>
      <Panel
        title="Connected accounts"
        description="Every connection is read-only and can be removed without affecting your bank."
      >
        <ul className="divide-y divide-white/6">
          {data.accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-16 py-14">
              <div className="min-w-0">
                <p className="truncate text-body-sm text-cloud">{account.name}</p>
                <p className="mono-data mt-4 text-[10px] text-fog">
                  {account.institution} · {ACCOUNT_KIND_LABEL[account.kind]} ·· {account.mask} ·
                  linked {formatDayYear(account.openedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-10">
                <span className="mono-data rounded-full bg-glass px-8 py-2 text-[9px] text-ash">
                  Connected
                </span>
                <Button size="sm" tone="quiet">
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="max-w-[420px]">
        <AddAccountCard />
      </div>
    </>
  );
}

function PreferencesSection() {
  const { preferences, setPreference } = useStore();
  return (
    <Panel
      title="Preferences"
      description="Small choices about how figures and dates are presented to you."
    >
      <div className="divide-y divide-white/6">
        <Switch
          label="Round figures"
          description="Drop the cents everywhere except transaction detail."
          checked={preferences.roundedFigures}
          onChange={(next) => setPreference('roundedFigures', next)}
        />
        <Switch
          label="Weeks start on Monday"
          description="Affects weekly cash flow grouping."
          checked={preferences.weekStartsMonday}
          onChange={(next) => setPreference('weekStartsMonday', next)}
        />
        <Switch
          label="Compact density"
          description="Tighter rows in long lists."
          checked={preferences.compactDensity}
          onChange={(next) => setPreference('compactDensity', next)}
        />
      </div>
    </Panel>
  );
}

function AppearanceSection() {
  const { preferences, setPreference } = useStore();
  return (
    <>
      <Panel
        title="Appearance"
        description="Origin is designed for low light. The dark canvas is the product, not a mode."
      >
        <div className="flex flex-col gap-12 sm:flex-row">
          <div className="flex-1 rounded-xl border border-hairline-strong bg-obsidian p-16">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-cloud">Obsidian</span>
              <IconCheck size={15} className="text-cloud" />
            </div>
            <div className="mt-14 flex gap-6">
              {['bg-obsidian', 'bg-graphite', 'bg-steel', 'bg-silver', 'bg-pure'].map((tone) => (
                <span
                  key={tone}
                  className={cn('h-20 flex-1 rounded border border-hairline', tone)}
                />
              ))}
            </div>
            <p className="mt-12 text-caption text-fog">The only theme, and the one it was drawn in.</p>
          </div>
          <div className="flex-1 rounded-xl border border-dashed border-hairline p-16 opacity-55">
            <span className="text-body-sm text-ash">Daylight</span>
            <div className="mt-14 flex gap-6">
              {['bg-cloud', 'bg-silver', 'bg-ash', 'bg-fog', 'bg-graphite'].map((tone) => (
                <span key={tone} className={cn('h-20 flex-1 rounded', tone)} />
              ))}
            </div>
            <p className="mt-12 text-caption text-fog">In design. Not yet available.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Motion" description="Transitions are short and purposeful by default.">
        <div className="divide-y divide-white/6">
          <Switch
            label="Interface motion"
            description="Turning this off also respects your system's reduced motion setting."
            checked={preferences.motion}
            onChange={(next) => setPreference('motion', next)}
          />
        </div>
      </Panel>
    </>
  );
}

function PrivacySection() {
  const { preferences, setPreference, resetWorkspace } = useStore();
  return (
    <>
      <Panel
        title="Privacy"
        description="What Origin shows on screen, and what it keeps."
      >
        <div className="divide-y divide-white/6">
          <Switch
            label="Hide balances"
            description="Masks every figure instantly. Useful on a shared screen."
            checked={preferences.hideBalances}
            onChange={(next) => setPreference('hideBalances', next)}
          />
        </div>
        <p className="mt-20 flex items-start gap-10 rounded-lg border border-hairline bg-abyss px-14 py-14 text-caption leading-relaxed text-fog">
          <IconShield size={15} className="mt-1 shrink-0" />
          Your notes, categories, budget limits and goal contributions are stored on this device
          only. Origin never sells data, and never shares it with advertisers.
        </p>
      </Panel>

      <Panel
        title="Your data"
        description="Export everything, or clear the changes you have made in this workspace."
      >
        <div className="flex flex-wrap gap-10">
          <Button tone="ghost" size="sm">
            Export all data
          </Button>
          <Button tone="danger" size="sm" onClick={resetWorkspace}>
            Reset workspace
          </Button>
        </div>
        <p className="mt-14 text-caption text-fog">
          Resetting clears local edits — notes, categories, budget limits and goal top-ups. Your
          accounts and transactions are untouched.
        </p>
      </Panel>
    </>
  );
}
