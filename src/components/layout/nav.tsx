import type { ReactNode } from 'react';
import {
  IconAccounts,
  IconAnalytics,
  IconBudgets,
  IconGoals,
  IconInsights,
  IconInvestments,
  IconOverview,
  IconSettings,
  IconTransactions,
} from '../ui/icons';

export interface NavItem {
  to: string;
  label: string;
  icon: (props: { size?: number }) => ReactNode;
  /** Shown in the top bar and the document title. */
  pageTitle: string;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Money',
    items: [
      {
        to: '/dashboard',
        label: 'Overview',
        icon: IconOverview,
        pageTitle: 'Overview',
        description: 'Where everything stands today',
      },
      {
        to: '/accounts',
        label: 'Accounts',
        icon: IconAccounts,
        pageTitle: 'Accounts',
        description: 'Balances across every institution',
      },
      {
        to: '/transactions',
        label: 'Transactions',
        icon: IconTransactions,
        pageTitle: 'Transactions',
        description: 'Every movement, searchable',
      },
    ],
  },
  {
    label: 'Understand',
    items: [
      {
        to: '/analytics',
        label: 'Analytics',
        icon: IconAnalytics,
        pageTitle: 'Analytics',
        description: 'Spending and cash flow',
      },
      {
        to: '/investments',
        label: 'Investments',
        icon: IconInvestments,
        pageTitle: 'Investments',
        description: 'Portfolio and holdings',
      },
      {
        to: '/insights',
        label: 'Insights',
        icon: IconInsights,
        pageTitle: 'Insights',
        description: 'What changed and why it matters',
      },
    ],
  },
  {
    label: 'Plan',
    items: [
      {
        to: '/budgets',
        label: 'Budgets',
        icon: IconBudgets,
        pageTitle: 'Budgets',
        description: 'Limits and pace this month',
      },
      {
        to: '/goals',
        label: 'Goals',
        icon: IconGoals,
        pageTitle: 'Goals',
        description: 'What you are saving towards',
      },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = {
  to: '/settings',
  label: 'Settings',
  icon: IconSettings,
  pageTitle: 'Settings',
  description: 'Profile, security and preferences',
};

export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  SETTINGS_ITEM,
];

/** Five destinations reachable with a thumb; the rest sit behind More. */
export const MOBILE_PRIMARY = ['/dashboard', '/accounts', '/transactions', '/investments'];

export function navItemFor(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.filter((item) => pathname.startsWith(item.to)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0];
}
