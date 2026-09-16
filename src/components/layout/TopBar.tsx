import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { data } from '../../data';
import { useStore } from '../../state/store';
import { Avatar, IconButton, MonoLabel } from '../ui/primitives';
import { Menu, MenuItem } from '../ui/controls';
import {
  IconChevronDown,
  IconEye,
  IconEyeOff,
  IconLogo,
  IconMenu,
  IconSearch,
  IconSettings,
  IconShield,
  IconUser,
} from '../ui/icons';
import { NotificationCenter } from './NotificationCenter';
import { navItemFor } from './nav';

export function TopBar({
  onOpenSearch,
  onOpenNav,
}: {
  onOpenSearch: () => void;
  onOpenNav: () => void;
}) {
  const { pathname } = useLocation();
  const { preferences, setPreference, profile } = useStore();
  const item = navItemFor(pathname);

  return (
    <header
      className={cn(
        'glass-chrome sticky top-0 z-50 flex h-60 items-center gap-8 border-b border-hairline px-16',
        'sm:h-64 sm:gap-12 sm:px-24',
      )}
    >
      <IconButton label="Open navigation" onClick={onOpenNav} className="lg:hidden">
        <IconMenu size={18} />
      </IconButton>

      <Link
        to="/dashboard"
        aria-label="Origin overview"
        className="mr-2 inline-flex size-36 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-glass lg:hidden"
      >
        <IconLogo size={19} className="text-pure" />
      </Link>

      <div className="hidden min-w-0 flex-1 lg:block">
        <MonoLabel>{item?.description ?? 'Private wealth workspace'}</MonoLabel>
        <h1 className="mt-2 truncate font-lyon-display text-subheading leading-tight text-cloud">
          {item?.pageTitle ?? 'Origin'}
        </h1>
      </div>

      <div className="min-w-0 flex-1 lg:hidden">
        <h1 className="truncate font-lyon-display text-subheading leading-none text-cloud">
          {item?.pageTitle ?? 'Origin'}
        </h1>
      </div>

      <button
        type="button"
        onClick={onOpenSearch}
        className={cn(
          'group hidden h-36 w-[248px] items-center gap-10 rounded-lg border border-hairline',
          'bg-obsidian px-12 text-body-sm text-ash transition-colors duration-200 ease-[var(--ease-state)]',
          'hover:border-hairline-strong hover:text-ash md:flex xl:w-[300px]',
        )}
      >
        <IconSearch size={15} className="shrink-0" />
        <span className="flex-1 text-left">Search</span>
        <kbd className="mono-data shrink-0 rounded border border-hairline px-5 py-1 text-[10px]">
          ⌘K
        </kbd>
      </button>

      <IconButton label="Search" onClick={onOpenSearch} className="md:hidden">
        <IconSearch size={17} />
      </IconButton>

      <IconButton
        label={preferences.hideBalances ? 'Show balances' : 'Hide balances'}
        onClick={() => setPreference('hideBalances', !preferences.hideBalances)}
        active={preferences.hideBalances}
        className="hidden sm:inline-flex"
      >
        {preferences.hideBalances ? <IconEyeOff size={17} /> : <IconEye size={17} />}
      </IconButton>

      <NotificationCenter />

      <Menu
        width={230}
        trigger={({ open, toggle }) => (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Account menu"
            className={cn(
              'flex items-center gap-8 rounded-lg border border-transparent p-2 pr-4',
              'transition-colors duration-200 ease-[var(--ease-state)] hover:bg-glass',
              open && 'border-hairline bg-glass',
            )}
          >
            <Avatar name={profile.name} size={30} />
            <IconChevronDown
              size={13}
              className={cn('hidden text-ash transition-transform duration-200 sm:block', open && 'rotate-180')}
            />
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="border-b border-hairline px-10 pb-10 pt-6">
              <p className="truncate text-body-sm text-cloud">{profile.name}</p>
              <p className="truncate text-caption text-ash">{profile.email}</p>
              <p className="mono-data mt-6 text-[10px] text-ash">
                {data.user.plan} · Member since {data.user.memberSince}
              </p>
            </div>
            <div className="pt-6">
              <MenuItem icon={<IconUser size={15} />} onClick={close}>
                <Link to="/settings/profile" className="block">
                  Profile
                </Link>
              </MenuItem>
              <MenuItem icon={<IconShield size={15} />} onClick={close}>
                <Link to="/settings/security" className="block">
                  Security
                </Link>
              </MenuItem>
              <MenuItem icon={<IconSettings size={15} />} onClick={close}>
                <Link to="/settings" className="block">
                  Settings
                </Link>
              </MenuItem>
              <MenuItem
                icon={preferences.hideBalances ? <IconEye size={15} /> : <IconEyeOff size={15} />}
                onClick={() => {
                  setPreference('hideBalances', !preferences.hideBalances);
                  close();
                }}
              >
                {preferences.hideBalances ? 'Show balances' : 'Hide balances'}
              </MenuItem>
            </div>
            <div className="mt-6 border-t border-hairline pt-6">
              <MenuItem onClick={close}>
                <Link to="/" className="block">
                  Sign out
                </Link>
              </MenuItem>
            </div>
          </>
        )}
      </Menu>
    </header>
  );
}
