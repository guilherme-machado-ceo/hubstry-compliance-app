# ============================================================
# Hubstry Compliance — Fix Vercel FUNCTION_INVOCATION_FAILED
# Execute na pasta raiz do repo: hubstry-compliance-app
# ============================================================

$ErrorActionPreference = "Stop"
$branch = "fix/vercel-serverless-crash"

# Criar e mudar para o branch de fix
git checkout -b $branch 2>$null; if ($LASTEXITCODE -ne 0) { git checkout $branch }

Write-Host '📝 Aplicando correções...' -ForegroundColor Cyan

# --- api/trpc/[trpc].ts ---
New-Item -ItemType Directory -Force -Path 'api/trpc' | Out-Null
@'
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

export const config = {
  maxDuration: 30,
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Convert Vercel''s IncomingMessage to a Web API Request for fetchRequestHandler
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

'@ | Set-Content -Encoding UTF8 -Path 'api/trpc/[trpc].ts' -NoNewline
Write-Host '  ✅ api/trpc/[trpc].ts' -ForegroundColor Green

# --- package.json ---
@'
{
  "name": "hubstry-compliance-app",
  "version": "2.0.0",
  "description": "Plataforma profissional para auditar sites e verificar conformidade digital com padrões LGPD e ISO",
  "private": true,
  "license": "ELv2",
  "scripts": {
    "dev": "concurrently -n \"vite,api\" -c \"cyan,magenta\" \"vite\" \"tsx watch server/_core/dev-server.ts\"",
    "dev:full": "BYPASS_AUTH=true concurrently -n \"vite,api\" -c \"cyan,magenta\" \"vite\" \"tsx watch server/_core/dev-server.ts\"",
    "build": "vite build",
    "start": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "db:push:dev": "DATABASE_URL=file:./dev.db drizzle-kit push --config drizzle.sqlite.config.ts",
    "db:seed:dev": "DATABASE_URL=file:./dev.db DATABASE_PROVIDER=sqlite tsx server/seed.ts",
    "db:setup:dev": "pnpm db:push:dev && pnpm db:seed:dev",
    "db:reset:dev": "rm -f dev.db && pnpm db:setup:dev"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.4",
    "@libsql/client": "^0.17.2",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tanstack/react-query": "^5.45.0",
    "@trpc/client": "^11.16.0",
    "@trpc/react-query": "^11.16.0",
    "@trpc/server": "^11.16.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "cmdk": "^1.0.0",
    "cookie": "^1.1.1",
    "cors": "^2.8.6",
    "date-fns": "^3.0.0",
    "dotenv": "^17.4.2",
    "drizzle-orm": "^0.38.0",
    "embla-carousel-react": "^8.6.0",
    "express": "^5.2.1",
    "framer-motion": "^11.0.0",
    "input-otp": "^1.4.2",
    "jose": "^4.15.9",
    "jsdom": "^25.0.0",
    "lucide-react": "^0.344.0",
    "next-themes": "^0.4.6",
    "node-cron": "^4.2.1",
    "react": "^19.0.0",
    "react-day-picker": "^9.14.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.50.0",
    "react-resizable-panels": "^4.10.0",
    "recharts": "^2.14.0",
    "sonner": "^1.3.0",
    "streamdown": "^2.5.0",
    "stripe": "^14.0.0",
    "superjson": "^2.2.6",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "tw-animate-css": "^1.4.0",
    "vaul": "^1.1.2",
    "wouter": "3.7.1",
    "zod": "^3.22.0",
    "@shared": "workspace:*"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@tailwindcss/postcss": "^4.2.2",
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/jsdom": "^21.1.7",
    "@types/node": "^20.0.0",
    "@types/node-cron": "^3.0.11",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vercel/node": "^5.7.7",
    "@vitejs/plugin-react": "^4.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "autoprefixer": "^10.4.16",
    "concurrently": "^9.2.1",
    "drizzle-kit": "^0.30.0",
    "eslint": "^9.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.0.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.32",
    "prettier": "^3.1.0",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.21.0",
    "typescript": "^5.3.0",
    "typescript-eslint": "^7.0.0",
    "vite": "^5.4.0",
    "vitest": "^1.0.0"
  },
  "packageManager": "pnpm@10.4.1+sha512.c753b6c3ad7afa13af388fa6d808035a008e30ea9993f58c6663e2bc5ff21679aa834db094987129aa4d488b86df57f7b634981b2f827cdcacc698cc0cfb88af",
  "pnpm": {
    "overrides": {
      "tailwindcss>nanoid": "3.3.7"
    }
  },
  "workspaces": [
    "shared"
  ],
  "optionalDependencies": {
    "mysql2": "^3.9.0"
  }
}

'@ | Set-Content -Encoding UTF8 -Path 'package.json' -NoNewline
Write-Host '  ✅ package.json' -ForegroundColor Green

# --- pnpm-workspace.yaml ---
@'
packages:
  - ''shared''

'@ | Set-Content -Encoding UTF8 -Path 'pnpm-workspace.yaml' -NoNewline
Write-Host '  ✅ pnpm-workspace.yaml' -ForegroundColor Green

# --- server/db.ts ---
New-Item -ItemType Directory -Force -Path 'server' | Out-Null
@'
import { and, desc, eq, lt, sql } from "drizzle-orm";
// Import MySQL schema for TypeScript types (canonical type source)
import type { Audit, InsertUser, User, Violation } from "../drizzle/schema";
import * as mysqlSchema from "../drizzle/schema";
import { ENV } from "./_core/env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = any;

let _db: AnyDb = null;
let _schema: AnySchema = mysqlSchema;
let _provider = "mysql";
let _initialized = false;

async function initDb() {
  if (_initialized) return;
  _initialized = true;

  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.warn("[Database] DATABASE_URL not set, running without DB");
    return;
  }

  // Auto-detect provider from URL if not explicitly set
  const rawProvider = process.env["DATABASE_PROVIDER"];
  if (rawProvider) {
    _provider = rawProvider;
  } else if (url.startsWith("libsql://") || url.startsWith("file:") || url.endsWith(".db")) {
    _provider = "sqlite";
  } else {
    _provider = "mysql";
  }

  try {
    if (_provider === "sqlite") {
      const { drizzle } = await import("drizzle-orm/libsql");
      const { createClient } = await import("@libsql/client");

      // Suporta tanto arquivo local quanto Turso (libsql://)
      const authToken = process.env["DATABASE_AUTH_TOKEN"];
      const clientOpts: { url: string; authToken?: string } = { url };
      if (authToken) {
        clientOpts.authToken = authToken;
      }

      const client = createClient(clientOpts);
      _db = drizzle(client);
      _schema = await import("../drizzle/schema.sqlite");
    } else {
      const { drizzle } = await import("drizzle-orm/mysql2");
      _db = drizzle(url);
      _schema = mysqlSchema;
    }
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    _db = null;
  }
}

