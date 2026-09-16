import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useHotkey, useLockBodyScroll } from '../../lib/hooks';
import { CommandMenu } from '../command/CommandMenu';
import { ErrorBoundary } from '../ui/states';
import { IconButton } from '../ui/primitives';
import { IconClose } from '../ui/icons';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { navItemFor } from './nav';

export function AppShell() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  useHotkey('k', (event) => {
    event.preventDefault();
    setCommandOpen((prev) => !prev);
  }, { meta: true, allowInInput: true });

  useHotkey('/', (event) => {
    event.preventDefault();
    setCommandOpen(true);
  });

  useLockBodyScroll(navOpen);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const item = navItemFor(pathname);
    document.title = item ? `${item.pageTitle} · Origin` : 'Origin — Private Wealth Workspace';
  }, [pathname]);

  const closeCommand = useCallback(() => setCommandOpen(false), []);

  return (
    <div className="min-h-dvh bg-obsidian">
      <a
        href="#main"
        className={cn(
          'sr-only focus:not-sr-only focus:fixed focus:left-16 focus:top-16 focus:z-100',
          'focus:rounded-lg focus:bg-pure focus:px-16 focus:py-10 focus:text-body-sm focus:text-void',
        )}
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[240px] lg:block">
        <Sidebar />
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-90 lg:hidden">
          <div
            aria-hidden="true"
            onClick={() => setNavOpen(false)}
            className="animate-fade absolute inset-0 bg-void/70"
          />
          <div className="animate-drawer absolute inset-y-0 left-0 w-[264px] max-w-[84vw]">
            <Sidebar onNavigate={() => setNavOpen(false)} />
            <IconButton
              label="Close navigation"
              onClick={() => setNavOpen(false)}
              className="absolute right-12 top-14"
            >
              <IconClose size={16} />
            </IconButton>
          </div>
        </div>
      )}

      <div className="lg:pl-[240px]">
        <TopBar onOpenSearch={() => setCommandOpen(true)} onOpenNav={() => setNavOpen(true)} />
        <main
          id="main"
          className="mx-auto w-full max-w-[1280px] px-16 pb-[calc(88px+env(safe-area-inset-bottom))] pt-24 sm:px-24 sm:pt-32 lg:pb-60"
        >
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <MobileNav />
      <CommandMenu open={commandOpen} onClose={closeCommand} />
    </div>
  );
}
