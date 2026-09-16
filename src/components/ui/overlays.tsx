import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { useEscape, useFocusTrap, useLockBodyScroll } from '../../lib/hooks';
import { IconButton } from './primitives';
import { IconClose } from './icons';

function Backdrop({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <div
      aria-hidden="true"
      onClick={onClick}
      className={cn('animate-fade fixed inset-0 bg-void/70 backdrop-blur-[2px]', className)}
    />
  );
}

/** Keeps the exit transition on screen long enough to be seen. */
function usePresence(open: boolean, duration = 200) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration]);
  return mounted;
}

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: OverlayProps & { size?: 'sm' | 'md' | 'lg' }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = usePresence(open);
  useLockBodyScroll(open);
  useEscape(onClose, open);
  useFocusTrap(panelRef, open);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center">
      <Backdrop onClick={onClose} className={open ? '' : 'opacity-0 transition-opacity'} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'animate-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden',
          'rounded-t-3xl border border-hairline bg-obsidian sm:rounded-2xl',
          size === 'sm' && 'sm:max-w-[420px]',
          size === 'md' && 'sm:max-w-[560px]',
          size === 'lg' && 'sm:max-w-[760px]',
          !open && 'opacity-0 transition-opacity duration-200',
        )}
      >
        <header className="flex items-start justify-between gap-16 border-b border-hairline px-20 py-16 sm:px-24">
          <div className="min-w-0">
            <h2 className="font-lyon-display text-title text-cloud">{title}</h2>
            {description && <p className="mt-4 text-caption text-ash">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <IconClose size={16} />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-20 py-20 sm:px-24">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-10 border-t border-hairline px-20 py-14 sm:px-24">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, description, children, footer }: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = usePresence(open, 320);
  useLockBodyScroll(open);
  useEscape(onClose, open);
  useFocusTrap(panelRef, open);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex justify-end">
      <Backdrop onClick={onClose} className={open ? '' : 'opacity-0 transition-opacity'} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'animate-drawer relative flex h-full w-full flex-col border-l border-hairline bg-obsidian',
          'sm:max-w-[460px]',
          !open && 'translate-x-full transition-transform duration-300 ease-[var(--ease-state)]',
        )}
      >
        <header className="flex items-start justify-between gap-16 border-b border-hairline px-20 py-16 sm:px-24">
          <div className="min-w-0">
            <p className="mono-label">{description ?? 'Detail'}</p>
            <h2 className="mt-6 font-lyon-display text-title leading-tight text-cloud">{title}</h2>
          </div>
          <IconButton label="Close" onClick={onClose}>
            <IconClose size={16} />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <footer className="border-t border-hairline px-20 py-14 sm:px-24">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** A bare portal surface — used by the command menu, which owns its chrome. */
export function Overlay({
  open,
  onClose,
  label,
  children,
  align = 'top',
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  align?: 'top' | 'center';
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = usePresence(open);
  useLockBodyScroll(open);
  useEscape(onClose, open);
  useFocusTrap(panelRef, open);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-100 flex justify-center px-16',
        align === 'top' ? 'items-start pt-[12vh]' : 'items-center',
      )}
    >
      <Backdrop onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn('animate-sheet relative w-full max-w-[620px]', !open && 'opacity-0')}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
