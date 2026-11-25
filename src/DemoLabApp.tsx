import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { ApiTester } from './components/ApiTester';
import { FormLab } from './components/FormLab';
import { DataTableLab } from './components/DataTableLab';
import { UiPlayground } from './components/UiPlayground';
import type { DemoLocale, DemoSection } from './utils/demoLogic';

interface ToastItem {
  id: string;
  kind: 'success' | 'warning' | 'error' | 'info';
  text: string;
}

const THEME_KEY = 'demolab_theme_v1';
const LOCALE_KEY = 'demolab_locale_v1';

interface DemoLabAppProps {
  onBackToRubi: () => void;
}

export function DemoLabApp({ onBackToRubi }: DemoLabAppProps) {
  const [activeSection, setActiveSection] = useState<DemoSection>('api');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [locale, setLocale] = useState<DemoLocale>(() => {
    try {
      return localStorage.getItem(LOCALE_KEY) === 'en' ? 'en' : 'bn';
    } catch {
      return 'bn';
    }
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  useEffect(() => {
    document.title = 'DemoLab — API & UI Testing Tool';
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // Ignore
    }
  }, [locale]);

  const notify = useCallback(
    (kind: ToastItem['kind'], text: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, kind, text }].slice(-3));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const handleResetDemo = useCallback(async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRefreshSignal((n) => n + 1);
      notify(
        'success',
        locale === 'bn'
          ? 'ডেমো ডেটাবেস প্রাথমিক অবস্থায় রিসেট হয়েছে।'
          : 'Demo dataset reset to initial sample records.'
      );
    } catch {
      notify('error', 'Failed to reset demo dataset.');
    } finally {
      setIsResetting(false);
    }
  }, [locale, notify]);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 transition-colors duration-150 dark:bg-[#0b1117] dark:text-slate-100">
      <TopBar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onResetDemo={() => void handleResetDemo()}
        isResetting={isResetting}
        locale={locale}
      />

      <WorkspaceToolbar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        locale={locale}
        onChangeLocale={setLocale}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {activeSection === 'api' && (
          <ApiTester locale={locale} onNotify={notify} />
        )}
        {activeSection === 'form' && (
          <FormLab locale={locale} onNotify={notify} />
        )}
        {activeSection === 'table' && (
          <DataTableLab
            locale={locale}
            refreshSignal={refreshSignal}
            onNotify={notify}
          />
        )}
        {activeSection === 'playground' && (
          <UiPlayground locale={locale} onNotify={notify} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-[#0b1117] dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <span>DemoLab · Interactive API & UI Testing Tool</span>
          <div className="flex items-center gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onBackToRubi();
              }}
              className="font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
              ← Rubi (রুবি)
            </a>
            <button
              type="button"
              onClick={() => setActiveSection('api')}
              className="hover:text-slate-900 dark:hover:text-slate-200"
            >
              API Tester
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('form')}
              className="hover:text-slate-900 dark:hover:text-slate-200"
            >
              Form Lab
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('table')}
              className="hover:text-slate-900 dark:hover:text-slate-200"
            >
              Data Table
            </button>
          </div>
        </div>
      </footer>

      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2"
        >
          {toasts.map((toast) => {
            const styleMap: Record<ToastItem['kind'], string> = {
              success:
                'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100',
              warning:
                'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-100',
              error:
                'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100',
              info: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/90 dark:text-sky-100',
            };
            const Icon =
              toast.kind === 'success'
                ? CheckCircle2
                : toast.kind === 'warning'
                  ? AlertTriangle
                  : toast.kind === 'error'
                    ? XCircle
                    : Info;

            return (
              <div
                key={toast.id}
                role="status"
                className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-xs font-medium shadow-lg ${styleMap[toast.kind]}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{toast.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setToasts((prev) => prev.filter((item) => item.id !== toast.id))
                  }
                  aria-label="Dismiss notification"
                  className="rounded p-0.5 opacity-70 hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
