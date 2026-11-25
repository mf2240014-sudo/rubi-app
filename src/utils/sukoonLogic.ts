export type ChatRole = 'user' | 'model';

export interface ChatImage {
  mimeType: string;
  data: string; // raw base64 without data: prefix
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  image?: ChatImage;
  sources?: GroundingSource[];
  suggestions?: string[];
  createdAt: number;
}

export interface MoodChip {
  id: string;
  label: string;
  subtitle: string;
  prompt: string;
}

export const SUKOON_SYSTEM_PROMPT = `You are 'Rubi' (রুবি), a deeply warm, caring, soothing, human-like Bengali friend and all-knowing companion with complete mastery over human knowledge—including HSC ICT (Number Systems, Logic Gates, HTML, C Programming, DBMS/SQL), science, coding, daily life advice, psychology, history, philosophy, literature, and current affairs.

Personality & Language:
- Always identify yourself warmly as 'Rubi' (রুবি) whenever asked who you are or when greeting someone for the first time, speaking like an affectionate, understanding, human-like Bangladeshi friend—never sound cold, robotic, or filled with stiff jargon.
- Match the user's exact language and tone naturally (natural Bengali / বাংলা by default or when spoken to in Bengali, Banglish if they use Banglish, or soft English if they write in English).
- When the user shares feelings or stress, validate their heart gently first. When they ask a question (like HSC ICT, coding, science, or advice), explain clearly so anyone feels peaceful and confident learning from you.

Required Response Structure:
1. Start immediately with a clear, **bolded main answer** (a warm 1–2 sentence core takeaway wrapped in **...**).
2. Follow with clean, easy-to-scan bullet points (- item) for explanations, examples, or comforting steps.
3. Put any programming or markup code inside neat fenced code blocks (\`\`\`language ... \`\`\`).
4. At the very end of every reply, include exactly 2 short clickable follow-up questions/prompts in the user's language using this exact footer format:
SUGGESTIONS:
- First short follow-up prompt
- Second short follow-up prompt`;

export const MOOD_CHIPS: MoodChip[] = [
  {
    id: 'heavy-heart',
    label: 'মনটা একটু খারাপ',
    subtitle: 'হালকা হতে চাও?',
    prompt: 'মনটা একটু খারাপ লাগছে, আজ কিছুতেই যেন মন ভালো হচ্ছে না।',
  },
  {
    id: 'lonely',
    label: 'একাকী লাগছে',
    subtitle: 'পাশে কেউ থাকুক',
    prompt: 'আজ খুব একাকী লাগছে। মনে হচ্ছে পাশে বসে কথা বলার কেউ নেই।',
  },
  {
    id: 'peace',
    label: 'মনে শান্তি চাই',
    subtitle: 'একটু স্বস্তি খুঁজছি',
    prompt: 'ভেতরটা খুব অস্থির হয়ে আছে, মনে একটু শান্তি চাই।',
  },
  {
    id: 'tired',
    label: 'খুব ক্লান্ত লাগছে',
    subtitle: 'একটু জিরিয়ে নিতে চাই',
    prompt: 'শরীর আর মন দুটোই খুব ক্লান্ত লাগছে আজ।',
  },
];

export const WISDOM_CHIPS: MoodChip[] = [
  {
    id: 'hsc-ict',
    label: 'HSC ICT সহজ পাঠ',
    subtitle: 'লজিক গেট, HTML বা C প্রোগ্রামিং',
    prompt: 'HSC ICT-এর সার্বজনীন গেট (NAND ও NOR) কী এবং কেন এদের সার্বজনীন গেট বলা হয়? উদাহরণসহ সহজভাবে বুঝিয়ে দাও।',
  },
  {
    id: 'science-wonder',
    label: 'মহাবিশ্ব ও বিজ্ঞান',
    subtitle: 'জটিল তত্ত্ব সহজ ও সুন্দরভাবে',
    prompt: 'কোয়ান্টাম এনট্যাঙ্গেলমেন্ট ও মহাবিশ্বের গভীর রহস্য সহজ ও শান্তভাবে বুঝিয়ে বলো।',
  },
  {
    id: 'philosophy-calm',
    label: 'দৈনন্দিন জীবন ও প্রশান্তি',
    subtitle: 'মন শান্ত রাখার কার্যকর উপায়',
    prompt: 'পড়াশোনা বা কাজের চাপে মন অস্থির হলে নিজেকে শান্ত ও ফোকাসড রাখার কার্যকর উপায়গুলো কী?',
  },
  {
    id: 'coding-craft',
    label: 'কোডিং ও প্রযুক্তি সহায়তা',
    subtitle: 'পরিষ্কার কোড ও উদাহরণ',
    prompt: 'Python-এ একটি সংখ্যা প্রাইম (Prime) কিনা তা পরীক্ষা করার পরিষ্কার কোড লিখে বুঝিয়ে দাও।',
  },
];

