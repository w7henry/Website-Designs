import { NavLink, Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { data } from '../../data';
import { useStore } from '../../state/store';
import { Amount } from '../finance/atoms';
import { IconLogo, IconChevronRight } from '../ui/icons';
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from './nav';

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      end={item.to === '/dashboard'}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-12 rounded-lg px-10 py-8 text-body-sm',
          'transition-colors duration-200 ease-[var(--ease-state)]',
          isActive ? 'bg-glass text-cloud' : 'text-ash hover:bg-glass/60 hover:text-cloud',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-0 top-1/2 h-14 w-2 -translate-y-1/2 rounded-full transition-colors duration-200',
              isActive ? 'bg-pure' : 'bg-transparent',
            )}
          />
          <Icon size={16} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { preferences } = useStore();

  return (
    <div className="flex h-full flex-col border-r border-hairline bg-abyss">
      <div className="flex h-64 shrink-0 items-center px-20">
        <Link
          to="/"
          onClick={onNavigate}
          className="group inline-flex items-center gap-10 rounded-lg text-cloud"
        >
          <IconLogo size={22} className="text-pure" />
          <span className="font-lyon-display text-subheading leading-none">Origin</span>
        </Link>
      </div>

      <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto px-12 pb-12">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-20">
            <p className="mono-label px-10 pb-8">{group.label}</p>
            <div className="flex flex-col gap-2">
              {group.items.map((item) => (
                <NavRow key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-hairline p-12">
        <NavRow item={SETTINGS_ITEM} onNavigate={onNavigate} />

        <Link
          to="/accounts"
          onClick={onNavigate}
          className="group mt-12 block rounded-xl border border-hairline bg-obsidian p-14 transition-colors duration-200 hover:border-hairline-strong"
        >
          <p className="mono-label">Net worth</p>
          <p className="mt-8 flex items-center justify-between gap-8">
            <span className="font-lyon-display text-subheading leading-none text-cloud">
              <Amount value={data.netWorth} cents={!preferences.roundedFigures} />
            </span>
            <IconChevronRight
              size={14}
              className="shrink-0 text-ash transition-transform duration-200 group-hover:translate-x-2 group-hover:text-cloud"
            />
          </p>
          <p className="mono-data mt-8 text-[10px] text-ash">
            {data.accounts.length} accounts linked
          </p>
        </Link>
      </div>
    </div>
  );
}
