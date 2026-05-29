import type { VercelRequest, VercelResponse } from "@vercel/node";
import superjson from "superjson";

/**
 * Vercel serverless entry point for all tRPC requests.
 *
 * Uses appRouter.createCaller() directly — no Express or Fetch adapter.
 * This avoids all adapter-related compatibility issues with
 * Express 5 / Vercel serverless / tRPC v11.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    // Lazy imports — isolates potential module-level crashes
    const { appRouter } = await import("../../server/routers");
    const { createContext } = await import("../../server/_core/context");

    const ctx = await createContext({
      req: req as any,
      res: res as any,
      info: { isBatchCall: false, calls: [] },
    } as any);

    const caller = appRouter.createCaller(ctx);

    // Parse procedure path: /api/trpc/auth.me → "auth.me"
    const url = new URL(
      req.url || "/",
      `https://${req.headers["host"] || "localhost"}`,
    );
    const procedurePath = url.pathname
      .replace(/^\/api\/trpc\/?/, "")
      .split("?")[0];

    // Navigate nested routers: auth.me → caller["auth"]["me"]
    const parts = procedurePath.split(".").filter(Boolean);
    let current: unknown = caller;
    for (const part of parts) {
      if (
        current &&
        typeof current === "object" &&
        part in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return res.status(404).json({
          error: `Procedure "${procedurePath}" not found`,
        });
      }
    }

    if (typeof current !== "function") {
      return res.status(404).json({
        error: `"${procedurePath}" is not a procedure`,
      });
    }

    // Parse input from ?input=... query param (superjson encoded)
    const rawInput = url.searchParams.get("input");
    const parsedInput = rawInput ? superjson.parse(rawInput) : undefined;

    // Call the procedure
    const result = await (current as (input?: unknown) => unknown)(
      parsedInput,
    );

    // Return tRPC response envelope (compatible with @trpc/client)
    return res.status(200).json({
      result: {
        data: superjson.serialize(result),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    console.error("[tRPC] Handler error:", message);

    // Return tRPC error envelope
    return res.status(200).json({
      error: {
        code: "INTERNAL_SERVER_ERROR" as const,
        message,
      },
    });
  }
}
