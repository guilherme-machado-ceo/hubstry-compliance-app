import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * DIAGNOSTIC HANDLER — Remove this after fixing the issue.
 * Tests each module import one-by-one to find the crash source.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const results: Record<string, string> = {};

  // Step 0: Check env vars
  results["DATABASE_URL"] = process.env["DATABASE_URL"] ? "SET" : "MISSING";
  results["DATABASE_PROVIDER"] = process.env["DATABASE_PROVIDER"] || "MISSING";
  results["DATABASE_AUTH_TOKEN"] = process.env["DATABASE_AUTH_TOKEN"] ? "SET" : "MISSING";
  results["BYPASS_AUTH"] = process.env["BYPASS_AUTH"] || "MISSING";
  results["VERCEL_DEMO_MODE"] = process.env["VERCEL_DEMO_MODE"] || "MISSING";
  results["JWT_SECRET"] = process.env["JWT_SECRET"] ? "SET" : "MISSING";
  results["CRON_SECRET"] = process.env["CRON_SECRET"] ? "SET" : "MISSING";
  results["GITHUB_CLIENT_ID"] = process.env["GITHUB_CLIENT_ID"] ? "SET" : "MISSING";
  results["STRIPE_SECRET_KEY"] = process.env["STRIPE_SECRET_KEY"] ? "SET" : "MISSING";

  // Step 1: Test @shared imports (path alias)
  try {
    await import("../../shared/const");
    results["import_shared_const"] = "OK";
  } catch (e: unknown) {
    results["import_shared_const"] = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Step 2: Test server env
  try {
    await import("../../server/_core/env");
    results["import_server_env"] = "OK";
  } catch (e: unknown) {
    results["import_server_env"] = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Step 3: Test server db
  try {
    await import("../../server/db");
    results["import_server_db"] = "OK";
  } catch (e: unknown) {
    results["import_server_db"] = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Step 4: Test server context
  try {
    await import("../../server/_core/context");
    results["import_server_context"] = "OK";
  } catch (e: unknown) {
    results["import_server_context"] = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Step 5: Test server scanner (jsdom)
  try {
    await import("../../server/scanner");
    results["import_server_scanner"] = "OK";
  } catch (e: unknown) {
    results["import_server_scanner"] = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Step 6: Test full routers
  try {
    await import("../../server/routers");
    results["import_server_routers"] = "OK";
  } catch (e: unknown) {
    results["import_server_routers"] = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Step 7: Test tRPC createCaller
  try {
    const { appRouter } = await import("../../server/routers");
    const { createContext } = await import("../../server/_core/context");
    const ctx = await createContext({
      req: req as any,
      res: res as any,
      info: { isBatchCall: false, calls: [] },
    } as any);
    const caller = appRouter.createCaller(ctx);
    results["createCaller"] = "OK";
    results["auth_me"] = JSON.stringify(caller.auth?.me ? "has_proc" : "no_auth");
  } catch (e: unknown) {
    results["createCaller"] = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  const hasFail = Object.values(results).some((v) => v.startsWith("FAIL"));

  return res.status(hasFail ? 500 : 200).json({
    diagnostic: true,
    results,
  });
}
