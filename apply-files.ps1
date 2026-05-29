# ============================================================
# Aplica apenas os arquivos modificados — sem mexer no git
# Execute na pasta raiz do repo ja no branch fix/vercel-serverless-crash
# ============================================================

Write-Host "📝 Aplicando arquivos do fix..." -ForegroundColor Cyan

# --- 1. api/trpc/[trpc].ts ---
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

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = await response.text();
  res.status(response.status).send(body);
}
'@ | Set-Content -Encoding UTF8 -Path "api/trpc/[trpc].ts" -NoNewline
Write-Host "  ✅ api/trpc/[trpc].ts" -ForegroundColor Green

# --- 2. vercel.json ---
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
'@ | Set-Content -Encoding UTF8 -Path "vercel.json" -NoNewline
Write-Host "  ✅ vercel.json" -ForegroundColor Green

# --- 3. pnpm-workspace.yaml ---
@'
packages:
  - 'shared'
'@ | Set-Content -Encoding UTF8 -Path "pnpm-workspace.yaml" -NoNewline
Write-Host "  ✅ pnpm-workspace.yaml" -ForegroundColor Green

# --- 4. shared/package.json ---
@'
{
  "name": "@shared",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./*": "./*.ts"
  }
}
'@ | Set-Content -Encoding UTF8 -Path "shared/package.json" -NoNewline
Write-Host "  ✅ shared/package.json" -ForegroundColor Green

# --- 5. tsconfig.server.json ---
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
'@ | Set-Content -Encoding UTF8 -Path "tsconfig.server.json" -NoNewline
Write-Host "  ✅ tsconfig.server.json" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Todos os arquivos aplicados!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora rode:" -ForegroundColor Cyan
Write-Host "  git add -A" -ForegroundColor White
Write-Host "  git commit -m 'fix: aplicar correcoes Vercel crash'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
