import type { SVGProps } from 'react';

/**
 * Minimal monoline SVGs at 1.5px stroke, rendered in currentColor
 * (DESIGN.md → Imagery). No filled glyphs, no multi-tone marks.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconOverview = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 13h5l2.5-6 3 12L16 13h5" />
  </Icon>
);

export const IconAccounts = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M3 10.5h18M16.5 15h1.5" />
  </Icon>
);

export const IconTransactions = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3" />
  </Icon>
);

export const IconAnalytics = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Icon>
);

export const IconInvestments = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 17l5.5-6 4 3.5L21 6" />
    <path d="M21 11V6h-5" />
  </Icon>
);

export const IconBudgets = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 18a8 8 0 1 1 16 0" />
    <path d="M12 18l4.5-5" />
  </Icon>
);

export const IconGoals = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </Icon>
);

export const IconInsights = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l1.9 4.9L19 9.8l-4.2 3.3.6 5.3-3.4-2.6-3.4 2.6.6-5.3L5 9.8l5.1-1.9z" />
  </Icon>
);

export const IconSettings = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
  </Icon>
);

export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Icon>
);

export const IconBell = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.3 19a2 2 0 0 0 3.4 0" />
  </Icon>
);

export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9.5l6 5.5 6-5.5" />
  </Icon>
);

export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 5.5l6 6.5-6 6.5" />
  </Icon>
);

export const IconChevronLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 5.5l-6 6.5 6 6.5" />
  </Icon>
);

export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h15M13.5 6.5L20 12l-6.5 5.5" />
  </Icon>
);

export const IconArrowUpRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 17L17 7M8.5 7H17v8.5" />
  </Icon>
);

export const IconArrowDownRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 7l10 10M17 8.5V17H8.5" />
  </Icon>
);

export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icon>
);

export const IconClose = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const IconFilter = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6h18M6.5 12h11M10 18h4" />
  </Icon>
);

export const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
  </Icon>
);

export const IconDownload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5v11M8 11l4 4 4-4M4.5 19.5h15" />
  </Icon>
);

export const IconLock = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </Icon>
);

export const IconShield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l7 2.5v6c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5v-6z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const IconUser = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" />
  </Icon>
);

export const IconEye = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Icon>
);

export const IconEyeOff = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.6 9.7a2.8 2.8 0 0 0 3.9 3.9" />
    <path d="M6.3 6.6C4 8.2 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.6 0 3-.4 4.2-1M14 6c5 1.2 7.5 6 7.5 6s-.8 1.5-2.3 3" />
  </Icon>
);

export const IconMenu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const IconMore = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconSort = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
  </Icon>
);

export const IconRefresh = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20 4v4.5h-4.5" />
  </Icon>
);

export const IconInfo = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconAlert = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.8L21 19.5H3z" />
    <path d="M12 9.5v4.5" />
    <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconTrash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
  </Icon>
);

export const IconEdit = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="M14.5 5.5l4 4" />
  </Icon>
);

export const IconSplit = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h4l5 6 5-6h2M4 18h4l3.2-3.8M17 18h3" />
    <path d="M17 15l3 3-3 3" />
  </Icon>
);

export const IconTag = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 11V4.5H10L20.5 15 14 21.5z" />
    <circle cx="7.5" cy="8.5" r="1.2" />
  </Icon>
);

export const IconNote = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 4h14v11l-5 5H5z" />
    <path d="M19 15h-5v5M8.5 8.5h7M8.5 12h5" />
  </Icon>
);

export const IconClock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const IconRepeat = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9a5 5 0 0 1 5-5h11" />
    <path d="M16.5 1l3.5 3-3.5 3M20 15a5 5 0 0 1-5 5H4" />
    <path d="M7.5 23L4 20l3.5-3" />
  </Icon>
);

export const IconCommand = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" />
  </Icon>
);

export const IconLogo = ({ size = 24, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

export const IconSpark = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.4 6.4l2.8 2.8M14.8 14.8l2.8 2.8M17.6 6.4l-2.8 2.8M9.2 14.8l-2.8 2.8" />
  </Icon>
);

export const IconWallet = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h10.5v2.5" />
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
    <circle cx="16.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
  </Icon>
);
