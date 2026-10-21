import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cota mensal contada a partir das próprias auditorias (quota.ts), testada com
 * o router e o db REAIS contra um SQLite em ARQUIVO TEMPORÁRIO: banco efêmero,
 * local, sem rede e sem dados reais, apagado ao final. As tabelas são geradas
 * do schema real (drizzle/schema.sqlite.ts). Só o scanner é simulado.
 */

vi.mock("./scanner.js", () => ({ scanUrl: vi.fn() }));

import { scanUrl } from "./scanner.js";
import { appRouter } from "./routers.js";
import { COTA_MENSAL_GRATUITA } from "../_shared/gratuito.js";
import { inicioDoMesUtc } from "./quota.js";
import type { TrpcContext } from "./_core/context.js";
import * as schema from "../../drizzle/schema.sqlite.js";

const tmpDir = mkdtempSync(join(tmpdir(), "hubstry-quota-"));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any;

const SCAN_OK = {
  complianceScore: 90,
  summary: { critical: 0, warning: 1, info: 0 },
  violations: [{ type: "autoplay", severity: "warning" as const, title: "t", description: "d", recommendation: "r" }],
};

const userCtx = (id: number) =>
  ({
    user: {
      id,
      openId: `gh-${id}`,
      email: `u${id}@example.com`,
      name: `U${id}`,
      loginMethod: "github",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { headers: {} },
    res: {},
  }) as unknown as TrpcContext;

const caller = (id = 7) => appRouter.createCaller(userCtx(id));
const usados = async (id = 7) => (await caller(id).subscription.get()).scansUsedThisMonth;

/** Insere auditoria diretamente (createdAt em segundos, como no schema). */
async function inserirAuditoria(userId: number, status: string, createdAt: Date) {
  const s = Math.floor(createdAt.getTime() / 1000);
  await conn.run(
    `INSERT INTO audits (userId, url, domain, status, createdAt, updatedAt)
     VALUES (${userId}, 'https://x', 'x', '${status}', ${s}, ${s})`,
  );
}

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", `file:${join(tmpDir, "teste.db")}`);
  vi.stubEnv("DATABASE_PROVIDER", "sqlite");
  const db = await import("./db.js");
  conn = await db.getDb();
  const require = createRequire(import.meta.url);
  const api = require("drizzle-kit/api");
  const ddl: string[] = await api.generateSQLiteMigration(
    await api.generateSQLiteDrizzleJson({}),
    await api.generateSQLiteDrizzleJson(schema),
  );
  for (const stmt of ddl) await conn.run(stmt);
  const now = Math.floor(Date.now() / 1000);
  for (const id of [7, 8]) {
    await conn.run(
      `INSERT INTO users (id, openId, name, email, role, createdAt, updatedAt, lastSignedIn)
       VALUES (${id}, 'gh-${id}', 'U${id}', 'u${id}@example.com', 'user', ${now}, ${now}, ${now})`,
    );
  }
});

