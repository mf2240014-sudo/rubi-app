import { Moon, Sun } from 'lucide-react';
import type { DemoLocale, DemoSection } from '../utils/demoLogic';

interface WorkspaceToolbarProps {
  activeSection: DemoSection;
  onSelectSection: (section: DemoSection) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  locale: DemoLocale;
  onChangeLocale: (locale: DemoLocale) => void;
}

const SECTION_LABELS: Record<DemoSection, { en: string; bn: string }> = {
  api: { en: 'API Tester', bn: 'API টেস্টার' },
  form: { en: 'Form Lab', bn: 'ফর্ম ল্যাব' },
  table: { en: 'Data Table', bn: 'ডেটা টেবিল' },
  playground: { en: 'UI Playground', bn: 'UI প্লেগ্রাউন্ড' },
};

export function WorkspaceToolbar({
  activeSection,
  onSelectSection,
  theme,
  onToggleTheme,
  locale,
  onChangeLocale,
}: WorkspaceToolbarProps) {
  const bn = locale === 'bn';

  return (
    <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f1620]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Workspace</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 dark:text-slate-100">
            {bn ? SECTION_LABELS[activeSection].bn : SECTION_LABELS[activeSection].en}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Language switcher"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              onClick={() => onChangeLocale('bn')}
              aria-pressed={locale === 'bn'}
              className={`min-h-[32px] rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                locale === 'bn'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => onChangeLocale('en')}
              aria-pressed={locale === 'en'}
              className={`min-h-[32px] rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                locale === 'en'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              English
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{bn ? 'লাইট' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{bn ? 'ডার্ক' : 'Dark'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile section navigation strip */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto border-t border-slate-200 px-4 py-2 dark:border-slate-800">
        {(Object.keys(SECTION_LABELS) as DemoSection[]).map((id) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectSection(id)}
              className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {bn ? SECTION_LABELS[id].bn : SECTION_LABELS[id].en}
            </button>
          );
        })}
      </div>
    </div>
  );
}
