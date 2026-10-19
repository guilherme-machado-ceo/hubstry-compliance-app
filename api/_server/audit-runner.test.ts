import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  runAudit,
  SCAN_DEADLINE_MS,
  STALE_PENDING_MS,
  TIMEOUT_MESSAGE,
  type AuditRunnerDeps,
} from "./audit-runner.js";
import type { ScanResult } from "./scanner.js";
import { config as trpcConfig } from "../trpc/[trpc].js";
import { DEFAULT_TIMEOUT_MS } from "./safe-fetch.js";

// Banco e scanner simulados: nenhum teste toca rede nem banco real.

const PARAMS = { auditId: 42, userId: 7, url: "https://example.com/" };

const SCAN: ScanResult = {
  complianceScore: 85,
  summary: { critical: 0, warning: 1, info: 1 },
  violations: [
    {
      type: "autoplay",
      severity: "warning",
      title: "t1",
      description: "d1",
      recommendation: "r1",
      elementSelector: "video[autoplay]",
    },
    { type: "other", severity: "info", title: "t2", description: "d2", recommendation: "r2" },
  ],
};

type MockDeps = { [K in keyof AuditRunnerDeps]: AuditRunnerDeps[K] & Mock };

function makeDeps(overrides: Partial<Record<keyof AuditRunnerDeps, Mock>> = {}): MockDeps {
  return {
    scanUrl: vi.fn().mockResolvedValue(SCAN),
    createViolation: vi.fn().mockResolvedValue(undefined),
    updateAudit: vi.fn().mockResolvedValue(undefined),
    incrementScansUsed: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as MockDeps;
}

const statusesWritten = (deps: MockDeps) =>
  deps.updateAudit.mock.calls.map((c) => (c[1] as { status: string }).status);

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
  vi.useRealTimers();
});

describe("runAudit — conclusão", () => {
  it("grava violações e o resultado antes de retornar, e conta o scan", async () => {
    const deps = makeDeps();
    const outcome = await runAudit(PARAMS, deps);

    expect(outcome).toBe("completed");
    expect(deps.scanUrl).toHaveBeenCalledWith(PARAMS.url);
    expect(deps.createViolation).toHaveBeenCalledTimes(2);
    expect(deps.createViolation.mock.calls[0]).toEqual([
      42,
      expect.objectContaining({ type: "autoplay", elementSelector: "video[autoplay]", lineNumber: null }),
    ]);
    expect(deps.createViolation.mock.calls[1][1]).toMatchObject({ elementSelector: null });
    expect(deps.updateAudit).toHaveBeenCalledWith(42, {
      status: "completed",
      complianceScore: 85,
      totalViolations: 2,
      criticalViolations: 0,
      warningViolations: 1,
      infoViolations: 1,
    });
    expect(deps.incrementScansUsed).toHaveBeenCalledWith(7);
  });

  it("falha ao contar o scan não desfaz o resultado concluído", async () => {
    const deps = makeDeps({ incrementScansUsed: vi.fn().mockRejectedValue(new Error("db")) });
    await expect(runAudit(PARAMS, deps)).resolves.toBe("completed");
    expect(statusesWritten(deps)).toEqual(["completed"]);
  });
});

