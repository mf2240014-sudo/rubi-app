import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INITIAL_DEMO_ITEMS,
  type DemoCategory,
  type DemoItem,
} from './src/utils/demoLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Separate DemoLab API/UI Testing Tool endpoints
let demoItems: DemoItem[] = INITIAL_DEMO_ITEMS.map((item) => ({ ...item }));
let nextItemSeq = 107;

app.get('/api/demo/items', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

  const filtered = demoItems.filter((item) => {
    const okCategory = !category || category === 'ALL' || item.category === category;
    const okQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    return okCategory && okQuery;
  });

  res.json({ count: filtered.length, items: filtered });
});

app.post('/api/demo/items', (req, res) => {
  const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const rawCategory = req.body?.category;
  const price = Number(req.body?.price);
  const stock = Number(req.body?.stock);

  if (!rawName || rawName.length < 2) {
    res.status(400).json({ error: 'Item name must be at least 2 characters.' });
    return;
  }

  const validCategories: DemoCategory[] = ['API', 'UI', 'Security'];
  const category: DemoCategory = validCategories.includes(rawCategory)
    ? rawCategory
    : 'API';

  const created: DemoItem = {
    id: `item-${nextItemSeq++}`,
    name: rawName,
    category,
    price: Number.isFinite(price) && price >= 0 ? Math.round(price) : 25,
    stock: Number.isFinite(stock) && stock >= 0 ? Math.round(stock) : 10,
    status: req.body?.status === 'Draft' ? 'Draft' : 'Active',
  };

  demoItems = [created, ...demoItems];
  res.status(201).json({ created: true, item: created, totalCount: demoItems.length });
});

app.delete('/api/demo/items/:id', (req, res) => {
  const id = req.params.id;
  const existing = demoItems.find((item) => item.id === id);
  if (!existing) {
    res.status(404).json({ error: `Item '${id}' not found.` });
    return;
  }
  demoItems = demoItems.filter((item) => item.id !== id);
  res.json({ deleted: true, id, remainingCount: demoItems.length });
});

app.post('/api/demo/reset', (_req, res) => {
  demoItems = INITIAL_DEMO_ITEMS.map((item) => ({ ...item }));
  nextItemSeq = 107;
  res.json({ reset: true, count: demoItems.length, items: demoItems });
});

app.all('/api/demo/echo', (req, res) => {
  res.json({
    echoed: true,
    method: req.method,
    path: req.path,
    query: req.query,
    contentType: req.headers['content-type'] ?? null,
    body: req.body ?? null,
    receivedAt: new Date().toISOString(),
  });
});

app.all('/api/demo/status/:code', (req, res) => {
  const code = Number.parseInt(req.params.code, 10);
  if (!Number.isInteger(code) || code < 200 || code > 599) {
    res.status(400).json({ error: 'Status code must be between 200 and 599.' });
    return;
  }
  const labels: Record<number, string> = {
    200: 'OK — Simulated success response',
    201: 'Created — Simulated resource creation',
    400: 'Bad Request — Simulated validation error',
    401: 'Unauthorized — Simulated missing auth token',
    403: 'Forbidden — Simulated permission denial',
    404: 'Not Found — Simulated missing endpoint or record',
    429: 'Too Many Requests — Simulated rate limit response',
    500: 'Internal Server Error — Simulated backend failure',
    503: 'Service Unavailable — Simulated temporary overload',
  };
  res.status(code).json({
    simulatedStatus: code,
    message: labels[code] ?? `Simulated HTTP ${code} response`,
    testedAt: new Date().toISOString(),
  });
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
