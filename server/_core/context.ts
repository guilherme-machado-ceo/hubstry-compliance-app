import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Fallback when DB is not yet seeded but BYPASS_AUTH is active
const DEV_MOCK_USER: User = {
  id: 1,
  openId: "dev-user-001",
  name: "Dev User",
  email: "dev@hubstry.local",
  loginMethod: "bypass",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<TrpcContext> {
  // Dev bypass: skips GitHub OAuth entirely — use BYPASS_AUTH=true in .env.development
  // On Vercel, set BYPASS_AUTH=true + VERCEL_DEMO_MODE=true for demo deployments
  const bypassAuth = process.env["BYPASS_AUTH"] === "true";
  const nodeEnv = process.env["NODE_ENV"];
  const vercelDemoMode = process.env["VERCEL_DEMO_MODE"];

  if (bypassAuth) {
    if (nodeEnv === "production" && vercelDemoMode !== "true") {
      throw new Error(
        "[FATAL] BYPASS_AUTH nao pode ser ativado em producao sem VERCEL_DEMO_MODE=true.",
      );
    }
    if (vercelDemoMode === "true") {
      console.warn(
        "[AUTH] Modo demo ativo — BYPASS_AUTH habilitado em producao (VERCEL_DEMO_MODE=true)",
      );
    }

    let devUser: User | undefined;
    try {
      devUser = await db.getUserByOpenId("dev-user-001");
    } catch {
      devUser = undefined;
    }

    return {
      req: opts.req,
      res: opts.res,
      user: (devUser ?? DEV_MOCK_USER) as User,
    };
  }

  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
