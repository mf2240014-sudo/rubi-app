import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowUpDown, Download, Plus, Search, Trash2 } from 'lucide-react';
import {
  filterAndSortItems,
  itemsToCsv,
  type DemoCategory,
  type DemoItem,
  type DemoLocale,
} from '../utils/demoLogic';

interface DataTableLabProps {
  locale: DemoLocale;
  refreshSignal: number;
  onNotify: (kind: 'success' | 'warning' | 'error' | 'info', text: string) => void;
}

export function DataTableLab({
  locale,
  refreshSignal,
  onNotify,
}: DataTableLabProps) {
  const bn = locale === 'bn';
  const [items, setItems] = useState<DemoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'ALL' | DemoCategory>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<DemoCategory>('API');
  const [newPrice, setNewPrice] = useState('29');
  const [newStock, setNewStock] = useState('15');
  const [isAdding, setIsAdding] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/demo/items');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { items?: DemoItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems, refreshSignal]);

  const handleSort = (column: 'name' | 'price' | 'stock') => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      onNotify(
        'warning',
        bn ? 'আইটেমের নাম কমপক্ষে ২ অক্ষরের দিন।' : 'Item name must be at least 2 characters.'
      );
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/demo/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          category: newCategory,
          price: Number(newPrice) || 25,
          stock: Number(newStock) || 10,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { item: DemoItem };
      setItems((prev) => [data.item, ...prev]);
      setNewName('');
      onNotify(
        'success',
        bn ? `"${data.item.name}" যোগ করা হয়েছে।` : `Created "${data.item.name}".`
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Create failed');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (item: DemoItem) => {
    try {
      const res = await fetch(`/api/demo/items/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      onNotify(
        'info',
        bn ? `"${item.name}" মুছে ফেলা হয়েছে।` : `Deleted "${item.name}".`
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleExportCsv = () => {
    const csv = itemsToCsv(visibleItems);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'demolab-items.csv';
    link.click();
    URL.revokeObjectURL(url);
    onNotify(
      'success',
      bn ? 'CSV ফাইল ডাউনলোড শুরু হয়েছে।' : 'CSV export downloaded.'
    );
  };

  const visibleItems = filterAndSortItems(items, {
    query,
    category,
    sortBy,
    sortDir,
  });

  return (
    <section aria-labelledby="table-lab-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id="table-lab-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            style={{ textWrap: 'balance' }}
          >
            {bn ? '03. ডেটা টেবিল, ফিল্টার ও CRUD টেস্ট' : '03. CRUD Data Grid & Filter Lab'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {bn
              ? 'সার্ভার API-এর সাথে যুক্ত লাইভ সার্চ, ক্যাটাগরি ফিল্টার, সর্টিং এবং নতুন আইটেম যোগ/মুছার টেস্ট।'
              : 'Live server-backed CRUD grid supporting search, category filtering, sortable tabular columns, and CSV export.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={visibleItems.length === 0}
          className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 hover:border-sky-500/60 hover:text-sky-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-sky-400"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{bn ? 'CSV ডাউনলোড' : 'Download CSV'}</span>
        </button>
      </div>

      {/* Add Item Form */}
      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-12 dark:border-slate-800 dark:bg-[#111824]"
      >
        <div className="sm:col-span-5">
          <label htmlFor="new-item-name" className="sr-only">
            Item name
          </label>
          <input
            id="new-item-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={bn ? 'নতুন টেস্ট আইটেমের নাম...' : 'New test suite item name...'}
            className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="new-item-category" className="sr-only">
            Category
          </label>
          <select
            id="new-item-category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as DemoCategory)}
            className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="API">API</option>
            <option value="UI">UI</option>
            <option value="Security">Security</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="new-item-price" className="sr-only">
            Price
          </label>
          <input
            id="new-item-price"
            type="number"
            min="0"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Price"
            className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="new-item-stock" className="sr-only">
            Stock
          </label>
          <input
            id="new-item-stock"
            type="number"
            min="0"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            placeholder="Qty"
            className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 font-mono text-sm tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isAdding}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white whitespace-nowrap hover:bg-sky-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{bn ? 'যোগ করুন' : 'Add Item'}</span>
          </button>
        </div>
      </form>

      {/* Filter Toolbar + Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111824]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <label htmlFor="table-search" className="sr-only">
              Search items
            </label>
            <input
              id="table-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={bn ? 'নাম বা ID দিয়ে খুঁজুন...' : 'Search by name or ID...'}
              className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div
            role="group"
            aria-label="Category filter"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900"
          >
            {(['ALL', 'API', 'UI', 'Security'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`min-h-[32px] rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  category === cat
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? (bn ? 'সব' : 'All') : cat}
              </button>
            ))}
          </div>
        </div>

        {loadError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void fetchItems()}
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-sky-500 dark:text-slate-950"
            >
              {bn ? 'আবার চেষ্টা করো' : 'Retry'}
            </button>
          </div>
        ) : isLoading ? (
          <div className="divide-y divide-slate-200 p-4 dark:divide-slate-800">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex h-11 items-center justify-between gap-4 py-2">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {bn
                ? 'এই সার্চ বা ফিল্টারে কোনো আইটেম পাওয়া যায়নি।'
                : 'No items match the current search or category filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('ALL');
              }}
              className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {bn ? 'ফিল্টার রিসেট করো' : 'Clear Filters'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-mono">ID</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>{bn ? 'নাম' : 'Name'}</span>
                      <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-4 py-3">{bn ? 'ক্যাটাগরি' : 'Category'}</th>
                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('price')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>{bn ? 'মূল্য' : 'Price'}</span>
                      <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('stock')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>{bn ? 'স্টক' : 'Stock'}</span>
                      <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </th>
                  <th className="px-4 py-3">{bn ? 'অবস্থা' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{bn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {visibleItems.map((item) => (
                  <tr
                    key={item.id}
                    className="h-11 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {item.id}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-slate-900 dark:text-slate-100">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                      {item.stock}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {item.status}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        aria-label={`Delete ${item.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
