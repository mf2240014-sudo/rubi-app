import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import type { DemoLocale } from '../utils/demoLogic';

interface UiPlaygroundProps {
  locale: DemoLocale;
  onNotify: (kind: 'success' | 'warning' | 'error', text: string) => void;
}

const STORAGE_SANDBOX_KEY = 'demolab_note_v1';

export function UiPlayground({ locale, onNotify }: UiPlaygroundProps) {
  const bn = locale === 'bn';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copyInput, setCopyInput] = useState('https://demolab.local/test-token-42');
  const [copied, setCopied] = useState(false);

  const [savedNote, setSavedNote] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_SANDBOX_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyInput);
      setCopied(true);
      onNotify('success', bn ? 'ক্লিপবোর্ডে কপি হয়েছে।' : 'Copied text to clipboard.');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      onNotify('warning', bn ? 'ক্লিপবোর্ড অনুমতি মেলেনি।' : 'Clipboard permission unavailable.');
    }
  };

  const handleSaveNote = () => {
    try {
      localStorage.setItem(STORAGE_SANDBOX_KEY, savedNote);
      onNotify('success', bn ? 'LocalStorage-এ সংরক্ষিত হয়েছে।' : 'Saved note to localStorage.');
    } catch {
      onNotify('error', 'LocalStorage write failed.');
    }
  };

  const handleClearNote = () => {
    setSavedNote('');
    try {
      localStorage.removeItem(STORAGE_SANDBOX_KEY);
      onNotify('warning', bn ? 'সংরক্ষিত নোট মুছে ফেলা হয়েছে।' : 'Cleared saved note.');
    } catch {
      // Ignore
    }
  };

  return (
    <section aria-labelledby="playground-heading" className="space-y-6">
      <div>
        <h1
          id="playground-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          style={{ textWrap: 'balance' }}
        >
          {bn ? '04. UI ইন্টার‍্যাকশন ও ব্রাউজার প্লেগ্রাউন্ড' : '04. UI Components & Browser Playground'}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {bn
            ? 'মডাল ডায়ালগ, টোস্ট অ্যালার্ট, ক্লিপবোর্ড কপি, লোকাল স্টোরেজ ও রেসপনসিভ ভিউপোর্ট টেস্ট করুন।'
            : 'Verify accessible modal focus/Escape handling, toast alerts, clipboard copy, localStorage persistence, and viewport dimensions.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Toast & Dialog Test */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111824]">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {bn ? 'মডাল ও টোস্ট অ্যালার্ট টেস্ট' : 'Modal Dialog & Toast Triggers'}
          </h2>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {bn
              ? 'নিচের বাটনগুলো ক্লিক করে ভিন্ন ধরনের নোটিফিকেশন এবং অ্যাক্সেসিবল মডাল পপ-আপ পরীক্ষা করুন।'
              : 'Trigger different alert states or open a keyboard-accessible modal dialog (closes with Escape or button).'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="min-h-[40px] rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
            >
              {bn ? 'মডাল ডায়ালগ খোলো' : 'Open Modal Dialog'}
            </button>
            <button
              type="button"
              onClick={() =>
                onNotify(
                  'success',
                  bn ? 'সফল: UI টেস্ট অ্যাকশন সম্পন্ন হয়েছে।' : 'Success toast verified cleanly.'
                )
              }
              className="min-h-[40px] rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 whitespace-nowrap hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {bn ? 'সাকসেস টোস্ট' : 'Success Toast'}
            </button>
            <button
              type="button"
              onClick={() =>
                onNotify(
                  'warning',
                  bn ? 'সতর্কতা: এটি একটি ওয়ার্নিং স্টেট টেস্ট।' : 'Warning toast triggered for UI check.'
                )
              }
              className="min-h-[40px] rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 whitespace-nowrap hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
            >
              {bn ? 'ওয়ার্নিং টোস্ট' : 'Warning Toast'}
            </button>
            <button
              type="button"
              onClick={() =>
                onNotify(
                  'error',
                  bn ? 'ত্রুটি: এরর অ্যালার্ট স্টেট সঠিকভাবে কাজ করছে।' : 'Error toast triggered cleanly.'
                )
              }
              className="min-h-[40px] rounded-lg border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-800 whitespace-nowrap hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              {bn ? 'এরর টোস্ট' : 'Error Toast'}
            </button>
          </div>
        </div>

        {/* Clipboard & Viewport Test */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111824]">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {bn ? 'ক্লিপবোর্ড ও ভিউপোর্ট টেস্ট' : 'Clipboard & Responsive Viewport'}
          </h2>
          <div className="flex gap-2">
            <label htmlFor="clipboard-sample" className="sr-only">
              Sample text to copy
            </label>
            <input
              id="clipboard-sample"
              type="text"
              value={copyInput}
              onChange={(e) => setCopyInput(e.target.value)}
              className="min-h-[40px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  <span>{bn ? 'কপি হয়েছে' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{bn ? 'কপি' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>

          <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {bn ? 'বর্তমান ব্রাউজার ভিউপোর্ট:' : 'Active Browser Viewport:'}{' '}
              <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {viewport.width} × {viewport.height} px
              </span>
            </p>
          </div>
        </div>

        {/* LocalStorage Persistence Sandbox */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 md:col-span-2 dark:border-slate-800 dark:bg-[#111824]">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {bn ? 'ব্রাউজার LocalStorage পারসিস্টেন্স টেস্ট' : 'Browser LocalStorage Persistence Test'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {bn
              ? 'এখানে কিছু লিখে সেভ করুন এবং পেজ রিফ্রেশ করে দেখুন ডেটা ঠিক থাকছে কি না।'
              : 'Write text below, save it, and reload the browser tab to verify client-side storage persistence.'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="storage-note" className="sr-only">
              Persistent test note
            </label>
            <input
              id="storage-note"
              type="text"
              value={savedNote}
              onChange={(e) => setSavedNote(e.target.value)}
              placeholder={bn ? 'টেস্ট নোট লিখুন...' : 'Enter text to persist in localStorage...'}
              className="min-h-[40px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveNote}
                className="min-h-[40px] rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap hover:bg-sky-500"
              >
                {bn ? 'সংরক্ষণ করো' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleClearNote}
                className="min-h-[40px] rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {bn ? 'মুছে ফেলো' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#111824]"
          >
            <div className="flex items-start justify-between gap-4">
              <h3
                id="demo-modal-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {bn ? 'ডেমো কনফার্মেশন ডায়ালগ' : 'Demo Confirmation Modal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {bn
                ? 'এই মডালটি Escape কী, বাইরের ব্যাকড্রপ ক্লিক বা নিচের বাটন দিয়ে বন্ধ করা যাবে।'
                : 'This accessible modal dialog can be dismissed via the Escape key, backdrop click, or action buttons below.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[38px] rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {bn ? 'বন্ধ করো' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  onNotify(
                    'success',
                    bn ? 'মডাল অ্যাকশন কনফার্ম হয়েছে।' : 'Modal confirmation accepted.'
                  );
                }}
                className="min-h-[38px] rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
              >
                {bn ? 'নিশ্চিত করো' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