export async function getDb(): Promise<AnyDb> {
  await initDb();
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const { users } = _schema;

  try {
    const values: Record<string, unknown> = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    // Access InsertUser fields via bracket notation (noPropertyAccessFromIndexSignature)
    const nameVal = user["name"];
    const emailVal = user["email"];
    const loginMethodVal = user["loginMethod"];
    const lastSignedInVal = user["lastSignedIn"];
    const roleVal = user["role"];

    if (nameVal !== undefined) {
      values["name"] = nameVal ?? null;
      updateSet["name"] = nameVal ?? null;
    }
    if (emailVal !== undefined) {
      values["email"] = emailVal ?? null;
      updateSet["email"] = emailVal ?? null;
    }
    if (loginMethodVal !== undefined) {
      values["loginMethod"] = loginMethodVal ?? null;
      updateSet["loginMethod"] = loginMethodVal ?? null;
    }
    if (lastSignedInVal !== undefined) {
      values["lastSignedIn"] = lastSignedInVal;
      updateSet["lastSignedIn"] = lastSignedInVal;
    }
    if (roleVal !== undefined) {
      values["role"] = roleVal;
      updateSet["role"] = roleVal;
    } else if (user.openId === ENV.ownerOpenId) {
      values["role"] = "admin";
      updateSet["role"] = "admin";
    }

    if (!values["lastSignedIn"]) {
      values["lastSignedIn"] = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet["lastSignedIn"] = new Date();
    }

    if (_provider === "sqlite") {
      await db
        .insert(users)
        .values(values)
        .onConflictDoUpdate({ target: users.openId, set: updateSet });
    } else {
      await db.insert(users).values(values).onDuplicateKeyUpdate({
        set: updateSet,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(
  openId: string,
): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const { users } = _schema;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? (result[0] as User) : undefined;
}

export async function getOrCreateSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = _schema;
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(subscriptions).values({
    userId,
    plan: "free",
    scansPerMonth: 5,
    scansUsedThisMonth: 0,
  });

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return result[0];
}

export async function updateSubscription(
  userId: number,
  updates: Record<string, unknown>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = _schema;
  await db
    .update(subscriptions)
    .set(updates)
    .where(eq(subscriptions.userId, userId));
}

export async function resetMonthlyScans(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[DB] Database not available — skipping monthly reset");
    return;
  }

  const { subscriptions } = _schema;
  await db.update(subscriptions).set({ scansUsedThisMonth: 0 });
  console.log("[DB] Monthly scan counters reset");
}

export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = _schema;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementScansUsed(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { subscriptions } = _schema;
  await db
    .update(subscriptions)
    .set({
      scansUsedThisMonth: sql`${subscriptions.scansUsedThisMonth} + 1`,
    })
    .where(eq(subscriptions.userId, userId));
}

export async function createAudit(
  userId: number,
  url: string,
  domain: string,
): Promise<{ insertId: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits } = _schema;

  if (_provider === "sqlite") {
    const rows = await db
      .insert(audits)
      .values({ userId, url, domain, status: "pending" })
      .returning({ id: audits.id });
    return { insertId: rows[0].id };
  }

  const result = await db
    .insert(audits)
    .values({ userId, url, domain, status: "pending" });
  return result as { insertId: number };
}

export async function getAuditById(
  auditId: number,
): Promise<Audit | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits } = _schema;
  const result = await db
    .select()
    .from(audits)
    .where(eq(audits.id, auditId))
    .limit(1);
  return result[0] as Audit | undefined;
}

