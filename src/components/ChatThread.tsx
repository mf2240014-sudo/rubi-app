import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Square,
  Volume2,
} from 'lucide-react';
import { parseMessageBlocks, type ChatMessage } from '../utils/sukoonLogic';

interface ChatThreadProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  speakingMessageId: string | null;
  errorMessage: string | null;
  onSpeakMessage: (message: ChatMessage) => void;
  onStopSpeaking: () => void;
  onSelectSuggestion: (prompt: string) => void;
  onRetry: () => void;
}

function renderInlineCodeAndItalics(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*[^*\n]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-[#0b1116] px-1.5 py-0.5 font-mono text-[0.88em] text-[#5eead4]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-[#cde4e2]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function renderInlineFormatting(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#f1f8f7]">
          {renderInlineCodeAndItalics(part.slice(2, -2))}
        </strong>
      );
    }
    return <span key={idx}>{renderInlineCodeAndItalics(part)}</span>;
  });
}

function CodeBlock({ language, content }: { language: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[#5eead4]/15 bg-[#080d11]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-1.5 text-xs text-[#8fa8a8]">
        <span className="font-mono">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code snippet"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[#8fa8a8] transition-colors hover:text-[#5eead4]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>কপি হয়েছে</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>কপি</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed text-[#d9ecea]">
        <code>{content}</code>
      </pre>
    </div>
  );
}

export function ChatThread({
  messages,
  isStreaming,
  speakingMessageId,
  errorMessage,
  onSpeakMessage,
  onStopSpeaking,
  onSelectSuggestion,
  onRetry,
}: ChatThreadProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length, isStreaming, errorMessage]);

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      data-testid="chat-thread"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isCurrentlySpeaking = speakingMessageId === msg.id;
          const isLatestMessage = index === messages.length - 1;

          if (isUser) {
            return (
              <div
                key={msg.id}
                className="flex justify-end"
                data-role="user"
              >
                <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-sm border border-[#5eead4]/15 bg-[#13212a] px-4 py-3 text-[15px] sm:text-base leading-relaxed text-[#e6f1f0]">
                  {msg.image && (
                    <img
                      src={`data:${msg.image.mimeType};base64,${msg.image.data}`}
                      alt="Uploaded visual context"
                      referrerPolicy="no-referrer"
                      className="mb-2.5 max-h-64 w-auto rounded-xl border border-white/10 object-contain"
                    />
                  )}
                  {msg.text && (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            );
          }

          const blocks = msg.text ? parseMessageBlocks(msg.text) : [];

          return (
            <article
              key={msg.id}
              className="flex flex-col items-start gap-2.5"
              data-role="model"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-[#5eead4]/85">
                <span>রুবি</span>
                <span aria-hidden="true" className="text-[#738d8c]">
                  ·
                </span>
                <span className="text-[#738d8c]">তোমার বন্ধু</span>
              </div>

              <div className="w-full max-w-[68ch] rounded-2xl rounded-tl-sm border border-white/[0.06] bg-[#10181f] px-4 py-3.5 sm:px-5 sm:py-4 text-[15px] sm:text-base leading-[1.75] text-[#e6f1f0]">
                <div className="space-y-3">
                  {blocks.map((block, bIdx) => {
                    if (block.type === 'code') {
                      return (
                        <CodeBlock
                          key={bIdx}
                          language={block.language}
                          content={block.content}
                        />
                      );
                    }
                    if (block.type === 'list') {
                      return (
                        <ul
                          key={bIdx}
                          className="list-disc space-y-1.5 pl-5 marker:text-[#5eead4]/75"
                        >
                          {block.items.map((item, itemIdx) => (
                            <li key={itemIdx}>
                              {renderInlineFormatting(item)}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={bIdx} className="whitespace-pre-wrap">
                        {renderInlineFormatting(block.content)}
                      </p>
                    );
                  })}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div
                    className="mt-4 border-t border-white/[0.06] pt-3"
                    data-testid="grounding-sources"
                  >
                    <p className="mb-1.5 text-xs font-medium text-[#8fa8a8]">
                      তথ্যসূত্র (Google Search)
                    </p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {msg.sources.slice(0, 6).map((source) => (
                        <li key={source.uri}>
                          <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#5eead4]/90 underline decoration-[#5eead4]/30 underline-offset-4 transition-colors hover:text-[#5eead4] hover:decoration-[#5eead4]"
                          >
                            <span className="max-w-[220px] truncate">
                              {source.title}
                            </span>
                            <ExternalLink
                              className="h-3 w-3 shrink-0"
                              aria-hidden="true"
                            />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {msg.text && (
                <button
                  type="button"
                  onClick={() =>
                    isCurrentlySpeaking
                      ? onStopSpeaking()
                      : onSpeakMessage(msg)
                  }
                  aria-label={
                    isCurrentlySpeaking
                      ? 'Stop speaking reply'
                      : 'Listen to this reply'
                  }
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-[#8fa8a8] transition-colors hover:bg-[#13212a] hover:text-[#5eead4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60"
                >
                  {isCurrentlySpeaking ? (
                    <>
                      <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                      <span>থামাও</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>শোনো</span>
                    </>
                  )}
                </button>
              )}

              {isLatestMessage &&
                !isStreaming &&
                msg.suggestions &&
                msg.suggestions.length > 0 && (
                  <div
                    className="flex flex-wrap gap-2 pt-1"
                    role="group"
                    aria-label="Follow-up suggestions"
                    data-testid="followup-suggestions"
                  >
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => onSelectSuggestion(suggestion)}
                        className="min-h-[40px] rounded-xl border border-[#5eead4]/25 bg-[#111a21] px-3.5 py-2 text-left text-xs sm:text-sm text-[#cde4e2] transition-colors duration-150 hover:border-[#5eead4]/55 hover:bg-[#15222b] hover:text-[#5eead4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4]/60"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
            </article>
          );
        })}

        {isStreaming && (
          <div
            className="flex flex-col items-start gap-2"
            aria-live="polite"
            data-testid="loading-reply"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[#5eead4]/85">
              <span>রুবি</span>
              <span aria-hidden="true" className="text-[#738d8c]">
                ·
              </span>
              <span className="text-[#738d8c]">তোমার বন্ধু</span>
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-white/[0.06] bg-[#10181f] px-4 py-3 text-sm text-[#8fa8a8]">
              শুনছি... একটু নিশ্বাস নাও
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-950/20 px-4 py-3 text-sm text-amber-100"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-400/20"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>আবার চেষ্টা করো</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