beforeEach(async () => {
  await conn.run("DELETE FROM violations");
  await conn.run("DELETE FROM audits");
  await conn.run("DELETE FROM subscriptions");
  vi.mocked(scanUrl).mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  vi.unstubAllEnvs();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("cota contada pelas auditorias do mês", () => {
  it("análise concluída conta; falha não conta", async () => {
    vi.mocked(scanUrl).mockResolvedValueOnce(SCAN_OK);
    await expect(caller().audits.create({ url: "https://a.example/" })).resolves.toMatchObject({ status: "completed" });
    vi.mocked(scanUrl).mockRejectedValueOnce(new Error("URL aponta para endereco nao permitido"));
    await expect(caller().audits.create({ url: "https://b.example/" })).resolves.toMatchObject({ status: "failed" });

    expect(await usados()).toBe(1);
  });

  it("tempo esgotado na busca vira `failed` e não consome cota", async () => {
    vi.mocked(scanUrl).mockRejectedValueOnce(new Error("Tempo limite excedido ao buscar a pagina"));
    await expect(caller().audits.create({ url: "https://lento.example/" })).resolves.toMatchObject({ status: "failed" });
    expect(await usados()).toBe(0);
  });

  it("repetição: tentar de novo após falhas conta só a tentativa concluída", async () => {
    vi.mocked(scanUrl)
      .mockRejectedValueOnce(new Error("falha 1"))
      .mockRejectedValueOnce(new Error("falha 2"))
      .mockResolvedValueOnce(SCAN_OK);
    for (let i = 0; i < 3; i++) await caller().audits.create({ url: "https://a.example/" });

    expect(await usados()).toBe(1);
    // Ler o uso várias vezes não altera nada (não há efeito colateral).
    expect(await usados()).toBe(1);
  });

  it("falha parcial: auditoria concluída cuja resposta se perdeu continua contando", async () => {
    // Estado que um processo interrompido depois do `completed` deixaria.
    await inserirAuditoria(7, "completed", new Date());
    expect(await usados()).toBe(1);
  });

  it("o contador antigo da assinatura é ignorado (não diverge da realidade)", async () => {
    await caller().subscription.get(); // cria a assinatura
    await conn.run("UPDATE subscriptions SET scansUsedThisMonth = 29 WHERE userId = 7");
    await inserirAuditoria(7, "completed", new Date());
    expect(await usados()).toBe(1);

    await conn.run("UPDATE subscriptions SET scansUsedThisMonth = 0 WHERE userId = 7");
    for (let i = 0; i < COTA_MENSAL_GRATUITA; i++) await inserirAuditoria(7, "completed", new Date());
    vi.mocked(scanUrl).mockResolvedValue(SCAN_OK);
    await expect(caller().audits.create({ url: "https://a.example/" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("pendente recente reserva a vaga; pendente abandonada é fechada e liberada", async () => {
    await inserirAuditoria(7, "pending", new Date());
    expect(await usados()).toBe(1);

    await conn.run("DELETE FROM audits");
    await inserirAuditoria(7, "pending", new Date(Date.now() - 10 * 60_000));
    vi.mocked(scanUrl).mockResolvedValueOnce(SCAN_OK);
    await caller().audits.create({ url: "https://a.example/" });
    // A pendente de 10 min virou `failed`; só a nova concluída conta.
    expect(await usados()).toBe(1);
    const status = (await conn.all("SELECT status FROM audits ORDER BY id")).map((r: { status: string }) => r.status);
    expect(status).toEqual(["failed", "completed"]);
  });

  it("auditorias do mês anterior não contam", async () => {
    const mesPassado = new Date(inicioDoMesUtc().getTime() - 60_000);
    await inserirAuditoria(7, "completed", mesPassado);
    await inserirAuditoria(7, "completed", new Date());
    expect(await usados()).toBe(1);
  });

  it("com a cota cheia, a requisição é recusada antes de criar auditoria ou escanear", async () => {
    for (let i = 0; i < COTA_MENSAL_GRATUITA; i++) await inserirAuditoria(7, "completed", new Date());
    await expect(caller().audits.create({ url: "https://a.example/" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(scanUrl).not.toHaveBeenCalled();
    expect((await conn.all("SELECT COUNT(*) AS n FROM audits"))[0].n).toBe(COTA_MENSAL_GRATUITA);
  });

  it("concorrência: requisições simultâneas com 1 vaga não ultrapassam o limite", async () => {
    for (let i = 0; i < COTA_MENSAL_GRATUITA - 1; i++) await inserirAuditoria(7, "completed", new Date());
    vi.mocked(scanUrl).mockResolvedValue(SCAN_OK);

    const resultados = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) => caller().audits.create({ url: `https://c${i}.example/` })),
    );

    const aceitas = resultados.filter((r) => r.status === "fulfilled");
    const recusadas = resultados.filter(
      (r) => r.status === "rejected" && (r.reason as { code?: string }).code === "TOO_MANY_REQUESTS",
    );
    expect(aceitas.length).toBeLessThanOrEqual(1);
    expect(aceitas.length + recusadas.length).toBe(5);
    expect(await usados()).toBeLessThanOrEqual(COTA_MENSAL_GRATUITA);
    // Recusada não deixa auditoria fantasma no histórico.
    expect((await conn.all("SELECT COUNT(*) AS n FROM audits"))[0].n).toBe(COTA_MENSAL_GRATUITA - 1 + aceitas.length);
  });

  it("auditorias de outro usuário não contam", async () => {
    await inserirAuditoria(8, "completed", new Date());
    expect(await usados(7)).toBe(0);
    expect(await usados(8)).toBe(1);
  });
});

describe("inicioDoMesUtc", () => {
  it("devolve o dia 1º às 00:00 UTC", () => {
    expect(inicioDoMesUtc(new Date("2026-10-19T14:00:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(inicioDoMesUtc(new Date("2026-01-01T00:00:00Z")).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
