import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Transições de estado da auditoria contra um SQLite EM MEMÓRIA: banco
 * efêmero, local, sem rede e sem dados reais. Valida o SQL condicional de
 * verdade, o que um mock da camada Drizzle não faria.
 */

type DbModule = typeof import("./db.js");
let db: DbModule;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any;

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", "file::memory:");
  vi.stubEnv("DATABASE_PROVIDER", "sqlite");
  vi.resetModules();
  db = await import("./db.js");
  conn = await db.getDb();
  await conn.run(`CREATE TABLE audits (id INTEGER PRIMARY KEY, userId INTEGER NOT NULL, url TEXT NOT NULL,
    domain TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', complianceScore INTEGER, errorMessage TEXT,
    createdAt INTEGER NOT NULL DEFAULT 0, updatedAt INTEGER NOT NULL DEFAULT 0)`);
  await conn.run(`CREATE TABLE violations (id INTEGER PRIMARY KEY AUTOINCREMENT, auditId INTEGER NOT NULL,
    type TEXT NOT NULL, severity TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
    recommendation TEXT NOT NULL)`);
});

beforeEach(async () => {
  await conn.run("DELETE FROM audits");
  await conn.run("DELETE FROM violations");
  await conn.run(`INSERT INTO audits (id, userId, url, domain) VALUES (1, 7, 'https://x', 'x')`);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const status = async () => (await conn.all("SELECT status FROM audits WHERE id = 1"))[0].status;

describe("updateAuditIfPending", () => {
  it("aplica a partir de `pending`", async () => {
    await db.updateAuditIfPending(1, { status: "completed", complianceScore: 90 });
    expect(await status()).toBe("completed");
  });

  it("`completed` tardio não sobrescreve `failed`", async () => {
    await db.updateAuditIfPending(1, { status: "failed", errorMessage: "tempo" });
    await db.updateAuditIfPending(1, { status: "completed", complianceScore: 90 });
    const row = (await conn.all("SELECT status, complianceScore, errorMessage FROM audits WHERE id = 1"))[0];
    expect(row).toMatchObject({ status: "failed", complianceScore: null, errorMessage: "tempo" });
  });

  it("`failed` tardio não sobrescreve `completed`", async () => {
    await db.updateAuditIfPending(1, { status: "completed", complianceScore: 90 });
    await db.updateAuditIfPending(1, { status: "failed", errorMessage: "tempo" });
    expect(await status()).toBe("completed");
  });
});

describe("deleteAuditViolations", () => {
  it("remove só os achados da auditoria indicada", async () => {
    for (const auditId of [1, 1, 2]) {
      await conn.run(`INSERT INTO violations (auditId, type, severity, title, description, recommendation)
        VALUES (${auditId}, 'other', 'info', 't', 'd', 'r')`);
    }
    await db.deleteAuditViolations(1);
    const rows = await conn.all("SELECT auditId FROM violations");
    expect(rows.map((r: { auditId: number }) => r.auditId)).toEqual([2]);
  });
});
