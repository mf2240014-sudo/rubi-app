import { useState, type FormEvent } from 'react';
import { Check, Copy, Play, Trash2 } from 'lucide-react';
import {
  API_PRESETS,
  parseJsonSafe,
  validateApiUrl,
  type ApiMethod,
  type ApiPreset,
  type ApiRunRecord,
  type DemoLocale,
} from '../utils/demoLogic';

interface ApiTesterProps {
  locale: DemoLocale;
  onNotify: (kind: 'success' | 'warning' | 'error', text: string) => void;
}

export function ApiTester({ locale, onNotify }: ApiTesterProps) {
  const bn = locale === 'bn';

  const [method, setMethod] = useState<ApiMethod>('GET');
  const [url, setUrl] = useState('/api/demo/items');
  const [bodyText, setBodyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ApiRunRecord | null>(null);
  const [history, setHistory] = useState<ApiRunRecord[]>([]);
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');
  const [copied, setCopied] = useState(false);

  const applyPreset = (preset: ApiPreset) => {
    setMethod(preset.method);
    setUrl(preset.url);
    setBodyText(preset.body ?? '');
    setRequestError(null);
  };

  const handleFormatJson = () => {
    if (!bodyText.trim()) return;
    const parsed = parseJsonSafe(bodyText);
    if (!parsed.ok) {
      setRequestError(
        bn ? `ভুল JSON ফরম্যাট: ${parsed.error}` : `Invalid JSON: ${parsed.error}`
      );
      return;
    }
    setRequestError(null);
    setBodyText(JSON.stringify(parsed.value, null, 2));
  };

  const executeRequest = async (e?: FormEvent) => {
    e?.preventDefault();
    const urlError = validateApiUrl(url);
    if (urlError) {
      setRequestError(urlError);
      return;
    }

    let parsedBody: string | undefined;
    if (method === 'POST' && bodyText.trim()) {
      const check = parseJsonSafe(bodyText);
      if (!check.ok) {
        setRequestError(
          bn ? `ভুল JSON পেলোড: ${check.error}` : `Invalid JSON body: ${check.error}`
        );
        return;
      }
      parsedBody = JSON.stringify(check.value);
    }

    setRequestError(null);
    setIsSending(true);
    const start = performance.now();

    try {
      const res = await fetch(url.trim(), {
        method,
        headers: parsedBody ? { 'Content-Type': 'application/json' } : undefined,
        body: parsedBody,
      });
      const durationMs = Math.round(performance.now() - start);
      const rawText = await res.text();
      let formattedText = rawText;
      const jsonAttempt = parseJsonSafe(rawText);
      if (jsonAttempt.ok && jsonAttempt.value !== undefined) {
        formattedText = JSON.stringify(jsonAttempt.value, null, 2);
      }

      const headers: Array<[string, string]> = [];
      res.headers.forEach((val, key) => {
        headers.push([key, val]);
      });

      const record: ApiRunRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        method,
        url: url.trim(),
        status: res.status,
        durationMs,
        ok: res.ok,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        responseText: formattedText || '(empty response)',
        headers,
      };

      setActiveRun(record);
      setHistory((prev) => [record, ...prev].slice(0, 8));
      onNotify(
        res.ok ? 'success' : 'warning',
        `${method} ${url.trim()} returned HTTP ${res.status}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setRequestError(msg);
      onNotify('error', msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyResponse = async () => {
    if (!activeRun?.responseText) return;
    try {
      await navigator.clipboard.writeText(activeRun.responseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard permissions
    }
  };

  return (
    <section aria-labelledby="api-tester-heading" className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1
          id="api-tester-heading"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          style={{ textWrap: 'balance' }}
        >
          {bn ? '01. HTTP API ও JSON টেস্টার' : '01. HTTP API & JSON Endpoint Tester'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {bn
            ? 'সরাসরি GET, POST বা DELETE রিকোয়েস্ট পাঠিয়ে রেসপন্স স্ট্যাটাস, সময় ও JSON ডেটা যাচাই করুন।'
            : 'Send live GET, POST, or DELETE requests against built-in demo routes or public endpoints and inspect status codes, headers, and payloads.'}
        </p>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="API endpoint presets">
        {API_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset)}
            className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors hover:border-sky-500/60 hover:text-sky-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-400/60 dark:hover:text-sky-400"
          >
            {bn ? preset.labelBn : preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Request Builder + Response */}
        <div className="space-y-6 lg:col-span-8">
          <form
            onSubmit={executeRequest}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111824]"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="api-method" className="sr-only">
                HTTP Method
              </label>
              <select
                id="api-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as ApiMethod)}
                className="min-h-[42px] rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm font-semibold text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="DELETE">DELETE</option>
              </select>

              <label htmlFor="api-url" className="sr-only">
                Endpoint URL
              </label>
              <input
                id="api-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/api/demo/items"
                className="min-h-[42px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />

              <button
                type="submit"
                disabled={isSending}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>{isSending ? (bn ? 'পাঠানো হচ্ছে...' : 'Sending...') : bn ? 'রিকোয়েস্ট পাঠাও' : 'Send Request'}</span>
              </button>
            </div>

            {method === 'POST' && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="api-json-body"
                    className="text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    {bn ? 'JSON রিকোয়েস্ট বডি' : 'JSON Request Body'}
                  </label>
                  <button
                    type="button"
                    onClick={handleFormatJson}
                    className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                  >
                    {bn ? 'JSON ফরম্যাট করো' : 'Format JSON'}
                  </button>
                </div>
                <textarea
                  id="api-json-body"
                  rows={5}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder='{"name": "Sample Test"}'
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {requestError && (
              <p
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                {requestError}
              </p>
            )}
          </form>

          {/* Response Viewer */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111824]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {bn ? 'রেসপন্স ফলাফল' : 'Response Output'}
                </h2>
                {activeRun && (
                  <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                    <span
                      data-testid="api-status-label"
                      className={`font-semibold ${
                        activeRun.ok
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      HTTP {activeRun.status} {activeRun.ok ? '(OK)' : '(Error)'}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {activeRun.durationMs} ms
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeRun && (
                  <>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => setResponseTab('body')}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          responseTab === 'body'
                            ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Body
                      </button>
                      <button
                        type="button"
                        onClick={() => setResponseTab('headers')}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          responseTab === 'headers'
                            ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Headers ({activeRun.headers.length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyResponse}
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
                  </>
                )}
              </div>
            </div>

            {!activeRun ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                {bn
                  ? 'উপরের যেকোনো প্রিসেট বা কাস্টম URL বেছে নিয়ে "রিকোয়েস্ট পাঠাও" ক্লিক করুন।'
                  : 'Select any preset above or enter a URL and click "Send Request" to inspect the response.'}
              </div>
            ) : responseTab === 'body' ? (
              <pre
                data-testid="api-response-body"
                className="mt-3 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-[#0b1117] dark:text-slate-200"
              >
                <code>{activeRun.responseText}</code>
              </pre>
            ) : (
              <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left font-mono text-xs">
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {activeRun.headers.map(([k, v]) => (
                      <tr key={k} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                          {k}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 break-all">
                          {v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Request History Panel */}
        <aside className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111824] lg:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {bn ? 'সাম্প্রতিক টেস্ট' : 'Recent Runs'}
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                aria-label="Clear request history"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{bn ? 'মুছুন' : 'Clear'}</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {bn
                ? 'এখনো কোনো API রিকোয়েস্ট চালানো হয়নি।'
                : 'No requests executed yet in this session.'}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
              {history.map((run) => (
                <li key={run.id} className="py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod(run.method);
                      setUrl(run.url);
                      setActiveRun(run);
                    }}
                    className="flex w-full items-center justify-between gap-2 text-left transition-colors hover:text-sky-600 dark:hover:text-sky-400"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {run.method} {run.url}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {run.timestamp} · {run.durationMs} ms
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                        run.ok
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {run.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
