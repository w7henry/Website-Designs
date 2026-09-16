import {
  forwardRef,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { useEscape, useOnClickOutside } from '../../lib/hooks';
import { IconCheck, IconChevronDown, IconClose, IconSearch } from './icons';

/* ---------------------------------------------------------------- input */

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

export function Field({ label, hint, children, htmlFor, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <label htmlFor={htmlFor} className="mono-label">
        {label}
      </label>
      {children}
      {hint && <p className="text-caption text-fog">{hint}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-40 w-full rounded-lg border bg-obsidian px-12 text-body-sm text-cloud',
        'transition-colors duration-200 ease-[var(--ease-state)] placeholder:text-fog',
        'hover:border-hairline-strong focus:border-hairline-strong',
        invalid ? 'border-orchid-bloom/50' : 'border-hairline',
        className,
      )}
      {...rest}
    />
  );
});

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-80 w-full resize-y rounded-lg border border-hairline bg-obsidian px-12 py-10',
        'text-body-sm leading-relaxed text-cloud transition-colors duration-200',
        'placeholder:text-fog hover:border-hairline-strong focus:border-hairline-strong',
        className,
      )}
      {...rest}
    />
  );
}

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, onClear, className, placeholder = 'Search', ...rest },
  ref,
) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <IconSearch size={15} className="pointer-events-none absolute left-12 text-fog" />
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          'h-40 w-full rounded-lg border border-hairline bg-obsidian pl-34 pr-34',
          'text-body-sm text-cloud transition-colors duration-200 ease-[var(--ease-state)]',
          'placeholder:text-fog hover:border-hairline-strong focus:border-hairline-strong',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onValueChange('');
            onClear?.();
          }}
          className="absolute right-8 inline-flex size-24 items-center justify-center rounded-md text-fog transition-colors hover:bg-glass hover:text-cloud"
        >
          <IconClose size={13} />
        </button>
      )}
    </div>
  );
});

/* ---------------------------------------------------------------- switch */

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-16 py-14">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-body-sm text-cloud">
          {label}
        </label>
        {description && <p className="mt-2 text-caption leading-relaxed text-fog">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-2 h-20 w-34 shrink-0 rounded-full border transition-colors duration-200 ease-[var(--ease-state)]',
          'disabled:pointer-events-none disabled:opacity-40',
          checked ? 'border-transparent bg-pure' : 'border-hairline-strong bg-transparent',
        )}
      >
        <span
          className={cn(
            'absolute top-3 size-12 rounded-full transition-[left,background-color] duration-200 ease-[var(--ease-state)]',
            checked ? 'left-16 bg-void' : 'left-3 bg-ash',
          )}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------ segmented control */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  label,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  size?: 'sm' | 'md';
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-lg border border-hairline bg-abyss p-3',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={cn(
              'mono-data rounded-md transition-colors duration-200 ease-[var(--ease-state)]',
              size === 'sm' ? 'h-24 px-8 text-[10px]' : 'h-28 px-12 text-[11px]',
              active ? 'bg-pure text-void' : 'text-fog hover:bg-glass hover:text-cloud',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ tabs */

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('no-scrollbar -mb-px flex gap-24 overflow-x-auto border-b border-hairline', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative shrink-0 whitespace-nowrap pb-12 text-body-sm transition-colors duration-200',
              active ? 'text-cloud' : 'text-fog hover:text-ash',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-6 font-roboto-mono text-[10px] tabular-nums text-fog">
                {option.count}
              </span>
            )}
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-0 -bottom-px h-px transition-colors duration-200',
                active ? 'bg-pure' : 'bg-transparent',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- dropdown */

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  meta?: string;
  tint?: string;
}

export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select',
  className,
  align = 'start',
  width = 220,
}: {
  options: SelectOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  placeholder?: string;
  className?: string;
  align?: 'start' | 'end';
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useOnClickOutside([rootRef], () => setOpen(false), open);
  useEscape(() => setOpen(false), open);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex h-36 w-full items-center justify-between gap-10 rounded-lg border px-12',
          'text-body-sm transition-colors duration-200 ease-[var(--ease-state)]',
          open ? 'border-hairline-strong bg-glass text-cloud' : 'border-hairline text-ash hover:text-cloud',
        )}
      >
        <span className="flex min-w-0 items-center gap-8">
          {selected?.tint && (
            <span className="size-8 shrink-0 rounded-full" style={{ backgroundColor: selected.tint }} />
          )}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <IconChevronDown
          size={14}
          className={cn('shrink-0 text-fog transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          style={{ minWidth: width }}
          className={cn(
            'animate-pop absolute top-[calc(100%+6px)] z-40 max-h-[320px] overflow-y-auto rounded-xl',
            'border border-hairline bg-graphite p-6',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                role="option"
                type="button"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-12 rounded-lg px-10 py-8 text-left',
                  'text-body-sm transition-colors duration-200 ease-[var(--ease-state)]',
                  active ? 'bg-glass text-cloud' : 'text-ash hover:bg-glass hover:text-cloud',
                )}
              >
                <span className="flex min-w-0 items-center gap-8">
                  {option.tint && (
                    <span
                      className="size-8 shrink-0 rounded-full"
                      style={{ backgroundColor: option.tint }}
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-8">
                  {option.meta && (
                    <span className="font-roboto-mono text-[10px] tabular-nums text-fog">
                      {option.meta}
                    </span>
                  )}
                  {active && <IconCheck size={13} className="text-cloud" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- menu */

export function Menu({
  trigger,
  children,
  align = 'end',
  width = 200,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end';
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useOnClickOutside([rootRef], () => setOpen(false), open);
  useEscape(() => setOpen(false), open);

  return (
    <div ref={rootRef} className="relative">
      {trigger({ open, toggle: () => setOpen((prev) => !prev) })}
      {open && (
        <div
          style={{ minWidth: width }}
          className={cn(
            'animate-pop absolute top-[calc(100%+8px)] z-50 rounded-xl border border-hairline bg-graphite p-6',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  icon,
  danger,
  meta,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-10 rounded-lg px-10 py-8 text-left text-body-sm',
        'transition-colors duration-200 ease-[var(--ease-state)]',
        danger ? 'text-orchid-bloom hover:bg-orchid-bloom/10' : 'text-ash hover:bg-glass hover:text-cloud',
      )}
    >
      {icon && <span className="shrink-0 text-fog">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {meta && <span className="mono-data shrink-0 text-[10px] text-fog">{meta}</span>}
    </button>
  );
}
