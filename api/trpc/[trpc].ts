import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createContext } from '../../server/_core/context';
import { appRouter } from '../../server/routers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return createExpressMiddleware({
    router: appRouter,
    createContext,
  })(req as any, res as any, () => {});
}
