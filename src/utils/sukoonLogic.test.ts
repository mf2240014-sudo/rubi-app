import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRIENDLY_503_MESSAGE,
  GEMINI_MODEL,
  MOOD_CHIPS,
  SUKOON_SYSTEM_PROMPT,
  WISDOM_CHIPS,
  buildGeminiRestEndpoint,
  buildGeminiRestPayload,
  cleanTextForSpeech,
  detectSpeechLang,
  extractFollowUpSuggestions,
  extractGroundingSources,
  formatFriendlyApiError,
  parseGeminiRestResponse,
  parseMessageBlocks,
  sanitizeHistoryForApi,
} from './sukoonLogic';
import { pickRubiVoice } from './speech';

test('MOOD_CHIPS contains the four requested Bengali mood prompts and WISDOM_CHIPS has HSC ICT starter', () => {
  const labels = MOOD_CHIPS.map((c) => c.label);
  assert.deepEqual(labels, [
    'মনটা একটু খারাপ',
    'একাকী লাগছে',
    'মনে শান্তি চাই',
    'খুব ক্লান্ত লাগছে',
  ]);
  assert.equal(WISDOM_CHIPS.length, 4);
  assert.ok(WISDOM_CHIPS.some((c) => c.id === 'hsc-ict'));
});

test('detectSpeechLang chooses bn-BD for Bengali text and en-US for English/Banglish', () => {
  assert.equal(detectSpeechLang('মনটা একটু খারাপ'), 'bn-BD');
  assert.equal(detectSpeechLang('Ami achi tomar sathe'), 'en-US');
  assert.equal(detectSpeechLang('Take a slow breath'), 'en-US');
});

test('sanitizeHistoryForApi defaults to keeping only the last 6 messages starting on a user turn', () => {
  const turns = Array.from({ length: 10 }, (_, idx) => ({
    role: (idx % 2 === 0 ? 'user' : 'model') as 'user' | 'model',
    text: `Message ${idx}`,
  }));

  const bounded = sanitizeHistoryForApi(turns);
  assert.equal(bounded.length, 6);
  assert.equal(bounded[0]?.role, 'user');
  assert.equal(bounded[0]?.text, 'Message 4');
  assert.equal(bounded[5]?.text, 'Message 9');
});

test('sanitizeHistoryForApi preserves valid multimodal images and default prompt', () => {
  const sanitized = sanitizeHistoryForApi([
    {
      role: 'user',
      text: '',
      image: { mimeType: 'image/png', data: 'iVBORw0KGgo=' },
    },
    {
      role: 'model',
      text: 'This is a calm night sky.',
    },
  ]);

  assert.equal(sanitized.length, 2);
  assert.equal(sanitized[0]?.image?.mimeType, 'image/png');
  assert.ok((sanitized[0]?.text ?? '').length > 0);
});

test('extractFollowUpSuggestions extracts body and up to 2 clickable suggestions', () => {
  const raw = `**NAND এবং NOR হলো সার্বজনীন গেট।**

- যেকোনো মৌলিক গেট তৈরি করা যায়
- ডিজিটাল সার্কিটে খরচ কমায়

SUGGESTIONS:
- NAND দিয়ে NOT গেট কীভাবে বানাব?
- সত্যক সারণি দেখিয়ে দাও
- অতিরিক্ত তৃতীয় লাইন`;

  const parsed = extractFollowUpSuggestions(raw);
  assert.ok(!parsed.body.includes('SUGGESTIONS:'));
  assert.deepEqual(parsed.suggestions, [
    'NAND দিয়ে NOT গেট কীভাবে বানাব?',
    'সত্যক সারণি দেখিয়ে দাও',
  ]);
});

test('extractGroundingSources extracts and deduplicates valid web URLs', () => {
  const sources = extractGroundingSources([
    { web: { uri: 'https://example.com/news', title: 'World News' } },
    { web: { uri: 'https://example.com/news', title: 'Duplicate' } },
    { web: { uri: 'https://science.org/paper', title: '' } },
    { web: { uri: 'javascript:alert(1)', title: 'Bad URL' } },
  ]);

  assert.deepEqual(sources, [
    { title: 'World News', uri: 'https://example.com/news' },
    { title: 'science.org', uri: 'https://science.org/paper' },
  ]);
});

