import { createExpressMiddleware } from "@trpc/server/adapters/express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createContext } from "../../server/_core/context";
import { appRouter } from "../../server/routers";

/**
 * Vercel serverless entry point for all tRPC requests.
 * Wraps createExpressMiddleware in a try-catch to prevent unhandled crashes.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Express 5 types define Handler as an interface — cast to callable to avoid TS2349.
    const middleware = createExpressMiddleware({
      router: appRouter,
      createContext,
    }) as (
      req: unknown,
      res: unknown,
      next: () => void,
    ) => Promise<void>;

    await new Promise<void>((resolve, reject) => {
      middleware(
        req as any,
        res as any,
        () => resolve(),
      ).then(resolve).catch(reject);
    });
  } catch (error) {
    console.error("[tRPC] Handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
