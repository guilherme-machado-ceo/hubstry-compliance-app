import { beforeEach, describe, expect, it, vi } from "vitest";

// Banco e scanner simulados: nenhum teste toca rede nem banco real.
vi.mock("./db.js", () => ({
  getOrCreateSubscription: vi.fn(),
  createAudit: vi.fn(),
  createViolation: vi.fn(),
  updateAuditIfPending: vi.fn(),
  deleteAuditViolations: vi.fn(),
  incrementScansUsed: vi.fn(),
  failStalePendingAudits: vi.fn(),
  getUserAudits: vi.fn(),
  getAuditById: vi.fn(),
  getAuditViolations: vi.fn(),
}));
vi.mock("./scanner.js", () => ({ scanUrl: vi.fn() }));

import * as db from "./db.js";
import { scanUrl } from "./scanner.js";
import { appRouter } from "./routers.js";
import { STALE_MESSAGE, STALE_PENDING_MS } from "./audit-runner.js";
import type { TrpcContext } from "./_core/context.js";

const user = {
  id: 7,
  openId: "u",
  email: "u@example.com",
  name: "U",
  loginMethod: "github",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
} as NonNullable<TrpcContext["user"]>;

const caller = () =>
  appRouter.createCaller({ user, req: { headers: {} }, res: {} } as unknown as TrpcContext);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.getOrCreateSubscription).mockResolvedValue({
    scansPerMonth: 10,
    scansUsedThisMonth: 0,
  } as never);
  vi.mocked(db.createAudit).mockResolvedValue({ insertId: 42 });
});

describe("audits.create", () => {
  it("só responde depois de gravar o resultado e devolve `completed`", async () => {
    vi.mocked(scanUrl).mockResolvedValue({
      complianceScore: 100,
      summary: { critical: 0, warning: 0, info: 0 },
      violations: [],
    });

    vi.mocked(db.getAuditById).mockResolvedValue({ id: 42, userId: 7, status: "completed" } as never);

    const result = await caller().audits.create({ url: "https://example.com/" });

    expect(result).toEqual({ auditId: 42, status: "completed" });
    expect(db.updateAuditIfPending).toHaveBeenCalledWith(42, expect.objectContaining({ status: "completed" }));
    expect(db.incrementScansUsed).toHaveBeenCalledWith(7);
  });

  it("falha do scan devolve `failed` já gravado, nunca `pending`", async () => {
    vi.mocked(scanUrl).mockRejectedValue(new Error("Tempo limite excedido ao buscar a pagina"));
    vi.mocked(db.getAuditById).mockResolvedValue({ id: 42, userId: 7, status: "failed" } as never);

    const result = await caller().audits.create({ url: "https://example.com/" });

    expect(result).toEqual({ auditId: 42, status: "failed" });
    expect(db.updateAuditIfPending).toHaveBeenCalledWith(42, {
      status: "failed",
      errorMessage: "Tempo limite excedido ao buscar a pagina",
    });
  });

  it("sem id da auditoria criada, responde erro e não escaneia", async () => {
    vi.mocked(db.createAudit).mockResolvedValue({} as never);
    await expect(caller().audits.create({ url: "https://example.com/" })).rejects.toThrow(
      /Não foi possível registrar a auditoria/,
    );
    expect(scanUrl).not.toHaveBeenCalled();
  });

  it("limite do plano atingido não cria auditoria", async () => {
    vi.mocked(db.getOrCreateSubscription).mockResolvedValue({
      scansPerMonth: 3,
      scansUsedThisMonth: 3,
    } as never);
    await expect(caller().audits.create({ url: "https://example.com/" })).rejects.toThrow(/Limite/);
    expect(db.createAudit).not.toHaveBeenCalled();
  });
});

describe("audits.get", () => {
  it.each(["failed", "pending"])("auditoria `%s` não expõe achados (parciais) gravados", async (status) => {
    vi.mocked(db.getAuditById).mockResolvedValue({ id: 42, userId: 7, status } as never);
    vi.mocked(db.getAuditViolations).mockResolvedValue([{ id: 1, type: "other" }] as never);

    const audit = await caller().audits.get({ id: 42 });

    expect(audit.violations).toEqual([]);
    expect(db.getAuditViolations).not.toHaveBeenCalled();
  });

  it("auditoria `completed` expõe os achados", async () => {
    vi.mocked(db.getAuditById).mockResolvedValue({ id: 42, userId: 7, status: "completed" } as never);
    vi.mocked(db.getAuditViolations).mockResolvedValue([{ id: 1, type: "other" }] as never);

    const audit = await caller().audits.get({ id: 42 });

    expect(audit.violations).toHaveLength(1);
  });
});

describe("auditorias `pending` abandonadas", () => {
  it.each([
    ["list", () => caller().audits.list()],
    ["status", () => caller().audits.status({ id: 42 })],
    ["get", () => caller().audits.get({ id: 42 })],
  ])("audits.%s fecha pendências antigas do usuário antes de ler", async (_name, call) => {
    vi.mocked(db.getUserAudits).mockResolvedValue([]);
    vi.mocked(db.getAuditById).mockResolvedValue({ id: 42, userId: 7, status: "failed" } as never);
    vi.mocked(db.getAuditViolations).mockResolvedValue([]);
    const before = Date.now();

    await call();

    expect(db.failStalePendingAudits).toHaveBeenCalledTimes(1);
    const [userId, cutoff, message] = vi.mocked(db.failStalePendingAudits).mock.calls[0];
    expect(userId).toBe(7);
    expect(message).toBe(STALE_MESSAGE);
    const age = before - (cutoff as Date).getTime();
    expect(age).toBeGreaterThanOrEqual(STALE_PENDING_MS - 50);
    expect(age).toBeLessThanOrEqual(STALE_PENDING_MS + 1_000);
  });
});
