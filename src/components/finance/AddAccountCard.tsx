import { useState } from 'react';
import { cn } from '../../lib/cn';
import { Button, MonoLabel } from '../ui/primitives';
import { Modal } from '../ui/overlays';
import { IconPlus, IconShield } from '../ui/icons';

const INSTITUTIONS = [
  'Northbank',
  'Aurum',
  'Halcyon Credit Union',
  'Meridian Wealth',
  'Vantage Trust',
  'Stonebridge',
];

export function AddAccountCard({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group flex min-h-[172px] w-full flex-col items-center justify-center gap-10 rounded-2xl',
          'border border-dashed border-hairline-strong p-20 text-center',
          'transition-colors duration-200 ease-[var(--ease-state)] hover:border-white/28 hover:bg-glass',
          className,
        )}
      >
        <span className="inline-flex size-34 items-center justify-center rounded-full border border-hairline text-ash transition-colors duration-200 group-hover:text-cloud">
          <IconPlus size={16} />
        </span>
        <span className="text-body-sm text-cloud">Link an account</span>
        <span className="max-w-[220px] text-caption leading-snug text-ash">
          Connect a bank, card or brokerage to see it alongside everything else.
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Link an account"
        description="Read-only access. Origin can never move your money."
        size="sm"
        footer={
          <>
            <Button tone="quiet" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button tone="primary" size="sm" onClick={() => setOpen(false)} trailingArrow>
              Continue
            </Button>
          </>
        }
      >
        <MonoLabel className="mb-12">Popular institutions</MonoLabel>
        <ul className="grid grid-cols-2 gap-8">
          {INSTITUTIONS.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="w-full rounded-lg border border-hairline px-12 py-14 text-left text-body-sm text-ash transition-colors duration-200 hover:border-hairline-strong hover:text-cloud"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-20 flex items-start gap-10 rounded-lg border border-hairline bg-abyss px-12 py-12 text-caption leading-relaxed text-ash">
          <IconShield size={15} className="mt-1 shrink-0" />
          Credentials are handled by your bank, never stored by Origin. Access is read-only and can
          be revoked at any time from Connected accounts.
        </p>
      </Modal>
    </>
  );
}
