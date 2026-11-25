import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_DEMO_ITEMS,
  evaluatePasswordStrength,
  filterAndSortItems,
  itemsToCsv,
  parseJsonSafe,
  validateApiUrl,
  validateTestForm,
} from './demoLogic';

test('parseJsonSafe parses valid JSON and reports syntax errors cleanly', () => {
  assert.deepEqual(parseJsonSafe('{"ok":true}'), {
    ok: true,
    value: { ok: true },
  });
  assert.equal(parseJsonSafe('').ok, true);
  assert.equal(parseJsonSafe('{bad json').ok, false);
});

test('validateApiUrl accepts relative /api routes and http(s) URLs, rejecting invalid schemes', () => {
  assert.equal(validateApiUrl('/api/demo/items'), null);
  assert.equal(validateApiUrl('https://example.com/users'), null);
  assert.ok(validateApiUrl('') !== null);
  assert.ok(validateApiUrl('javascript:alert(1)') !== null);
});

test('validateTestForm flags invalid input and passes valid Bangladeshi test profile', () => {
  const invalid = validateTestForm(
    {
      fullName: 'A',
      email: 'bad-email',
      phone: '12345',
      password: 'abc',
      role: 'tester',
      birthDate: '',
      notes: '',
      acceptedTerms: false,
    },
    'en'
  );
  assert.ok(invalid.fullName && invalid.email && invalid.phone && invalid.password && invalid.acceptedTerms);

  const valid = validateTestForm(
    {
      fullName: 'Nadia Rahman',
      email: 'nadia.qa@example.com',
      phone: '+8801712345678',
      password: 'DemoPass123!',
      role: 'tester',
      birthDate: '2026-11-25',
      notes: 'Smoke test pass',
      acceptedTerms: true,
    },
    'bn'
  );
  assert.deepEqual(valid, {});
});

test('evaluatePasswordStrength scores empty, weak, and strong passwords properly', () => {
  assert.equal(evaluatePasswordStrength('').score, 0);
  assert.equal(evaluatePasswordStrength('abc').score, 1);
  assert.equal(evaluatePasswordStrength('StrongPass123!').score, 4);
});

test('filterAndSortItems filters by category/query and sorts numerically', () => {
  const apiAsc = filterAndSortItems(INITIAL_DEMO_ITEMS, {
    query: '',
    category: 'API',
    sortBy: 'price',
    sortDir: 'asc',
  });
  assert.equal(apiAsc.length, 2);
  assert.ok(apiAsc[0].price <= apiAsc[1].price);

  const searched = filterAndSortItems(INITIAL_DEMO_ITEMS, {
    query: 'oauth',
    category: 'ALL',
    sortBy: 'name',
    sortDir: 'asc',
  });
  assert.equal(searched.length, 1);
  assert.equal(searched[0]?.id, 'item-103');
});

test('itemsToCsv escapes names and emits header plus rows', () => {
  const csv = itemsToCsv([
    {
      id: 'item-1',
      name: 'QA "Smoke" Kit',
      category: 'API',
      price: 25,
      stock: 5,
      status: 'Active',
    },
  ]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[1], 'item-1,"QA ""Smoke"" Kit",API,25,5,Active');
});
