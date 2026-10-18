import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Banco simulado: nenhum teste toca Turso/MySQL nem chama a limpeza real.
vi.mock("./db.js", () => ({
  deleteOldAudits: vi.fn(),
  resetMonthlyScans: vi.fn(),
}));

import { deleteOldAudits, resetMonthlyScans } from "./db.js";
import handler from "../cron/cleanup.js";

// Valor fabricado para o teste; nao e um segredo real.
const TEST_SECRET = "test-only-cron-secret-not-real";

function createRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

async function call(authorization?: string | string[]) {
  const res = createRes();
  const headers: Record<string, unknown> = {};
  if (authorization !== undefined) headers["authorization"] = authorization;
  await handler({ headers } as never, res as never);
  return res;
}

const noDbOperations = () => {
  expect(deleteOldAudits).not.toHaveBeenCalled();
  expect(resetMonthlyScans).not.toHaveBeenCalled();
};

let originalSecret: string | undefined;
let logSpies: Array<{ mock: { calls: unknown[][] } }>;

beforeEach(() => {
  originalSecret = process.env["CRON_SECRET"];
  process.env["CRON_SECRET"] = TEST_SECRET;
  vi.mocked(deleteOldAudits).mockReset().mockResolvedValue(0);
  vi.mocked(resetMonthlyScans).mockReset().mockResolvedValue(undefined);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-18T03:00:00Z")); // dia 18 UTC
  logSpies = [
    vi.spyOn(console, "log").mockImplementation(() => undefined),
    vi.spyOn(console, "warn").mockImplementation(() => undefined),
    vi.spyOn(console, "error").mockImplementation(() => undefined),
  ];
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env["CRON_SECRET"];
  else process.env["CRON_SECRET"] = originalSecret;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const loggedText = () =>
  logSpies.flatMap((s) => s.mock.calls.flat()).map(String).join("\n");

describe("/api/cron/cleanup — segredo ausente ou vazio (fail-closed)", () => {
  for (const [label, value] of [
    ["ausente", undefined],
    ["vazio", ""],
    ["so espacos", "   "],
  ] as const) {
    it(`CRON_SECRET ${label}: 503 e nenhuma operacao no banco`, async () => {
      if (value === undefined) delete process.env["CRON_SECRET"];
      else process.env["CRON_SECRET"] = value;

      // Mesmo com um Authorization qualquer (ou nenhum), nada executa.
      for (const auth of [undefined, "Bearer ", `Bearer ${value ?? ""}`]) {
        const res = await call(auth);
        expect(res.statusCode).toBe(503);
        expect(res.body).toEqual({ error: "Cron not configured" });
      }
      noDbOperations();
    });
  }
});

describe("/api/cron/cleanup — autenticacao", () => {
  const invalid: Array<[string, string | string[] | undefined]> = [
    ["ausente", undefined],
    ["vazio", ""],
    ["incorreto", "Bearer outro-valor"],
    ["sem prefixo Bearer", TEST_SECRET],
    ["esquema errado", `Basic ${TEST_SECRET}`],
    ["prefixo em minusculas", `bearer ${TEST_SECRET}`],
    ["com sufixo", `Bearer ${TEST_SECRET}x`],
    ["truncado", `Bearer ${TEST_SECRET.slice(0, -1)}`],
    ["como lista", [`Bearer ${TEST_SECRET}`]],
  ];
  for (const [label, header] of invalid) {
    it(`Authorization ${label}: 401 e nenhuma operacao no banco`, async () => {
      const res = await call(header);
      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
      noDbOperations();
    });
  }

  it("nao devolve nem registra o valor do segredo", async () => {
    const responses = [
      await call(undefined),
      await call("Bearer errado"),
      await call(`Bearer ${TEST_SECRET}`),
    ];
    delete process.env["CRON_SECRET"];
    responses.push(await call(`Bearer ${TEST_SECRET}`));
    process.env["CRON_SECRET"] = TEST_SECRET;

    for (const r of responses) {
      expect(JSON.stringify(r.body)).not.toContain(TEST_SECRET);
    }
    expect(loggedText()).not.toContain(TEST_SECRET);
  });
});

describe("/api/cron/cleanup — execucao autenticada", () => {
  it("autenticacao correta: deleteOldAudits(90) e resposta de sucesso", async () => {
    vi.mocked(deleteOldAudits).mockResolvedValue(7);

    const res = await call(`Bearer ${TEST_SECRET}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      deleted: 7,
      date: "2026-10-18T03:00:00.000Z",
    });
    expect(deleteOldAudits).toHaveBeenCalledTimes(1);
    expect(deleteOldAudits).toHaveBeenCalledWith(90);
  });

  it("outros dias (UTC): nao executa o reset mensal", async () => {
    for (const iso of [
      "2026-10-18T03:00:00Z",
      "2026-10-02T00:00:00Z",
      "2026-10-31T23:59:59Z", // ainda dia 31 em UTC
    ]) {
      vi.setSystemTime(new Date(iso));
      const res = await call(`Bearer ${TEST_SECRET}`);
      expect(res.statusCode, iso).toBe(200);
    }
    expect(deleteOldAudits).toHaveBeenCalledTimes(3);
    expect(resetMonthlyScans).not.toHaveBeenCalled();
  });

  it("primeiro dia do mes em UTC: executa resetMonthlyScans", async () => {
    for (const iso of ["2026-11-01T00:00:00Z", "2026-11-01T03:00:00Z"]) {
      vi.mocked(resetMonthlyScans).mockClear();
      vi.setSystemTime(new Date(iso));

      const res = await call(`Bearer ${TEST_SECRET}`);

      expect(res.statusCode, iso).toBe(200);
      expect(resetMonthlyScans).toHaveBeenCalledTimes(1);
    }
  });
});

describe("/api/cron/cleanup — falha do banco", () => {
  it("falha em deleteOldAudits: 500 generico, sem reset e sem detalhes internos", async () => {
    vi.setSystemTime(new Date("2026-11-01T03:00:00Z"));
    vi.mocked(deleteOldAudits).mockRejectedValue(
      new Error("libsql://segredo-interno.turso.io: auth token invalido"),
    );

    const res = await call(`Bearer ${TEST_SECRET}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Internal error" });
    expect(JSON.stringify(res.body)).not.toContain("turso");
    expect(resetMonthlyScans).not.toHaveBeenCalled();
  });

  it("falha em resetMonthlyScans no dia 1: 500", async () => {
    vi.setSystemTime(new Date("2026-11-01T03:00:00Z"));
    vi.mocked(resetMonthlyScans).mockRejectedValue(new Error("boom"));

    const res = await call(`Bearer ${TEST_SECRET}`);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Internal error" });
  });
});

describe("vercel.json — agendamento versionado", () => {
  it("agenda /api/cron/cleanup diariamente as 03:00 UTC", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const config = JSON.parse(
      readFileSync(join(here, "..", "..", "vercel.json"), "utf8"),
    ) as { crons?: Array<{ path: string; schedule: string }> };

    expect(config.crons).toEqual([
      { path: "/api/cron/cleanup", schedule: "0 3 * * *" },
    ]);
  });
});
