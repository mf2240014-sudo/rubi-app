import { useState } from 'react';
import { MOOD_CHIPS, WISDOM_CHIPS, type MoodChip } from '../utils/sukoonLogic';

interface WelcomeScreenProps {
  onSelectMood: (chip: MoodChip) => void;
  onOpenDemoSite: () => void;
  disabled?: boolean;
}

export function WelcomeScreen({
  onSelectMood,
  onOpenDemoSite,
  disabled,
}: WelcomeScreenProps) {
  const [tab, setTab] = useState<'feelings' | 'wisdom'>('feelings');
  const activeChips = tab === 'feelings' ? MOOD_CHIPS : WISDOM_CHIPS;

  return (
    <section
      aria-label="Welcome to Rubi"
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:py-10"
    >
      {/* Lightweight static midnight-teal radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.10)_0%,rgba(11,17,22,0)_70%)] sm:h-[420px] sm:w-[420px]"
      />

      <div className="mx-auto my-auto w-full max-w-2xl text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#5eead4]/20 bg-[#111a21]/90">
          <svg
            viewBox="0 0 32 32"
            className="h-7 w-7 text-[#5eead4]"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21.5 21.8A8.5 8.5 0 0 1 10.2 10.5a8.5 8.5 0 1 0 11.3 11.3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="9" r="1.4" fill="currentColor" opacity="0.7" />
          </svg>
        </div>

        <p className="mb-2 text-xs sm:text-sm font-medium tracking-wide text-[#5eead4]/90">
          হ্যালো বন্ধু, আমি রুবি (Rubi)
        </p>

        <h1
          className="mx-auto max-w-xl text-3xl font-medium tracking-tight text-[#e6f1f0] sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
        >
          তোমার মন কেমন আছে আজ?
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-[#9cb4b3] sm:text-[17px]">
          আমি তোমার কাছের বন্ধু রুবি—মনের অনুভূতি, HSC ICT, বিজ্ঞান, কোডিং বা আজকের যেকোনো বিষয়ে নিশ্চিন্তে কথা বলো বা ছবি পাঠাও।
        </p>

        {/* Segmented selector: Feelings vs Universal Wisdom */}
        <div
          className="mx-auto mt-6 inline-flex items-center gap-1 rounded-xl border border-[#5eead4]/15 bg-[#111a21] p-1"
          role="tablist"
          aria-label="Conversation starter categories"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'feelings'}
            onClick={() => setTab('feelings')}
            className={`min-h-[38px] rounded-lg px-4 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60 ${
              tab === 'feelings'
                ? 'bg-[#5eead4]/15 text-[#5eead4]'
                : 'text-[#8fa8a8] hover:text-[#e6f1f0]'
            }`}
          >
            মনের প্রশান্তি
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'wisdom'}
            onClick={() => setTab('wisdom')}
            className={`min-h-[38px] rounded-lg px-4 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60 ${
              tab === 'wisdom'
                ? 'bg-[#5eead4]/15 text-[#5eead4]'
                : 'text-[#8fa8a8] hover:text-[#e6f1f0]'
            }`}
          >
            বিশ্বজ্ঞান ও সংবাদ
          </button>
        </div>

        <div
          className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
          role="group"
          aria-label="Quick starter prompts"
        >
          {activeChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMood(chip)}
              className="group flex min-h-[64px] flex-col items-start justify-center rounded-2xl border border-[#5eead4]/15 bg-[#111a21]/90 px-5 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5eead4]/45 hover:bg-[#15212a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60 disabled:opacity-50"
            >
              <span className="text-[16px] font-medium text-[#e6f1f0] group-hover:text-[#5eead4] transition-colors">
                {chip.label}
              </span>
              <span className="mt-0.5 text-xs text-[#8fa8a8]">
                {chip.subtitle}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-[#738d8c]">
          বাংলা, Banglish বা English · লাইভ ওয়েব সার্চ ও ছবি বিশ্লেষণ যুক্ত ·{' '}
          <a
            href="/demo"
            onClick={(e) => {
              e.preventDefault();
              onOpenDemoSite();
            }}
            className="text-[#5eead4]/80 underline decoration-[#5eead4]/30 underline-offset-4 hover:text-[#5eead4]"
          >
            API/UI ডেমো টেস্টিং সাইট
          </a>
        </p>
      </div>
    </section>
  );
}