export async function getUserAudits(
  userId: number,
  limit = 20,
  offset = 0,
): Promise<Audit[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits } = _schema;
  return db
    .select()
    .from(audits)
    .where(eq(audits.userId, userId))
    .orderBy(desc(audits.createdAt))
    .limit(limit)
    .offset(offset) as Promise<Audit[]>;
}

export async function updateAudit(
  auditId: number,
  updates: Record<string, unknown>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits } = _schema;
  await db.update(audits).set(updates).where(eq(audits.id, auditId));
}

export async function createViolation(
  auditId: number,
  violation: Omit<Violation, "id" | "auditId" | "createdAt">,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { violations } = _schema;
  return db.insert(violations).values({ ...violation, auditId });
}

export async function getAuditViolations(
  auditId: number,
): Promise<Violation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { violations } = _schema;
  return db
    .select()
    .from(violations)
    .where(eq(violations.auditId, auditId))
    .orderBy(violations.severity) as Promise<Violation[]>;
}

// ── LGPD: Exclusao de dados do titular ──────────────────────────────

/**
 * Exclui uma auditoria especifica e todas as suas violacoes associadas.
 * Atende ao direito de exclusao (Art. 18, LGPD).
 */
export async function deleteAudit(
  auditId: number,
  userId: number,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits, violations, reports } = _schema;

  // Verifica se a auditoria pertence ao usuario
  const audit = await db
    .select()
    .from(audits)
    .where(and(eq(audits.id, auditId), eq(audits.userId, userId)))
    .limit(1);

  if (audit.length === 0) {
    throw new Error("Auditoria nao encontrada ou sem permissao");
  }

  // Remove violacoes associadas
  await db.delete(violations).where(eq(violations.auditId, auditId));

  // Remove relatorios associados
  await db.delete(reports).where(eq(reports.auditId, auditId));

  // Remove a auditoria
  await db.delete(audits).where(eq(audits.id, auditId));

  console.log(
    `[LGPD] Auditoria ${auditId} excluida por usuario ${userId}`,
  );
}

/**
 * Exclui TODOS os dados de um usuario (auditorias, violacoes, relatorios, assinatura).
 * Atende ao direito ao esquecimento completo (Art. 18, III, LGPD).
 */
