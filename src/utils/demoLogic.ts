export type DemoSection = 'api' | 'form' | 'table' | 'playground';
export type DemoLocale = 'bn' | 'en';
export type ApiMethod = 'GET' | 'POST' | 'DELETE';
export type DemoCategory = 'API' | 'UI' | 'Security';

export interface DemoItem {
  id: string;
  name: string;
  category: DemoCategory;
  price: number;
  stock: number;
  status: 'Active' | 'Draft';
}

export interface ApiPreset {
  id: string;
  label: string;
  labelBn: string;
  method: ApiMethod;
  url: string;
  body?: string;
}

export interface ApiRunRecord {
  id: string;
  method: ApiMethod;
  url: string;
  status: number;
  durationMs: number;
  ok: boolean;
  timestamp: string;
  responseText: string;
  headers: Array<[string, string]>;
}

export interface FormTestValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'tester' | 'developer' | 'designer';
  birthDate: string;
  notes: string;
  acceptedTerms: boolean;
}

export type FormValidationErrors = Partial<Record<keyof FormTestValues, string>>;

export const INITIAL_DEMO_ITEMS: DemoItem[] = [
  {
    id: 'item-101',
    name: 'REST Echo Suite',
    category: 'API',
    price: 29,
    stock: 42,
    status: 'Active',
  },
  {
    id: 'item-102',
    name: 'Checkout Form Validator',
    category: 'UI',
    price: 19,
    stock: 18,
    status: 'Active',
  },
  {
    id: 'item-103',
    name: 'OAuth Token Inspector',
    category: 'Security',
    price: 49,
    stock: 12,
    status: 'Active',
  },
  {
    id: 'item-104',
    name: 'Responsive Grid Matrix',
    category: 'UI',
    price: 15,
    stock: 30,
    status: 'Draft',
  },
  {
    id: 'item-105',
    name: 'Status Code Simulator',
    category: 'API',
    price: 24,
    stock: 27,
    status: 'Active',
  },
  {
    id: 'item-106',
    name: 'CSRF Header Guard',
    category: 'Security',
    price: 39,
    stock: 9,
    status: 'Draft',
  },
];

export const API_PRESETS: ApiPreset[] = [
  {
    id: 'get-items',
    label: 'List Demo Items',
    labelBn: 'সব আইটেম দেখো (GET)',
    method: 'GET',
    url: '/api/demo/items',
  },
  {
    id: 'post-item',
    label: 'Create Demo Item',
    labelBn: 'নতুন আইটেম যোগ করো (POST)',
    method: 'POST',
    url: '/api/demo/items',
    body: JSON.stringify(
      {
        name: 'GraphQL Schema Probe',
        category: 'API',
        price: 35,
        stock: 14,
      },
      null,
      2
    ),
  },
  {
    id: 'post-echo',
    label: 'Echo JSON Payload',
    labelBn: 'JSON পেলোড ইকো টেস্ট (POST)',
    method: 'POST',
    url: '/api/demo/echo',
    body: JSON.stringify(
      {
        tester: 'DemoLab QA',
        scenario: 'login_smoke_check',
        assertions: ['status_200', 'valid_json'],
      },
      null,
      2
    ),
  },
  {
    id: 'status-404',
    label: 'Simulate 404 Not Found',
    labelBn: '404 এরর টেস্ট করো',
    method: 'GET',
    url: '/api/demo/status/404',
  },
  {
    id: 'status-500',
    label: 'Simulate 500 Server Error',
    labelBn: '500 সার্ভার এরর টেস্ট',
    method: 'GET',
    url: '/api/demo/status/500',
  },
];

export function parseJsonSafe(raw: string): {
  ok: boolean;
  value?: unknown;
  error?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid JSON syntax',
    };
  }
}

export function validateApiUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return 'Endpoint URL is required.';
  }
  if (trimmed.startsWith('/')) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Only http://, https://, or relative /api/... paths are supported.';
    }
    return null;
  } catch {
    return 'Enter a valid /api/... path or full http(s):// URL.';
  }
}

export function evaluatePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  labelEn: string;
  labelBn: string;
} {
  if (!password) {
    return { score: 0, labelEn: 'Empty', labelBn: 'খালি' };
  }
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(4, Math.max(1, score)) as 1 | 2 | 3 | 4;
  const labels: Record<1 | 2 | 3 | 4, { en: string; bn: string }> = {
    1: { en: 'Weak', bn: 'দুর্বল' },
    2: { en: 'Fair', bn: 'মাঝারি' },
    3: { en: 'Strong', bn: 'মজবুত' },
    4: { en: 'Very Strong', bn: 'অত্যন্ত শক্তিশালী' },
  };
  return {
    score: clamped,
    labelEn: labels[clamped].en,
    labelBn: labels[clamped].bn,
  };
}

export function validateTestForm(
  values: FormTestValues,
  locale: DemoLocale
): FormValidationErrors {
  const errors: FormValidationErrors = {};
  const bn = locale === 'bn';

  if (values.fullName.trim().length < 3) {
    errors.fullName = bn
      ? 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে।'
      : 'Full name must be at least 3 characters.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = bn
      ? 'সঠিক ইমেইল ঠিকানা লিখুন (যেমন: qa@example.com)।'
      : 'Enter a valid email address (e.g. qa@example.com).';
  }

  const normalizedPhone = values.phone.replace(/[\s-]/g, '');
  if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(normalizedPhone)) {
    errors.phone = bn
      ? 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (+8801XXXXXXXXX)।'
      : 'Enter a valid BD mobile number (+8801XXXXXXXXX or 01XXXXXXXXX).';
  }

  if (values.password.length < 8 || !/\d/.test(values.password)) {
    errors.password = bn
      ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর ও ১টি সংখ্যাযুক্ত হতে হবে।'
      : 'Password must be at least 8 characters and include a number.';
  }

  if (!values.birthDate) {
    errors.birthDate = bn ? 'একটি তারিখ নির্বাচন করুন।' : 'Select a date.';
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = bn
      ? 'চালিয়ে যেতে শর্তাবলিতে টিক দিন।'
      : 'Please accept the test terms to submit.';
  }

  return errors;
}

export function filterAndSortItems(
  items: DemoItem[],
  options: {
    query: string;
    category: 'ALL' | DemoCategory;
    sortBy: 'name' | 'price' | 'stock';
    sortDir: 'asc' | 'desc';
  }
): DemoItem[] {
  const q = options.query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const matchesCategory =
      options.category === 'ALL' || item.category === options.category;
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const factor = options.sortDir === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    if (options.sortBy === 'name') {
      return a.name.localeCompare(b.name) * factor;
    }
    return (a[options.sortBy] - b[options.sortBy]) * factor;
  });
}

export function itemsToCsv(items: DemoItem[]): string {
  const header = ['id', 'name', 'category', 'price', 'stock', 'status'].join(',');
  const rows = items.map((item) =>
    [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.price,
      item.stock,
      item.status,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}