test('parseMessageBlocks separates paragraphs, bullet lists, and fenced code blocks', () => {
  const blocks = parseMessageBlocks(
    '**Main answer.**\n\n- Point one\n- Point two\n\n```ts\nconst x = 1;\n```\nHope this helps.'
  );
  assert.deepEqual(blocks, [
    { type: 'text', content: '**Main answer.**' },
    { type: 'list', items: ['Point one', 'Point two'] },
    { type: 'code', language: 'ts', content: 'const x = 1;' },
    { type: 'text', content: 'Hope this helps.' },
  ]);
});

test('cleanTextForSpeech strips code blocks and markdown formatting cleanly', () => {
  assert.equal(
    cleanTextForSpeech('**Take a breath**\n```js\nconsole.log(1)\n```\nyou are *safe* here.'),
    'Take a breath you are safe here.'
  );
});

test('formatFriendlyApiError maps 503 high demand to clean Bengali message without raw JSON', () => {
  const raw503 =
    '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}';
  assert.equal(formatFriendlyApiError(raw503), FRIENDLY_503_MESSAGE);
  assert.equal(
    formatFriendlyApiError('Something random went wrong'),
    'বন্ধু, সংযোগে একটু সমস্যা হয়েছে। অনুগ্রহ করে আরেকবার চেষ্টা করো।'
  );
});

test('SUKOON_SYSTEM_PROMPT identifies the companion as Rubi (রুবি)', () => {
  assert.ok(SUKOON_SYSTEM_PROMPT.includes("'Rubi' (রুবি)"));
  assert.ok(!SUKOON_SYSTEM_PROMPT.includes('Sukoon'));
});

test('pickRubiVoice prioritizes Bangladeshi female Bengali voices like Nabanita and Google বাংলা', () => {
  const mixedVoices = [
    { name: 'Microsoft Pradeep Online (Natural) - Bengali (Bangladesh)', lang: 'bn-BD' },
    { name: 'Google বাংলা', lang: 'bn-IN' },
    { name: 'Microsoft Nabanita Online (Natural) - Bengali (Bangladesh)', lang: 'bn-BD' },
  ];
  assert.equal(
    pickRubiVoice(mixedVoices, 'bn-BD')?.name,
    'Microsoft Nabanita Online (Natural) - Bengali (Bangladesh)'
  );

  const googleOnly = [
    { name: 'Microsoft Bashkar', lang: 'bn-IN' },
    { name: 'Google বাংলা', lang: 'bn-IN' },
  ];
  assert.equal(pickRubiVoice(googleOnly, 'bn-BD')?.name, 'Google বাংলা');
});

test('buildGeminiRestEndpoint targets gemini-2.5-flash REST API', () => {
  assert.equal(GEMINI_MODEL, 'gemini-2.5-flash');
  assert.equal(
    buildGeminiRestEndpoint('test-key'),
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=test-key'
  );
});

test('buildGeminiRestPayload and parseGeminiRestResponse format REST request and parse suggestions & sources', () => {
  const payload = buildGeminiRestPayload(
    [{ role: 'user', text: 'হ্যালো রুবি' }],
    true
  );
  assert.ok(payload);
  assert.equal(payload.contents[0]?.role, 'user');
  assert.deepEqual(payload.tools, [{ googleSearch: {} }]);

  const parsed = parseGeminiRestResponse({
    candidates: [
      {
        content: {
          parts: [
            {
              text: '**হ্যালো বন্ধু, আমি রুবি!**\n\n- কেমন আছো আজ?\n\nSUGGESTIONS:\n- আজকের আবহাওয়া কেমন?\n- একটু গল্প করি?',
            },
          ],
        },
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: 'https://example.com/rubi', title: 'Example' } },
          ],
        },
      },
    ],
  });

  assert.ok(parsed);
  assert.ok(parsed.text.includes('হ্যালো বন্ধু, আমি রুবি!'));
  assert.deepEqual(parsed.suggestions, ['আজকের আবহাওয়া কেমন?', 'একটু গল্প করি?']);
  assert.deepEqual(parsed.sources, [
    { title: 'Example', uri: 'https://example.com/rubi' },
  ]);
});