export async function deleteUserData(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits, violations, reports, subscriptions } = _schema;

  // Busca IDs das auditorias do usuario
  const userAudits = await db
    .select({ id: audits.id })
    .from(audits)
    .where(eq(audits.userId, userId));

  const auditIds = userAudits.map(
    (row: { id: number }) => row.id,
  );

  // Remove violacoes de todas as auditorias
  for (const auditId of auditIds) {
    await db.delete(violations).where(eq(violations.auditId, auditId));
    await db.delete(reports).where(eq(reports.auditId, auditId));
  }

  // Remove auditorias
  await db.delete(audits).where(eq(audits.userId, userId));

  // Remove assinatura
  await db.delete(subscriptions).where(eq(subscriptions.userId, userId));

  console.log(
    `[LGPD] Todos os dados do usuario ${userId} foram excluidos (esquecimento completo)`,
  );
}

/**
 * Exclui auditorias completadas com mais de N dias.
 * Executado automaticamente pelo job de retencao (Vercel Cron ou node-cron).
 */
export async function deleteOldAudits(
  daysOld: number = 90,
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { audits, violations, reports } = _schema;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  // Busca auditorias antigas completadas
  const oldAudits = await db
    .select({ id: audits.id })
    .from(audits)
    .where(and(eq(audits.status, "completed"), lt(audits.createdAt, cutoff)));

  let deleted = 0;
  for (const audit of oldAudits) {
    await db.delete(violations).where(eq(violations.auditId, audit.id));
    await db.delete(reports).where(eq(reports.auditId, audit.id));
    await db.delete(audits).where(eq(audits.id, audit.id));
    deleted++;
  }

  if (deleted > 0) {
    console.log(
      `[LGPD] Retencao: ${deleted} auditorias com mais de ${daysOld} dias excluidas`,
    );
  }

  return deleted;
}

'@ | Set-Content -Encoding UTF8 -Path 'server/db.ts' -NoNewline
Write-Host '  ✅ server/db.ts' -ForegroundColor Green

# --- shared/package.json ---
New-Item -ItemType Directory -Force -Path 'shared' | Out-Null
@'
{
  "name": "@shared",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./*": "./*.ts"
  }
}

'@ | Set-Content -Encoding UTF8 -Path 'shared/package.json' -NoNewline
Write-Host '  ✅ shared/package.json' -ForegroundColor Green

# --- tsconfig.server.json ---
@'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "moduleResolution": "node16",
    "module": "node16",
    "allowImportingTsExtensions": false,
    "noEmit": false,
    "outDir": ".vercel/output/functions"
  },
  "include": ["api/**/*.ts", "server/**/*.ts", "shared/**/*.ts", "drizzle/**/*.ts"]
}

'@ | Set-Content -Encoding UTF8 -Path 'tsconfig.server.json' -NoNewline
Write-Host '  ✅ tsconfig.server.json' -ForegroundColor Green

# --- vercel.json ---
@'
{
  "version": 2,
  "buildCommand": "pnpm install && vite build",
  "installCommand": "pnpm install",
  "framework": null,
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@5.0.0",
      "includeFiles": "shared/**,drizzle/**,server/**"
    }
  },
  "rewrites": [
    { "source": "/api/trpc/:path*", "destination": "/api/trpc/[trpc]" },
    { "source": "/api/auth/:path*", "destination": "/api/auth/[auth]" },
    { "source": "/api/oauth/:path*", "destination": "/api/oauth/[oauth]" },
    { "source": "/api/stripe/:path*", "destination": "/api/stripe/[stripe]" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}

'@ | Set-Content -Encoding UTF8 -Path 'vercel.json' -NoNewline
Write-Host '  ✅ vercel.json' -ForegroundColor Green

# Commit e push
git add -A
git commit -m "fix: corrigir FUNCTION_INVOCATION_FAILED no Vercel`n`nTres bugs corrigidos:`n1. [trpc].ts restaurado do handler de diagnostico para o real`n2. includeFiles + workspace pnpm para bundlar shared/ e server/`n3. auto-deteccao DATABASE_PROVIDER (libsql -> sqlite)"
git push -u origin $branch

Write-Host '' 
Write-Host '✅ Push concluído! Abra o PR em:' -ForegroundColor Green
Write-Host 'https://github.com/guilherme-machado-ceo/hubstry-compliance-app/compare/main...' + $branch + '?expand=1' -ForegroundColor Yellow