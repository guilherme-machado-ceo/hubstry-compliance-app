import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Exclusão de conta (art. 18 da LGPD) contra um SQLite EM MEMÓRIA: banco
 * efêmero, local, sem rede e sem dados reais. Valida o SQL de verdade, o que
 * um mock da camada Drizzle não faria.
 */

type DbModule = typeof import("./db.js");
let db: DbModule;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any;

const TABLES = `
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, openId TEXT NOT NULL UNIQUE, name TEXT, email TEXT,
  loginMethod TEXT, role TEXT NOT NULL DEFAULT 'user', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL,
  lastSignedIn INTEGER NOT NULL);
CREATE TABLE subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, plan TEXT NOT NULL DEFAULT 'free',
  scansPerMonth INTEGER NOT NULL DEFAULT 5, scansUsedThisMonth INTEGER NOT NULL DEFAULT 0);
CREATE TABLE audits (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, url TEXT NOT NULL, domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', createdAt INTEGER NOT NULL DEFAULT 0, updatedAt INTEGER NOT NULL DEFAULT 0);
CREATE TABLE violations (id INTEGER PRIMARY KEY AUTOINCREMENT, auditId INTEGER NOT NULL, type TEXT NOT NULL, severity TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT NOT NULL, recommendation TEXT NOT NULL);
CREATE TABLE reports (id INTEGER PRIMARY KEY AUTOINCREMENT, auditId INTEGER NOT NULL, userId INTEGER NOT NULL,
  format TEXT NOT NULL DEFAULT 'pdf');
`;

async function count(table: string, where: string) {
  const rows = await conn.all(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`);
  return Number(rows[0].n);
}

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", "file::memory:");
  vi.stubEnv("DATABASE_PROVIDER", "sqlite");
  vi.resetModules();
  db = await import("./db.js");
  conn = await db.getDb();
  for (const stmt of TABLES.split(";").map((s) => s.trim()).filter(Boolean)) {
    await conn.run(stmt);
  }
  const now = Date.now();
  for (const [id, openId] of [
    [1, "gh-alvo"],
    [2, "gh-outro"],
  ] as const) {
    await conn.run(
      `INSERT INTO users (id, openId, name, email, createdAt, updatedAt, lastSignedIn)
       VALUES (${id}, '${openId}', 'Nome ${id}', 'u${id}@example.com', ${now}, ${now}, ${now})`,
    );
    await conn.run(`INSERT INTO subscriptions (userId) VALUES (${id})`);
    await conn.run(`INSERT INTO audits (id, userId, url, domain) VALUES (${id * 10}, ${id}, 'https://x', 'x')`);
    await conn.run(
      `INSERT INTO violations (auditId, type, severity, title, description, recommendation)
       VALUES (${id * 10}, 'other', 'info', 't', 'd', 'r')`,
    );
    await conn.run(`INSERT INTO reports (auditId, userId) VALUES (${id * 10}, ${id})`);
  }
  // Relatório ligado ao usuário, mas a uma auditoria que não é dele.
  await conn.run(`INSERT INTO reports (auditId, userId) VALUES (20, 1)`);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("deleteUserData", () => {
  it("apaga cadastro, assinatura, auditorias, violações e relatórios do usuário", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await db.deleteUserData(1);

    expect(await count("users", "id = 1")).toBe(0);
    expect(await count("subscriptions", "userId = 1")).toBe(0);
    expect(await count("audits", "userId = 1")).toBe(0);
    expect(await count("violations", "auditId = 10")).toBe(0);
    expect(await count("reports", "userId = 1")).toBe(0);
    expect(await db.getUserByOpenId("gh-alvo")).toBeUndefined();
  });

  it("não toca nos dados de outro usuário", async () => {
    expect(await count("users", "id = 2")).toBe(1);
    expect(await count("subscriptions", "userId = 2")).toBe(1);
    expect(await count("audits", "userId = 2")).toBe(1);
    expect(await count("violations", "auditId = 20")).toBe(1);
    expect(await count("reports", "userId = 2")).toBe(1);
  });
});
