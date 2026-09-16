import { cn } from '../../lib/cn';
import { IconPlus } from '../ui/icons';

/** A dashed affordance that completes a grid rather than leaving a hole. */
export function NewItemCard({
  title,
  body,
  onClick,
  className,
}: {
  title: string;
  body: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex min-h-[168px] w-full flex-col items-center justify-center gap-10 rounded-2xl',
        'border border-dashed border-hairline-strong p-20 text-center',
        'transition-colors duration-200 ease-[var(--ease-state)] hover:border-white/28 hover:bg-glass',
        className,
      )}
    >
      <span className="inline-flex size-32 items-center justify-center rounded-full border border-hairline text-ash transition-colors duration-200 group-hover:text-cloud">
        <IconPlus size={15} />
      </span>
      <span className="text-body-sm text-cloud">{title}</span>
      <span className="max-w-[240px] text-caption leading-snug text-fog">{body}</span>
    </button>
  );
}
