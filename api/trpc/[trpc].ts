import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

/**
 * Vercel serverless entry point for all tRPC requests.
 * Uses the Fetch adapter instead of Express to avoid runtime
 * incompatibilities between Express 5 and Vercel serverless.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    // Build the full URL that tRPC expects
    const proto =
      (typeof req.headers["x-forwarded-proto"] === "string"
        ? req.headers["x-forwarded-proto"]
        : "https") || "https";
    const host =
      (typeof req.headers["host"] === "string"
        ? req.headers["host"]
        : "localhost") || "localhost";
    const url = new URL(req.url || "/", `${proto}://${host}`);

    // Convert Vercel headers to a plain object
    const headersInit: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headersInit[key] = value;
      } else if (Array.isArray(value)) {
        headersInit[key] = value.join(", ");
      }
    }

    // Build Fetch API Request from Vercel request
    const fetchReq = new Request(url.toString(), {
      method: req.method || "GET",
      headers: headersInit,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(req.body)
          : undefined,
    });

    // Use tRPC Fetch adapter (no Express dependency)
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: fetchReq,
      router: appRouter,
      createContext: () =>
        createContext({
          req: req as any,
          res: res as any,
        }),
    });

    // Forward the Fetch Response to Vercel's response
    const body = await response.text();
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    });
    res.send(body);
  } catch (error) {
    console.error("[tRPC] Handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
