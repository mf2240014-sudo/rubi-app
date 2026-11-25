import { cleanTextForSpeech, detectSpeechLang } from './sukoonLogic';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  window.speechSynthesis.cancel();
}

export interface VoiceLike {
  name: string;
  lang: string;
}

const KNOWN_FEMALE_BENGALI_HINTS =
  /nabanita|tanisha|google বাংলা|bengali.*female|female|woman|girl|natural|neural/i;
const KNOWN_MALE_HINTS = /\b(male|man|pradeep|bashkar|david|mark|daniel|guy|ryan)\b/i;

/**
 * Prioritizes sweet, natural Bangladeshi female Bengali voices from speechSynthesis.getVoices(),
 * such as Microsoft Nabanita, Google বাংলা, or other bn-BD / female Bengali voices.
 */
export function pickRubiVoice<T extends VoiceLike>(
  voices: T[],
  lang: 'bn-BD' | 'en-US'
): T | null {
  if (voices.length === 0) return null;

  if (lang === 'bn-BD') {
    const isBnBd = (v: T) => v.lang.toLowerCase().startsWith('bn-bd');
    const isBnAny = (v: T) =>
      v.lang.toLowerCase().startsWith('bn') || /bengali|বাংলা/i.test(v.name);
    const isLikelyFemaleBn = (v: T) =>
      KNOWN_FEMALE_BENGALI_HINTS.test(v.name) && !KNOWN_MALE_HINTS.test(v.name);

    return (
      voices.find((v) => isBnBd(v) && /nabanita/i.test(v.name)) ??
      voices.find((v) => isBnBd(v) && isLikelyFemaleBn(v)) ??
      voices.find((v) => isBnBd(v) && !KNOWN_MALE_HINTS.test(v.name)) ??
      voices.find((v) => isBnBd(v)) ??
      voices.find((v) => isBnAny(v) && /google বাংলা|nabanita|tanisha/i.test(v.name)) ??
      voices.find((v) => isBnAny(v) && isLikelyFemaleBn(v)) ??
      voices.find((v) => isBnAny(v) && !KNOWN_MALE_HINTS.test(v.name)) ??
      voices.find((v) => isBnAny(v)) ??
      null
    );
  }

  return (
    voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('en') &&
        !KNOWN_MALE_HINTS.test(v.name) &&
        /aria|jenny|samantha|victoria|zira|karen|natural|google us english|female/i.test(
          v.name
        )
    ) ??
    voices.find(
      (v) => v.lang.toLowerCase().startsWith('en') && !KNOWN_MALE_HINTS.test(v.name)
    ) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
    null
  );
}

let speakToken = 0;

function dispatchUtterance(
  text: string,
  lang: 'bn-BD' | 'en-US',
  voices: SpeechSynthesisVoice[],
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
  }
): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  // Tuned for Rubi's warm, sweet, natural Bangladeshi female voice
  utterance.pitch = 1.12;
  utterance.rate = 0.94;
  utterance.volume = 0.95;

  const preferredVoice = pickRubiVoice(voices, lang);
  if (preferredVoice) {
    try {
      utterance.voice = preferredVoice;
    } catch {
      // Fall back to utterance.lang when browser rejects custom voice object
    }
    if (preferredVoice.lang) {
      utterance.lang = preferredVoice.lang;
    }
  }

  utterance.onstart = () => callbacks?.onStart?.();
  utterance.onend = () => callbacks?.onEnd?.();
  utterance.onerror = () => callbacks?.onEnd?.();

  window.speechSynthesis.speak(utterance);
}

/**
 * Speaks Rubi's reply in a warm, sweet, soothing Bangladeshi female tone.
 */
export function speakCalmly(
  rawText: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
  }
): void {
  if (!isTtsSupported()) {
    callbacks?.onEnd?.();
    return;
  }

  const text = cleanTextForSpeech(rawText);
  if (!text) {
    callbacks?.onEnd?.();
    return;
  }

  const currentToken = ++speakToken;
  window.speechSynthesis.cancel();

  const lang = detectSpeechLang(text);
  const initialVoices = window.speechSynthesis.getVoices();

  if (initialVoices.length > 0) {
    dispatchUtterance(text, lang, initialVoices, callbacks);
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled || currentToken !== speakToken) return;
    settled = true;
    window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
    dispatchUtterance(text, lang, window.speechSynthesis.getVoices(), callbacks);
  };
  const onVoicesChanged = () => {
    if (window.speechSynthesis.getVoices().length > 0) {
      finish();
    }
  };

  window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
  setTimeout(finish, 250);
}
