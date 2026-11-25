import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { ArrowUp, Globe, ImagePlus, Mic, MicOff, X } from 'lucide-react';
import type { ChatImage } from '../utils/sukoonLogic';

interface ComposerProps {
  value: string;
  onChange: (next: string) => void;
  pendingImage: ChatImage | null;
  onSelectImage: (image: ChatImage | null) => void;
  onImageError: (message: string | null) => void;
  onSend: () => void;
  isStreaming: boolean;
  isListening: boolean;
  speechSupported: boolean;
  voiceHint: string | null;
  onToggleMic: () => void;
  isSearchOn: boolean;
  onToggleSearch: () => void;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export function Composer({
  value,
  onChange,
  pendingImage,
  onSelectImage,
  onImageError,
  onSend,
  isStreaming,
  isListening,
  speechSupported,
  voiceHint,
  onToggleMic,
  isSearchOn,
  onToggleSearch,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 148)}px`;
  }, [value]);

  const readImageFile = (file: File) => {
    if (!SUPPORTED_TYPES.has(file.type)) {
      onImageError('অনুগ্রহ করে PNG, JPG, WEBP বা GIF ছবি বেছে নাও।');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onImageError('ছবিটি ৮ মেগাবাইটের চেয়ে ছোট হতে হবে।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      if (commaIdx === -1) {
        onImageError('ছবিটি পড়া যায়নি, আরেকটি ছবি চেষ্টা করো।');
        return;
      }
      const data = result.slice(commaIdx + 1);
      onImageError(null);
      onSelectImage({ mimeType: file.type, data });
    };
    reader.onerror = () => {
      onImageError('ছবিটি লোড করা যায়নি।');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      readImageFile(file);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          readImageFile(file);
          break;
        }
      }
    }
  };

  const canSend = (Boolean(value.trim()) || Boolean(pendingImage)) && !isStreaming;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    onSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  return (
    <div className="shrink-0 z-20 bg-gradient-to-t from-[#0b1116] via-[#0b1116]/95 to-transparent px-4 pt-3 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-3xl">
        {voiceHint && (
          <p role="status" className="mb-2 px-1 text-xs text-[#5eead4]">
            {voiceHint}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#5eead4]/20 bg-[#111a21] p-2 transition-colors focus-within:border-[#5eead4]/50"
        >
          {pendingImage && (
            <div className="mb-2 flex items-start gap-3 px-2 pt-1">
              <div className="relative inline-block">
                <img
                  src={`data:${pendingImage.mimeType};base64,${pendingImage.data}`}
                  alt="Selected upload preview"
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-xl border border-[#5eead4]/25 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onSelectImage(null)}
                  aria-label="Remove attached image"
                  className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-[#0b1116] text-[#e6f1f0] transition-colors hover:border-[#5eead4]/60 hover:text-[#5eead4]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <span className="pt-1 text-xs text-[#8fa8a8]">
                ছবি যুক্ত হয়েছে — চাইলে প্রশ্ন লিখতে পারো বা সরাসরি পাঠাও
              </span>
            </div>
          )}

          <div className="flex items-end gap-1 sm:gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Choose an image file to upload"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload an image"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#8fa8a8] transition-colors duration-200 hover:bg-[#16232c] hover:text-[#5eead4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60"
            >
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleMic}
              aria-pressed={isListening}
              aria-label={
                isListening
                  ? 'Stop voice input'
                  : speechSupported
                    ? 'Start voice input'
                    : 'Voice input'
              }
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60 ${
                isListening
                  ? 'bg-[#5eead4]/20 text-[#5eead4] ring-1 ring-[#5eead4]/50'
                  : 'text-[#8fa8a8] hover:bg-[#16232c] hover:text-[#e6f1f0]'
              }`}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Mic className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={onToggleSearch}
              aria-pressed={isSearchOn}
              aria-label={
                isSearchOn
                  ? 'Disable live web search grounding'
                  : 'Enable live web search grounding'
              }
              title={
                isSearchOn
                  ? 'Live Web Search: ON'
                  : 'Live Web Search: OFF (saves quota)'
              }
              className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60 ${
                isSearchOn
                  ? 'bg-[#5eead4]/15 text-[#5eead4] ring-1 ring-[#5eead4]/40'
                  : 'text-[#8fa8a8] hover:bg-[#16232c] hover:text-[#e6f1f0]'
              }`}
            >
              <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">সার্চ</span>
            </button>

            <label htmlFor="rubi-message-input" className="sr-only">
              Share how you feel with Rubi
            </label>
            <textarea
              id="rubi-message-input"
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="মনের কথা বা প্রশ্ন লেখো..."
              className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 pl-1 text-[15px] sm:text-base leading-relaxed text-[#e6f1f0] placeholder:text-[#738d8c] focus:outline-none"
            />

            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#5eead4] text-[#0b1116] transition-all duration-200 hover:bg-[#7bf0de] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4] disabled:cursor-not-allowed disabled:bg-[#1a2832] disabled:text-[#5b7474]"
            >
              <ArrowUp className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
