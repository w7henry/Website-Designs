import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CategoryId, Goal, Transaction } from '../data';
import { data } from '../data';

const STORAGE_KEY = 'origin.workspace.v1';

export interface TransactionOverride {
  categoryId?: CategoryId;
  note?: string;
  recurring?: boolean;
  /** Set when a transaction has been split into parts. */
  splits?: { label: string; amount: number; categoryId: CategoryId }[];
}

export interface Preferences {
  hideBalances: boolean;
  roundedFigures: boolean;
  weekStartsMonday: boolean;
  compactDensity: boolean;
  motion: boolean;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  currency: string;
}

export interface NotificationPrefs {
  paycheck: boolean;
  budgets: boolean;
  market: boolean;
  security: boolean;
  weekly: boolean;
  productNews: boolean;
}

export interface SecurityPrefs {
  twoFactor: boolean;
  biometric: boolean;
  transactionAlerts: boolean;
}

interface PersistedState {
  overrides: Record<string, TransactionOverride>;
  goalTopUps: Record<string, number>;
  goalContributions: Record<string, number>;
  budgetLimits: Partial<Record<CategoryId, number>>;
  readNotifications: string[];
  dismissedInsights: string[];
  preferences: Preferences;
  profile: Profile;
  notificationPrefs: NotificationPrefs;
  security: SecurityPrefs;
}

const DEFAULT_STATE: PersistedState = {
  overrides: {},
  goalTopUps: {},
  goalContributions: {},
  budgetLimits: {},
  readNotifications: [],
  dismissedInsights: [],
  preferences: {
    hideBalances: false,
    roundedFigures: false,
    weekStartsMonday: true,
    compactDensity: false,
    motion: true,
  },
  profile: {
    name: data.user.name,
    email: data.user.email,
    phone: '+1 (347) 555 0142',
    timezone: 'America/New_York',
    currency: 'USD',
  },
  notificationPrefs: {
    paycheck: true,
    budgets: true,
    market: true,
    security: true,
    weekly: true,
    productNews: false,
  },
  security: {
    twoFactor: true,
    biometric: true,
    transactionAlerts: true,
  },
};

function load(): PersistedState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      preferences: { ...DEFAULT_STATE.preferences, ...parsed.preferences },
      profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
      notificationPrefs: { ...DEFAULT_STATE.notificationPrefs, ...parsed.notificationPrefs },
      security: { ...DEFAULT_STATE.security, ...parsed.security },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

interface StoreValue extends PersistedState {
  transactions: Transaction[];
  goals: Goal[];
  unreadCount: number;
  setOverride: (id: string, patch: TransactionOverride) => void;
  clearOverride: (id: string) => void;
  topUpGoal: (id: string, amount: number) => void;
  setGoalContribution: (id: string, amount: number) => void;
  setBudgetLimit: (category: CategoryId, limit: number) => void;
  resetBudgets: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissInsight: (id: string) => void;
  restoreInsights: () => void;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  setProfileField: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  setNotificationPref: <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K],
  ) => void;
  setSecurityPref: <K extends keyof SecurityPrefs>(key: K, value: SecurityPrefs[K]) => void;
  resetWorkspace: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage can be unavailable — the app still works in memory */
    }
  }, [state]);

  const patch = useCallback((updater: (prev: PersistedState) => PersistedState) => {
    setState(updater);
  }, []);

  /** Transactions with the user's own edits applied. */
  const transactions = useMemo(() => {
    if (Object.keys(state.overrides).length === 0) return data.transactions;
    return data.transactions.map((tx) => {
      const override = state.overrides[tx.id];
      if (!override) return tx;
      return {
        ...tx,
        categoryId: override.categoryId ?? tx.categoryId,
        recurring: override.recurring ?? tx.recurring,
      };
    });
  }, [state.overrides]);

  const goals = useMemo(() => {
    const hasTopUps = Object.keys(state.goalTopUps).length > 0;
    const hasContrib = Object.keys(state.goalContributions).length > 0;
    if (!hasTopUps && !hasContrib) return data.goals;
    return data.goals.map((goal) => ({
      ...goal,
      current: Math.min(goal.target, goal.current + (state.goalTopUps[goal.id] ?? 0)),
      monthlyContribution: state.goalContributions[goal.id] ?? goal.monthlyContribution,
    }));
  }, [state.goalTopUps, state.goalContributions]);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      transactions,
      goals,
      unreadCount: data.notifications.filter((n) => !state.readNotifications.includes(n.id)).length,
      setOverride: (id, next) =>
        patch((prev) => ({
          ...prev,
          overrides: { ...prev.overrides, [id]: { ...prev.overrides[id], ...next } },
        })),
      clearOverride: (id) =>
        patch((prev) => {
          const overrides = { ...prev.overrides };
          delete overrides[id];
          return { ...prev, overrides };
        }),
      topUpGoal: (id, amount) =>
        patch((prev) => ({
          ...prev,
          goalTopUps: { ...prev.goalTopUps, [id]: (prev.goalTopUps[id] ?? 0) + amount },
        })),
      setGoalContribution: (id, amount) =>
        patch((prev) => ({
          ...prev,
          goalContributions: { ...prev.goalContributions, [id]: amount },
        })),
      setBudgetLimit: (category, limit) =>
        patch((prev) => ({
          ...prev,
          budgetLimits: { ...prev.budgetLimits, [category]: limit },
        })),
      resetBudgets: () => patch((prev) => ({ ...prev, budgetLimits: {} })),
      markRead: (id) =>
        patch((prev) =>
          prev.readNotifications.includes(id)
            ? prev
            : { ...prev, readNotifications: [...prev.readNotifications, id] },
        ),
      markAllRead: () =>
        patch((prev) => ({ ...prev, readNotifications: data.notifications.map((n) => n.id) })),
      dismissInsight: (id) =>
        patch((prev) =>
          prev.dismissedInsights.includes(id)
            ? prev
            : { ...prev, dismissedInsights: [...prev.dismissedInsights, id] },
        ),
      restoreInsights: () => patch((prev) => ({ ...prev, dismissedInsights: [] })),
      setPreference: (key, next) =>
        patch((prev) => ({ ...prev, preferences: { ...prev.preferences, [key]: next } })),
      setProfileField: (key, next) =>
        patch((prev) => ({ ...prev, profile: { ...prev.profile, [key]: next } })),
      setNotificationPref: (key, next) =>
        patch((prev) => ({
          ...prev,
          notificationPrefs: { ...prev.notificationPrefs, [key]: next },
        })),
      setSecurityPref: (key, next) =>
        patch((prev) => ({ ...prev, security: { ...prev.security, [key]: next } })),
      resetWorkspace: () => setState(DEFAULT_STATE),
    }),
    [state, transactions, goals, patch],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside <StoreProvider>');
  return value;
}

/** Respects the privacy preference wherever a figure is rendered. */
export function usePrivacy() {
  const { preferences } = useStore();
  return useCallback(
    (render: () => string) => (preferences.hideBalances ? '••••••' : render()),
    [preferences.hideBalances],
  );
}
