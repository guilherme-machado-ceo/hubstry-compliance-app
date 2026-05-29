import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../_server/routers";
import { createContext } from "../_server/_core/context";

export const config = {
  maxDuration: 30,
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Convert Vercel's IncomingMessage to a Web API Request for fetchRequestHandler
  const url = `https://${req.headers["host"] ?? "localhost"}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else {
      headers.set(key, value);
    }
  }

  let bodyInit: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    bodyInit = JSON.stringify(req.body);
  }

  const request = new Request(url, {
    method: req.method ?? "GET",
    headers,
    body: bodyInit,
  });

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () =>
      createContext({
        req: req as any,
        res: res as any,
        info: { isBatchCall: false, calls: [] } as any,
      }),
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC] Error on ${path ?? "unknown"}:`, error);
      }
    },
  });

  // Copy response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await response.text();
  res.status(response.status).send(body);
}
