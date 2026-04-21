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
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  if (process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV === "production") {
    throw new Error("[FATAL] BYPASS_AUTH não pode ser ativado em produção.");
  }

  // Dev bypass: skips Manus OAuth entirely — use BYPASS_AUTH=true in .env.development
  if (process.env.BYPASS_AUTH === "true") {
    const devUser = await db.getUserByOpenId("dev-user-001").catch(() => undefined);
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
