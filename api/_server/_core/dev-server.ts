import { config } from 'dotenv';
// Load .env.local first (local overrides, gitignored), then .env.development as fallback (committed dev defaults)
config({ path: '.env.local' });
config({ path: '.env.development', override: true });

import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import { createContext } from './context';
import { appRouter } from '../routers';
import { registerOAuthRoutes } from './oauth';
import { registerMonthlyResetJob } from '../jobs/reset-monthly-scans';

const app = express();

app.use(cors({ origin: process.env.VITE_ORIGIN ?? 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime() });
});

registerOAuthRoutes(app);

app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

const PORT = Number(process.env.API_PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  registerMonthlyResetJob();
});