describe("runAudit — falha", () => {
  it("erro do scan vira `failed` com a mensagem, sem contar o scan", async () => {
    const deps = makeDeps({
      scanUrl: vi.fn().mockRejectedValue(new Error("URL aponta para endereco nao permitido")),
    });
    await expect(runAudit(PARAMS, deps)).resolves.toBe("failed");
    expect(deps.updateAudit).toHaveBeenCalledWith(42, {
      status: "failed",
      errorMessage: "URL aponta para endereco nao permitido",
    });
    expect(deps.createViolation).not.toHaveBeenCalled();
    expect(deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("erro ao gravar uma violação vira `failed`", async () => {
    const deps = makeDeps({ createViolation: vi.fn().mockRejectedValue(new Error("insert falhou")) });
    await expect(runAudit(PARAMS, deps)).resolves.toBe("failed");
    expect(statusesWritten(deps)).toEqual(["failed"]);
    expect(deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("erro ao gravar o resultado final vira `failed`", async () => {
    const updateAudit = vi
      .fn()
      .mockRejectedValueOnce(new Error("update falhou"))
      .mockResolvedValue(undefined);
    const deps = makeDeps({ updateAudit });
    await expect(runAudit(PARAMS, deps)).resolves.toBe("failed");
    expect(statusesWritten(deps)).toEqual(["completed", "failed"]);
  });

  it("se nem `failed` puder ser gravado, não lança e registra o erro", async () => {
    const deps = makeDeps({
      scanUrl: vi.fn().mockRejectedValue(new Error("scan")),
      updateAudit: vi.fn().mockRejectedValue(new Error("banco fora")),
    });
    await expect(runAudit(PARAMS, deps)).resolves.toBe("failed");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("erro que não é Error recebe mensagem genérica", async () => {
    const deps = makeDeps({ scanUrl: vi.fn().mockRejectedValue("x") });
    await runAudit(PARAMS, deps);
    expect(deps.updateAudit).toHaveBeenCalledWith(42, { status: "failed", errorMessage: "Erro desconhecido" });
  });
});

describe("runAudit — prazo", () => {
  it("scan que não termina vira `failed` por tempo e nada é gravado depois", async () => {
    vi.useFakeTimers();
    let resolveScan!: (r: ScanResult) => void;
    const deps = makeDeps({
      scanUrl: vi.fn(() => new Promise<ScanResult>((r) => (resolveScan = r))),
    });

    const pending = runAudit(PARAMS, deps, 1_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("failed");
    expect(deps.updateAudit).toHaveBeenCalledWith(42, { status: "failed", errorMessage: TIMEOUT_MESSAGE });

    // O scan termina depois do prazo: nenhuma escrita tardia.
    resolveScan(SCAN);
    await vi.runAllTimersAsync();
    expect(deps.createViolation).not.toHaveBeenCalled();
    expect(statusesWritten(deps)).toEqual(["failed"]);
    expect(deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("prazo vencido durante a gravação interrompe as escritas seguintes", async () => {
    vi.useFakeTimers();
    const createViolation = vi.fn(
      () => new Promise<undefined>((r) => setTimeout(() => r(undefined), 800)),
    );
    const deps = makeDeps({ createViolation });

    const pending = runAudit(PARAMS, deps, 1_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("failed");

    await vi.runAllTimersAsync();
    // As duas violações começaram antes do prazo (0 ms e 800 ms); o `completed`, não.
    expect(createViolation).toHaveBeenCalledTimes(2);
    expect(statusesWritten(deps)).toEqual(["failed"]);
    expect(deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("scan dentro do prazo conclui normalmente", async () => {
    vi.useFakeTimers();
    const deps = makeDeps({
      scanUrl: vi.fn(() => new Promise<ScanResult>((r) => setTimeout(() => r(SCAN), 900))),
    });
    const pending = runAudit(PARAMS, deps, 1_000);
    await vi.advanceTimersByTimeAsync(900);
    await expect(pending).resolves.toBe("completed");
    await vi.runAllTimersAsync();
    expect(statusesWritten(deps)).toEqual(["completed"]);
  });
});

describe("orçamento de tempo na Vercel", () => {
  it("prazo do scan cabe no maxDuration da função tRPC, com folga", () => {
    const maxMs = trpcConfig.maxDuration * 1000;
    // Hobby: 60 s no modo antigo; 300 s com Fluid compute. 60 s vale nos dois.
    expect(trpcConfig.maxDuration).toBeLessThanOrEqual(60);
    // Busca da página está dentro do prazo do scan.
    expect(DEFAULT_TIMEOUT_MS).toBeLessThan(SCAN_DEADLINE_MS);
    // Folga de pelo menos 5 s para autenticação, criação e partida a frio.
    expect(SCAN_DEADLINE_MS + 5_000).toBeLessThanOrEqual(maxMs);
  });

  it("pending só é considerado abandonado depois do maxDuration", () => {
    expect(STALE_PENDING_MS).toBeGreaterThan(trpcConfig.maxDuration * 1000);
  });
});
