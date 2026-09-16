import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { StoreProvider } from './state/store';
import { ErrorBoundary } from './components/ui/states';
import { Overview } from './pages/Overview';
import { Accounts } from './pages/Accounts';
import { AccountDetail } from './pages/AccountDetail';
import { Transactions } from './pages/Transactions';
import { Analytics } from './pages/Analytics';
import { Investments } from './pages/Investments';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Insights } from './pages/Insights';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/:accountId" element={<AccountDetail />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/:section" element={<Settings />} />
              <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
}
