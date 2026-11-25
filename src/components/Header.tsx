import { CloudRain, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  isRainOn: boolean;
  onToggleRain: () => void;
  isVoiceReplyOn: boolean;
  onToggleVoiceReply: () => void;
  isSpeaking: boolean;
  hasMessages: boolean;
  onNewChat: () => void;
}

export function Header({
  isRainOn,
  onToggleRain,
  isVoiceReplyOn,
  onToggleVoiceReply,
  isSpeaking,
  hasMessages,
  onNewChat,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#5eead4]/10 bg-[#0b1116]/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            if (hasMessages) {
              onNewChat();
            }
          }}
          className="flex items-baseline gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60 rounded-lg px-1 py-0.5"
        >
          <span
            className="text-xl font-semibold tracking-tight text-[#5eead4]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            রুবি
          </span>
          <span className="text-sm font-normal tracking-wide text-[#8fa8a8]">
            Rubi
          </span>
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleRain}
            aria-pressed={isRainOn}
            aria-label={isRainOn ? 'Turn off ambient rain sound' : 'Turn on ambient rain sound'}
            className={`inline-flex min-h-[40px] sm:min-h-[38px] items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60 ${
              isRainOn
                ? 'border-[#5eead4]/50 bg-[#5eead4]/15 text-[#5eead4]'
                : 'border-white/10 bg-[#111a21] text-[#b4c8c7] hover:border-[#5eead4]/30 hover:text-[#e6f1f0]'
            }`}
          >
            <CloudRain className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{isRainOn ? 'বৃষ্টি চলছে' : 'বৃষ্টি'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleVoiceReply}
            aria-pressed={isVoiceReplyOn}
            aria-label={
              isVoiceReplyOn
                ? 'Disable gentle voice reply'
                : 'Enable gentle voice reply'
            }
            className={`inline-flex min-h-[40px] sm:min-h-[38px] items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60 ${
              isVoiceReplyOn
                ? 'border-[#5eead4]/50 bg-[#5eead4]/15 text-[#5eead4]'
                : 'border-white/10 bg-[#111a21] text-[#b4c8c7] hover:border-[#5eead4]/30 hover:text-[#e6f1f0]'
            }`}
          >
            {isVoiceReplyOn ? (
              <Volume2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isSpeaking ? 'বলছি...' : isVoiceReplyOn ? 'কণ্ঠ চালু' : 'কণ্ঠ'}
            </span>
          </button>

          {hasMessages && (
            <button
              type="button"
              onClick={onNewChat}
              aria-label="Start a new conversation"
              className="inline-flex min-h-[40px] sm:min-h-[38px] items-center gap-1.5 rounded-xl border border-white/10 bg-[#111a21] px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-[#b4c8c7] whitespace-nowrap shrink-0 transition-colors duration-200 hover:border-[#5eead4]/30 hover:text-[#e6f1f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">নতুন কথা</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
