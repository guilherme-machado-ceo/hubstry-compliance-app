import { beforeEach, describe, expect, it, vi } from "vitest";

// Stripe, banco e scanner simulados: nenhum teste toca rede, Stripe ou banco real.
const { checkoutCreate } = vi.hoisted(() => ({ checkoutCreate: vi.fn() }));
vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: { sessions: { create: checkoutCreate } },
    invoices: { list: vi.fn() },
  })),
}));
vi.mock("./db.js", () => ({
  getOrCreateSubscription: vi.fn(),
  createAudit: vi.fn(),
  createViolation: vi.fn(),
  updateAudit: vi.fn(),
  countQuotaAudits: vi.fn(),
  failStalePendingAudits: vi.fn(),
  // Usadas pelo audit-runner do PR #26; incluídas para a suíte funcionar
  // também depois da integração dos dois PRs.
  updateAuditIfPending: vi.fn(),
  deleteAuditViolations: vi.fn(),
  getAuditById: vi.fn(),
}));
vi.mock("./scanner.js", () => ({ scanUrl: vi.fn() }));

import * as db from "./db.js";
import { scanUrl } from "./scanner.js";
import { appRouter } from "./routers.js";
import {
  CHECKOUT_DESATIVADO_MENSAGEM,
  COBRANCA_CONGELADA,
  COTA_MENSAL_GRATUITA,
  effectiveScansPerMonth,
} from "../_shared/gratuito.js";
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
  appRouter.createCaller({
    user,
    req: { headers: { host: "example.com" }, protocol: "https" },
    res: {},
  } as unknown as TrpcContext);

const freeRow = (used: number) => ({ plan: "free", scansPerMonth: 5, scansUsedThisMonth: used });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.countQuotaAudits).mockResolvedValue(0);
  vi.mocked(scanUrl).mockResolvedValue({
    complianceScore: 100,
    summary: { critical: 0, warning: 0, info: 0 },
    violations: [],
  });
});

describe("app gratuito com cobrança congelada (ADR-0012)", () => {
  it("cobrança está congelada", () => {
    expect(COBRANCA_CONGELADA).toBe(true);
  });

  it("cota gratuita é generosa, mas finita", () => {
    expect(COTA_MENSAL_GRATUITA).toBeGreaterThan(5);
    expect(COTA_MENSAL_GRATUITA).toBeLessThan(500);
    expect(Number.isFinite(COTA_MENSAL_GRATUITA)).toBe(true);
  });

  it("toda conta gratuita tem exatamente a cota gratuita finita, qualquer que seja o valor no banco", () => {
    for (const stored of [5, 0, 1000, -1]) {
      expect(effectiveScansPerMonth("free", stored), `armazenado ${stored}`).toBe(COTA_MENSAL_GRATUITA);
    }
  });

  it("planos pagos já contratados mantêm a própria cota", () => {
    expect(effectiveScansPerMonth("pro", 500)).toBe(500);
    expect(effectiveScansPerMonth("enterprise", -1)).toBe(-1);
  });
});

describe("checkout desabilitado no servidor", () => {
  it.each(["PRO", "ENTERPRISE"] as const)("createCheckout(%s) é recusado sem chamar o Stripe", async (plan) => {
    await expect(caller().stripe.createCheckout({ plan })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: CHECKOUT_DESATIVADO_MENSAGEM,
    });
    expect(checkoutCreate).not.toHaveBeenCalled();
  });
});

describe("cota efetiva nas leituras e no limite", () => {
  it("subscription.get e stripe.getSubscription devolvem a cota gratuita", async () => {
    vi.mocked(db.getOrCreateSubscription).mockResolvedValue(freeRow(0) as never);
    vi.mocked(db.countQuotaAudits).mockResolvedValue(0);
    await expect(caller().subscription.get()).resolves.toMatchObject({ scansPerMonth: COTA_MENSAL_GRATUITA });
    await expect(caller().stripe.getSubscription()).resolves.toMatchObject({
      scansPerMonth: COTA_MENSAL_GRATUITA,
    });
  });

  it("audits.create permite passar do antigo limite de 5", async () => {
    vi.mocked(db.getOrCreateSubscription).mockResolvedValue(freeRow(5) as never);
    vi.mocked(db.countQuotaAudits).mockResolvedValue(5);
    vi.mocked(db.createAudit).mockResolvedValue({ insertId: 1 });
    await caller().audits.create({ url: "https://example.com/" });
    expect(db.createAudit).toHaveBeenCalled();
  });

  it("conta gratuita com -1 (ilimitado) no banco é limitada à cota gratuita", async () => {
    vi.mocked(db.getOrCreateSubscription).mockResolvedValue({
      plan: "free",
      scansPerMonth: -1,
      scansUsedThisMonth: 0,
    } as never);
    vi.mocked(db.countQuotaAudits).mockResolvedValue(COTA_MENSAL_GRATUITA);
    await expect(caller().subscription.get()).resolves.toMatchObject({ scansPerMonth: COTA_MENSAL_GRATUITA });
    await expect(caller().audits.create({ url: "https://example.com/" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(db.createAudit).not.toHaveBeenCalled();
  });

  it("audits.create bloqueia ao atingir a cota gratuita", async () => {
    vi.mocked(db.getOrCreateSubscription).mockResolvedValue(freeRow(COTA_MENSAL_GRATUITA) as never);
    vi.mocked(db.countQuotaAudits).mockResolvedValue(COTA_MENSAL_GRATUITA);
    await expect(caller().audits.create({ url: "https://example.com/" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(db.createAudit).not.toHaveBeenCalled();
  });
});
