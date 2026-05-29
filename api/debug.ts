import type { VercelRequest, VercelResponse } from "@vercel/node";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: Record<string, string> = {};
  const steps = [
    ["shared/const", () => require("../../shared/const")],
    ["shared/pillars", () => require("../../shared/pillars")],
    ["shared/_core/errors", () => require("../../shared/_core/errors")],
    ["server/_core/env", () => require("../../server/_core/env")],
    ["server/_core/express5-compat", () => require("../../server/_core/express5-compat")],
    ["server/_core/trpc", () => require("../../server/_core/trpc")],
    ["server/_core/cookies", () => require("../../server/_core/cookies")],
    ["server/_core/sdk", () => require("../../server/_core/sdk")],
    ["server/db", () => require("../../server/db")],
    ["server/_core/context", () => require("../../server/_core/context")],
    ["server/scanner", () => require("../../server/scanner")],
    ["server/stripe-products", () => require("../../server/stripe-products")],
    ["server/stripe-router", () => require("../../server/stripe-router")],
    ["server/_core/systemRouter", () => require("../../server/_core/systemRouter")],
    ["server/routers", () => require("../../server/routers")],
  ];
  for (const [name, fn] of steps) {
    try { fn(); results[name] = "OK"; }
    catch (e: unknown) { results[name] = String(e instanceof Error ? e.message : e); }
  }
  const failed = Object.entries(results).filter(([,v]) => v !== "OK");
  res.status(failed.length > 0 ? 500 : 200).json({ results, failed });
}
