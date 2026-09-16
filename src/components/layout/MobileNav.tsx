import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useEscape } from '../../lib/hooks';
import { ALL_NAV_ITEMS, MOBILE_PRIMARY, NAV_GROUPS, SETTINGS_ITEM } from './nav';
import { IconMore } from '../ui/icons';
import { MonoLabel } from '../ui/primitives';

const PRIMARY = MOBILE_PRIMARY.map(
  (path) => ALL_NAV_ITEMS.find((item) => item.to === path)!,
);

const SECONDARY = [
  ...NAV_GROUPS.flatMap((group) => group.items).filter(
    (item) => !MOBILE_PRIMARY.includes(item.to),
  ),
  SETTINGS_ITEM,
];

/** Bottom navigation: four thumb-reachable destinations plus a sheet. */
export function MobileNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = SECONDARY.some((item) => pathname.startsWith(item.to));

  useEscape(() => setSheetOpen(false), sheetOpen);

  return (
    <>
      {sheetOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setSheetOpen(false)}
            className="animate-fade fixed inset-0 z-70 bg-void/70 lg:hidden"
          />
          <div
            role="dialog"
            aria-label="More destinations"
            className={cn(
              'animate-sheet fixed inset-x-0 bottom-0 z-80 rounded-t-3xl border-t border-hairline',
              'bg-obsidian px-16 pb-[calc(84px+env(safe-area-inset-bottom))] pt-20 lg:hidden',
            )}
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-20 h-4 w-40 rounded-full bg-white/15"
            />
            <MonoLabel className="mb-12 px-4">More</MonoLabel>
            <div className="grid grid-cols-2 gap-8">
              {SECONDARY.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSheetOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-64 flex-col justify-center gap-6 rounded-xl border px-14 py-12',
                        'transition-colors duration-200 ease-[var(--ease-state)]',
                        isActive
                          ? 'border-hairline-strong bg-glass text-cloud'
                          : 'border-hairline text-ash',
                      )
                    }
                  >
                    <Icon size={17} />
                    <span className="text-body-sm">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </>
      )}

      <nav
        aria-label="Primary"
        className={cn(
          'glass-bar fixed inset-x-0 bottom-0 z-90 flex items-stretch border-t border-hairline',
          'pb-[env(safe-area-inset-bottom)] lg:hidden',
        )}
      >
        {PRIMARY.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setSheetOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-56 flex-1 flex-col items-center justify-center gap-4 px-4 pt-8 pb-6',
                  'transition-colors duration-200 ease-[var(--ease-state)]',
                  isActive ? 'text-cloud' : 'text-fog',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-2 w-16 rounded-full transition-colors duration-200',
                      isActive ? 'bg-pure' : 'bg-transparent',
                    )}
                  />
                  <Icon size={18} />
                  <span className="mono-data text-[9px] tracking-[0.06em]">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setSheetOpen((prev) => !prev)}
          aria-expanded={sheetOpen}
          className={cn(
            'flex min-h-56 flex-1 flex-col items-center justify-center gap-4 px-4 pt-8 pb-6',
            'transition-colors duration-200 ease-[var(--ease-state)]',
            moreActive || sheetOpen ? 'text-cloud' : 'text-fog',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-2 w-16 rounded-full transition-colors duration-200',
              moreActive || sheetOpen ? 'bg-pure' : 'bg-transparent',
            )}
          />
          <IconMore size={18} />
          <span className="mono-data text-[9px] tracking-[0.06em]">More</span>
        </button>
      </nav>
    </>
  );
}