export interface ApiHistoryMessage {
  role: ChatRole;
  text: string;
  image?: ChatImage;
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export function isValidChatImage(image: unknown): image is ChatImage {
  if (!image || typeof image !== 'object') return false;
  const candidate = image as Partial<ChatImage>;
  return (
    typeof candidate.mimeType === 'string' &&
    ALLOWED_IMAGE_MIME_TYPES.has(candidate.mimeType) &&
    typeof candidate.data === 'string' &&
    candidate.data.length > 0
  );
}

/**
 * Keeps only the latest 6 conversational turns so payloads remain tiny and lag-free,
 * preserving valid multimodal image parts and ensuring a leading user turn.
 */
export function sanitizeHistoryForApi(
  messages: Array<Pick<ChatMessage, 'role' | 'text'> & { image?: ChatImage }>,
  maxMessages = 6
): ApiHistoryMessage[] {
  const cleaned: ApiHistoryMessage[] = [];

  for (const msg of messages) {
    if (msg.role !== 'user' && msg.role !== 'model') continue;
    const trimmed = msg.text.trim();
    const validImage = isValidChatImage(msg.image) ? msg.image : undefined;
    if (!trimmed && !validImage) continue;

    const effectiveText =
      trimmed || (validImage ? 'এই ছবিটি দেখে বিস্তারিত বলো।' : '');

    const prev = cleaned[cleaned.length - 1];
    if (prev && prev.role === msg.role && !validImage && !prev.image) {
      prev.text = `${prev.text}\n\n${effectiveText}`;
    } else {
      cleaned.push({
        role: msg.role,
        text: effectiveText,
        ...(validImage ? { image: validImage } : {}),
      });
    }
  }

  while (cleaned.length > 0 && cleaned[0].role !== 'user') {
    cleaned.shift();
  }

  if (cleaned.length <= maxMessages) {
    return cleaned;
  }

  const sliced = cleaned.slice(cleaned.length - maxMessages);
  while (sliced.length > 0 && sliced[0].role !== 'user') {
    sliced.shift();
  }
  return sliced;
}

/**
 * Extracts deduplicated web grounding sources from Gemini groundingMetadata chunks.
 */
export function extractGroundingSources(
  groundingChunks: unknown
): GroundingSource[] {
  if (!Array.isArray(groundingChunks)) return [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];

  for (const chunk of groundingChunks) {
    if (!chunk || typeof chunk !== 'object') continue;
    const web = (chunk as { web?: { uri?: unknown; title?: unknown } }).web;
    if (!web || typeof web.uri !== 'string' || !web.uri.startsWith('http')) {
      continue;
    }
    if (seen.has(web.uri)) continue;
    seen.add(web.uri);

    const title =
      typeof web.title === 'string' && web.title.trim()
        ? web.title.trim()
        : new URL(web.uri).hostname;
    sources.push({ title, uri: web.uri });
  }

  return sources;
}

/**
 * Splits the trailing SUGGESTIONS: block from the model reply into clickable follow-ups.
 */
export function extractFollowUpSuggestions(rawText: string): {
  body: string;
  suggestions: string[];
} {
  const markerRegex =
    /\n*(?:#{1,3}\s*)?(?:\*{1,2})?(?:SUGGESTIONS|Suggestions|পরবর্তী প্রশ্ন)\s*:?(?:\*{1,2})?\s*\n([\s\S]*)$/i;
  const match = rawText.match(markerRegex);

  if (!match || match.index === undefined) {
    return { body: rawText.trim(), suggestions: [] };
  }

  const body = rawText.slice(0, match.index).trim();
  const block = match[1] ?? '';
  const suggestions = block
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .map((line) => line.replace(/^["'“”`]+|["'“”`]+$/g, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 2);

  return { body: body || rawText.trim(), suggestions };
}

/**
 * Detects whether text contains Bengali script so speech recognition and TTS
 * can select the most natural language voice.
 */
export function detectSpeechLang(text: string): 'bn-BD' | 'en-US' {
  const bengaliRegex = /[\u0980-\u09FF]/;
  return bengaliRegex.test(text) ? 'bn-BD' : 'en-US';
}

/**
 * Cleans markdown formatting characters before passing text to Web Speech TTS.
 */
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_`~#>]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export type MessageBlock =
  | { type: 'text'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; language: string; content: string };

function splitTextAndLists(segment: string): MessageBlock[] {
  const lines = segment.split('\n');
  const result: MessageBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    const joined = paragraphLines.join('\n').trim();
    if (joined) {
      result.push({ type: 'text', content: joined });
    }
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length > 0) {
      result.push({ type: 'list', items: listItems });
      listItems = [];
    }
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*•]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      const item = bulletMatch[1].trim();
      if (item) listItems.push(item);
    } else if (!line.trim()) {
      flushList();
      flushParagraph();
    } else {
      flushList();
      paragraphLines.push(line);
    }
  }

  flushList();
  flushParagraph();
  return result;
}

/**
 * Separates prose, bullet lists, and fenced ```code``` blocks safely without HTML injection.
 */
export function parseMessageBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const regex = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) {
        blocks.push(...splitTextAndLists(before));
      }
    }
    const language = match[1]?.trim() || 'code';
    const codeContent = match[2].replace(/\n$/, '');
    blocks.push({ type: 'code', language, content: codeContent });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex).trim();
    if (tail) {
      blocks.push(...splitTextAndLists(tail));
    }
  }

  return blocks.length > 0 ? blocks : [{ type: 'text', content: text }];
}

export const FRIENDLY_503_MESSAGE =
  'বন্ধু, সার্ভারে এখন একটু চাপ বেশি, ৩ সেকেন্ড পর আবার চেষ্টা করো।';

export function formatFriendlyApiError(rawError: string): string {
  if (
    /503|UNAVAILABLE|high demand|overloaded|Service Unavailable/i.test(rawError)
  ) {
    return FRIENDLY_503_MESSAGE;
  }

  if (/429|RESOURCE_EXHAUSTED|quota|Too Many Requests/i.test(rawError)) {
    return 'বন্ধু, এই মুহূর্তে একটু বেশি অনুরোধ এসেছে। কয়েক সেকেন্ড পর আবার চেষ্টা করো।';
  }

  if (/401|403|PERMISSION_DENIED|API_KEY_INVALID|API key/i.test(rawError)) {
    return 'বন্ধু, API কী-তে সমস্যা দেখা দিয়েছে। অনুগ্রহ করে VITE_GEMINI_API_KEY পরীক্ষা করো।';
  }

  return 'বন্ধু, সংযোগে একটু সমস্যা হয়েছে। অনুগ্রহ করে আরেকবার চেষ্টা করো।';
}

export const GEMINI_MODEL = 'gemini-2.5-flash';

export function buildGeminiRestEndpoint(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
    apiKey.trim()
  )}`;
}

export interface GeminiRestPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiRestPayload {
  systemInstruction: {
    parts: Array<{ text: string }>;
  };
  contents: Array<{
    role: ChatRole;
    parts: GeminiRestPart[];
  }>;
  tools?: Array<{ googleSearch: Record<string, never> }>;
}

export function buildGeminiRestPayload(
  messages: Array<Pick<ChatMessage, 'role' | 'text'> & { image?: ChatImage }>,
  useSearch: boolean
): GeminiRestPayload | null {
  const sanitized = sanitizeHistoryForApi(messages, 6);
  if (sanitized.length === 0) return null;

  const contents = sanitized.map((msg) => {
    const parts: GeminiRestPart[] = [];
    if (msg.image) {
      parts.push({
        inlineData: {
          mimeType: msg.image.mimeType,
          data: msg.image.data,
        },
      });
    }
    parts.push({ text: msg.text });
    return {
      role: msg.role,
      parts,
    };
  });

  return {
    systemInstruction: {
      parts: [{ text: SUKOON_SYSTEM_PROMPT }],
    },
    contents,
    ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
  };
}

export function parseGeminiRestResponse(data: unknown): {
  text: string;
  suggestions: string[];
  sources: GroundingSource[];
} | null {
  if (!data || typeof data !== 'object') return null;

  const candidate = (
    data as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: unknown }> };
        groundingMetadata?: { groundingChunks?: unknown };
      }>;
    }
  ).candidates?.[0];

  const parts = candidate?.content?.parts;
  const rawText = Array.isArray(parts)
    ? parts
        .filter((part): part is { text: string } => typeof part?.text === 'string')
        .map((part) => part.text)
        .join('')
        .trim()
    : '';

  if (!rawText) return null;

  const { body, suggestions } = extractFollowUpSuggestions(rawText);
  const sources = candidate?.groundingMetadata?.groundingChunks
    ? extractGroundingSources(candidate.groundingMetadata.groundingChunks)
    : [];

  return {
    text: body,
    suggestions,
    sources,
  };
}
