import type { DemoLocale, DemoSection } from '../utils/demoLogic';

interface TopBarProps {
  activeSection: DemoSection;
  onSelectSection: (section: DemoSection) => void;
  onResetDemo: () => void;
  isResetting: boolean;
  locale: DemoLocale;
}

const NAV_ITEMS: Array<{ id: DemoSection; en: string; bn: string }> = [
  { id: 'api', en: 'API Tester', bn: 'API টেস্টার' },
  { id: 'form', en: 'Form Lab', bn: 'ফর্ম ল্যাব' },
  { id: 'table', en: 'Data Table', bn: 'ডেটা টেবিল' },
  { id: 'playground', en: 'UI Playground', bn: 'UI প্লেগ্রাউন্ড' },
];

export function TopBar({
  activeSection,
  onSelectSection,
  onResetDemo,
  isResetting,
  locale,
}: TopBarProps) {
  const bn = locale === 'bn';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-[#0b1117]/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6">
        <a
          href="#api"
          onClick={(e) => {
            e.preventDefault();
            onSelectSection('api');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md"
        >
          DemoLab
        </a>

        <nav
          aria-label="Primary testing sections"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectSection(item.id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-sm py-1 ${
                  isActive
                    ? 'text-sky-600 underline decoration-2 underline-offset-8 dark:text-sky-400'
                    : 'text-slate-600 hover:text-slate-900 hover:underline hover:underline-offset-8 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {bn ? item.bn : item.en}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onResetDemo}
            disabled={isResetting}
            className="min-h-[38px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
          >
            {bn ? 'ডেমো রিসেট' : 'Reset Demo'}
          </button>
        </div>
      </div>
    </header>
  );
}
