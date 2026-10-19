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
  incrementScansUsed: vi.fn(),
  failStalePendingAudits: vi.fn(),
}));
vi.mock("./scanner.js", () => ({ scanUrl: vi.fn() }));

import * as db from "./db.js";
import { scanUrl } from "./scanner.js";
import { appRouter } from "./routers.js";
import {
  BETA_CHECKOUT_MESSAGE,
  BETA_GRATUITO,
  BETA_SCANS_PER_MONTH,
  effectiveScansPerMonth,
} from "../_shared/beta.js";
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
  vi.mocked(scanUrl).mockResolvedValue({
    complianceScore: 100,
    summary: { critical: 0, warning: 0, info: 0 },
    violations: [],
  });
});

describe("fase de beta gratuito (ADR-0012)", () => {
  it("está ativa", () => {
    expect(BETA_GRATUITO).toBe(true);
  });

  it("cota do beta é generosa, mas finita", () => {
    expect(BETA_SCANS_PER_MONTH).toBeGreaterThan(5);
    expect(BETA_SCANS_PER_MONTH).toBeLessThan(500);
    expect(Number.isFinite(BETA_SCANS_PER_MONTH)).toBe(true);
  });

  it("aplica a cota do beta só ao plano gratuito, sem reduzir cotas maiores", () => {
    expect(effectiveScansPerMonth("free", 5)).toBe(BETA_SCANS_PER_MONTH);
    expect(effectiveScansPerMonth("free", 1000)).toBe(1000);
    expect(effectiveScansPerMonth("free", -1)).toBe(-1);
    expect(effectiveScansPerMonth("pro", 500)).toBe(500);
    expect(effectiveScansPerMonth("enterprise", -1)).toBe(-1);
  });
});

describe("checkout desabilitado no servidor", () => {
  it.each(["PRO", "ENTERPRISE"] as const)("createCheckout(%s) é recusado sem chamar o Stripe", async (plan) => {
    await expect(caller().stripe.createCheckout({ plan })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: BETA_CHECKOUT_MESSAGE,
    });
    expect(checkoutCreate).not.toHaveBeenCalled();
  });
});

describe("cota efetiva nas leituras e no limite", () => {
  it("subscription.get e stripe.getSubscription devolvem a cota do beta", async () => {
    vi.mocked(db.getOrCreateSubscription).mockResolvedValue(freeRow(0) as never);
    await expect(caller().subscription.get()).resolves.toMatchObject({ scansPerMonth: BETA_SCANS_PER_MONTH });
    await expect(caller().stripe.getSubscription()).resolves.toMatchObject({
      scansPerMonth: BETA_SCANS_PER_MONTH,
    });
  });

  it("audits.create permite passar do antigo limite de 5", async () => {
    vi.mocked(db.getOrCreateSubscription).mockResolvedValue(freeRow(5) as never);
    vi.mocked(db.createAudit).mockResolvedValue({ insertId: 1 });
    await caller().audits.create({ url: "https://example.com/" });
    expect(db.createAudit).toHaveBeenCalled();
  });

  it("audits.create bloqueia ao atingir a cota do beta", async () => {
    vi.mocked(db.getOrCreateSubscription).mockResolvedValue(freeRow(BETA_SCANS_PER_MONTH) as never);
    await expect(caller().audits.create({ url: "https://example.com/" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(db.createAudit).not.toHaveBeenCalled();
  });
});
