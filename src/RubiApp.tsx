import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatThread } from './components/ChatThread';
import { Composer } from './components/Composer';
import { ambientRain } from './utils/ambientRain';
import {
  getSpeechRecognitionCtor,
  speakCalmly,
  stopSpeaking,
  type SpeechRecognitionLike,
} from './utils/speech';
import {
  buildGeminiRestEndpoint,
  buildGeminiRestPayload,
  detectSpeechLang,
  formatFriendlyApiError,
  parseGeminiRestResponse,
  type ChatImage,
  type ChatMessage,
  type MoodChip,
} from './utils/sukoonLogic';

const STORAGE_KEY = 'rubi_conversation_v1';
const LEGACY_STORAGE_KEY = 'sukoon_conversation_v1';
const VOICE_PREF_KEY = 'rubi_voice_reply_v1';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadSavedMessages(): ChatMessage[] {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ChatMessage =>
        Boolean(item) &&
        typeof item === 'object' &&
        (item.role === 'user' || item.role === 'model') &&
        typeof item.text === 'string' &&
        typeof item.id === 'string'
    );
  } catch {
    return [];
  }
}

interface RubiAppProps {
  onOpenDemoSite: () => void;
}

export function RubiApp({ onOpenDemoSite }: RubiAppProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadSavedMessages()
  );
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<ChatImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRainOn, setIsRainOn] = useState(false);
  const [isVoiceReplyOn, setIsVoiceReplyOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(VOICE_PREF_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null
  );
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const [isSearchOn, setIsSearchOn] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voiceReplyRef = useRef(isVoiceReplyOn);
  voiceReplyRef.current = isVoiceReplyOn;

  const speechSupported = Boolean(getSpeechRecognitionCtor());

  useEffect(() => {
    document.title = 'Rubi (রুবি) — Your Caring Bengali Companion';
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      try {
        const compact = messages.map(({ image: _img, ...rest }) => rest);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(VOICE_PREF_KEY, String(isVoiceReplyOn));
    } catch {
      // Ignore storage errors
    }
    if (!isVoiceReplyOn) {
      stopSpeaking();
      setSpeakingMessageId(null);
    }
  }, [isVoiceReplyOn]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      recognitionRef.current?.stop();
      stopSpeaking();
      ambientRain.stop();
    };
  }, []);

  const handleSpeakMessage = useCallback((msg: ChatMessage) => {
    speakCalmly(msg.text, {
      onStart: () => setSpeakingMessageId(msg.id),
      onEnd: () => setSpeakingMessageId(null),
    });
  }, []);

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    setSpeakingMessageId(null);
  }, []);

  const sendToCompanion = useCallback(
    async (historyWithLatestUser: ChatMessage[]) => {
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY ?? '').trim();
      if (!apiKey) {
        setErrorMessage(
          'বন্ধু, VITE_GEMINI_API_KEY পাওয়া যায়নি। Vercel-এর Environment Variables-এ VITE_GEMINI_API_KEY যুক্ত করো।'
        );
        return;
      }

      const payloadBody = buildGeminiRestPayload(
        historyWithLatestUser,
        isSearchOn
      );
      if (!payloadBody) {
        setErrorMessage('অনুগ্রহ করে আগে একটি বার্তা বা ছবি দাও।');
        return;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setErrorMessage(null);
      setIsLoading(true);
      setMessages(historyWithLatestUser);

      try {
        const response = await fetch(buildGeminiRestEndpoint(apiKey), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(payloadBody),
        });

        const rawJson = (await response.json().catch(() => ({}))) as {
          error?: { code?: number; message?: string; status?: string };
        };

        if (!response.ok) {
          const errDetail = `${response.status} ${rawJson?.error?.status ?? ''} ${
            rawJson?.error?.message ?? ''
          }`;
          setErrorMessage(formatFriendlyApiError(errDetail));
          return;
        }

        const parsed = parseGeminiRestResponse(rawJson);
        if (!parsed) {
          setErrorMessage(
            'বন্ধু, সংযোগে একটু সমস্যা হয়েছে। অনুগ্রহ করে আরেকবার চেষ্টা করো।'
          );
          return;
        }

        const modelMessage: ChatMessage = {
          id: createId(),
          role: 'model',
          text: parsed.text,
          ...(parsed.suggestions.length > 0
            ? { suggestions: parsed.suggestions }
            : {}),
          ...(parsed.sources.length > 0 ? { sources: parsed.sources } : {}),
          createdAt: Date.now(),
        };

        setMessages([...historyWithLatestUser, modelMessage]);

        if (voiceReplyRef.current) {
          speakCalmly(parsed.text, {
            onStart: () => setSpeakingMessageId(modelMessage.id),
            onEnd: () => setSpeakingMessageId(null),
          });
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        setErrorMessage(
          'বন্ধু, সংযোগে একটু সমস্যা হয়েছে। অনুগ্রহ করে আরেকবার চেষ্টা করো।'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isSearchOn]
  );

  const sendMessage = useCallback(
    (rawText: string, imageOverride?: ChatImage | null) => {
      const trimmed = rawText.trim();
      const attachedImage =
        imageOverride !== undefined ? imageOverride : pendingImage;

      if ((!trimmed && !attachedImage) || isLoading) return;

      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      setVoiceHint(null);
      stopSpeaking();
      setSpeakingMessageId(null);

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        text: trimmed || (attachedImage ? 'এই ছবিটি দেখে বলো।' : ''),
        ...(attachedImage ? { image: attachedImage } : {}),
        createdAt: Date.now(),
      };

      const nextHistory = [...messages, userMessage];
      setInput('');
      setPendingImage(null);
      void sendToCompanion(nextHistory);
    },
    [isListening, isLoading, messages, pendingImage, sendToCompanion]
  );

  const handleSelectMood = useCallback(
    (chip: MoodChip) => {
      sendMessage(chip.prompt, null);
    },
    [sendMessage]
  );

  const handleRetry = useCallback(() => {
    if (isLoading || messages.length === 0) return;
    void sendToCompanion(messages);
  }, [isLoading, messages, sendToCompanion]);

  const handleNewChat = useCallback(() => {
    abortControllerRef.current?.abort();
    stopSpeaking();
    setSpeakingMessageId(null);
    setIsLoading(false);
    setErrorMessage(null);
    setPendingImage(null);
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleRain = useCallback(async () => {
    const next = await ambientRain.toggle();
    setIsRainOn(next);
  }, []);

  const handleToggleVoiceReply = useCallback(() => {
    setIsVoiceReplyOn((prev) => !prev);
  }, []);

  const handleToggleMic = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceHint(null);
      return;
    }

    const RecognitionCtor = getSpeechRecognitionCtor();
    if (!RecognitionCtor) {
      setVoiceHint(
        'এই ব্রাউজারে মাইক্রোফোন ভয়েস ইনপুট সাপোর্ট করে না। টাইপ করে কথা বলতে পারো।'
      );
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = input.trim() ? detectSpeechLang(input) : 'bn-BD';
    recognition.interimResults = true;
    recognition.continuous = false;

    const baseText = input.trim() ? `${input.trim()} ` : '';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(`${baseText}${transcript}`.trimStart());
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setVoiceHint(
          'মাইক্রোফোনের অনুমতি পাওয়া যায়নি। ব্রাউজার সেটিংস থেকে অনুমতি দাও।'
        );
      } else {
        setVoiceHint('কথা স্পষ্ট শোনা যায়নি, আবার চেষ্টা করো অথবা লিখে জানাও।');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceHint(null);
    };

    recognitionRef.current = recognition;
    setVoiceHint('শুনছি... মনের কথা বলো');
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceHint('মাইক্রোফোন চালু করা যায়নি।');
    }
  }, [input, isListening]);

  return (
    <div
      id="top"
      className="flex h-dvh flex-col overflow-hidden bg-[#0b1116] text-[#e6f1f0]"
      data-state={messages.length === 0 ? 'welcome' : 'chat'}
    >
      <Header
        isRainOn={isRainOn}
        onToggleRain={handleToggleRain}
        isVoiceReplyOn={isVoiceReplyOn}
        onToggleVoiceReply={handleToggleVoiceReply}
        isSpeaking={Boolean(speakingMessageId)}
        hasMessages={messages.length > 0}
        onNewChat={handleNewChat}
      />

      <main className="flex min-h-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <WelcomeScreen
            onSelectMood={handleSelectMood}
            onOpenDemoSite={onOpenDemoSite}
            disabled={isLoading}
          />
        ) : (
          <ChatThread
            messages={messages}
            isStreaming={isLoading}
            speakingMessageId={speakingMessageId}
            errorMessage={errorMessage}
            onSpeakMessage={handleSpeakMessage}
            onStopSpeaking={handleStopSpeaking}
            onSelectSuggestion={(prompt) => sendMessage(prompt, null)}
            onRetry={handleRetry}
          />
        )}
      </main>

      <Composer
        value={input}
        onChange={setInput}
        pendingImage={pendingImage}
        onSelectImage={setPendingImage}
        onImageError={setVoiceHint}
        onSend={() => sendMessage(input)}
        isStreaming={isLoading}
        isListening={isListening}
        speechSupported={speechSupported}
        voiceHint={voiceHint}
        onToggleMic={handleToggleMic}
        isSearchOn={isSearchOn}
        onToggleSearch={() => setIsSearchOn((prev) => !prev)}
      />
    </div>
  );
}
