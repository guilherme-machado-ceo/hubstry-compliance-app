import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

/**
 * Banco FALSO em memória que reproduz a semântica de db.updateAuditIfPending:
 * a atualização só vale se a auditoria ainda estiver `pending` NO MOMENTO EM
 * QUE É APLICADA. Cada escrita pode ser atrasada para reproduzir corridas de
 * forma determinística (timers falsos). Nenhum teste toca rede ou banco real.
 */

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

interface FakeOptions {
  scan?: () => Promise<ScanResult>;
  /** Atraso (ms) antes de aplicar cada escrita de estado final. */
  delayCompleted?: number;
  delayFailed?: number;
  /** Atraso (ms) de cada inserção de achado. */
  delayViolation?: number;
  failViolationAt?: number;
  failCompletedWrite?: boolean;
  failFailedWrite?: boolean;
  failRead?: boolean;
  failIncrement?: boolean;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function makeFake(opts: FakeOptions = {}) {
  const row: Record<string, unknown> = { status: "pending" };
  const history: string[] = [];
  let violations = 0;
  let inserts = 0;

  const deps = {
    scanUrl: vi.fn(opts.scan ?? (() => Promise.resolve(SCAN))),
    createViolation: vi.fn(async () => {
      inserts++;
      if (opts.failViolationAt === inserts) throw new Error("insert falhou");
      if (opts.delayViolation) await sleep(opts.delayViolation);
      violations++;
    }),
    updateAuditIfPending: vi.fn(async (_id: number, updates: Record<string, unknown>) => {
      const target = updates["status"] as string;
      if (target === "completed" && opts.failCompletedWrite) throw new Error("update falhou");
      if (target === "failed" && opts.failFailedWrite) throw new Error("banco fora");
      const delay = target === "completed" ? opts.delayCompleted : opts.delayFailed;
      if (delay) await sleep(delay);
      if (row["status"] === "pending") {
        Object.assign(row, updates);
        history.push(`${target}:aplicado`);
        return true;
      }
      history.push(`${target}:ignorado`);
      return false;
    }),
    deleteAuditViolations: vi.fn(async () => {
      violations = 0;
    }),
    getAuditById: vi.fn(async () => {
      if (opts.failRead) throw new Error("leitura falhou");
      return { status: row["status"] as string };
    }),
    incrementScansUsed: vi.fn(async () => {
      if (opts.failIncrement) throw new Error("db");
    }),
  };

  return {
    deps: deps as unknown as AuditRunnerDeps & typeof deps,
    row,
    history,
    violations: () => violations,
  };
}

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
  vi.useRealTimers();
});

describe("runAudit — conclusão", () => {
  it("grava achados e o resultado antes de retornar, e conta o scan", async () => {
    const f = makeFake();
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("completed");

    expect(f.deps.scanUrl).toHaveBeenCalledWith(PARAMS.url);
    expect(f.deps.createViolation.mock.calls[0]).toEqual([
      42,
      expect.objectContaining({ type: "autoplay", elementSelector: "video[autoplay]", lineNumber: null }),
    ]);
    expect(f.row).toMatchObject({
      status: "completed",
      complianceScore: 85,
      totalViolations: 2,
      criticalViolations: 0,
      warningViolations: 1,
      infoViolations: 1,
    });
    expect(f.violations()).toBe(2);
    expect(f.deps.incrementScansUsed).toHaveBeenCalledWith(7);
    expect(f.deps.deleteAuditViolations).not.toHaveBeenCalled();
  });

  it("falha ao contar o scan não desfaz o resultado concluído", async () => {
    const f = makeFake({ failIncrement: true });
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("completed");
    expect(f.row["status"]).toBe("completed");
  });
});

describe("runAudit — falha", () => {
  it("erro do scan vira `failed` com a mensagem, sem contar o scan", async () => {
    const f = makeFake({ scan: () => Promise.reject(new Error("URL aponta para endereco nao permitido")) });
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("failed");
    expect(f.row).toMatchObject({ status: "failed", errorMessage: "URL aponta para endereco nao permitido" });
    expect(f.deps.createViolation).not.toHaveBeenCalled();
    expect(f.deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("erro ao gravar um achado vira `failed` e remove os achados parciais", async () => {
    const f = makeFake({ failViolationAt: 2 });
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("failed");
    expect(f.row["status"]).toBe("failed");
    expect(f.deps.deleteAuditViolations).toHaveBeenCalledWith(42);
    expect(f.violations()).toBe(0);
    expect(f.deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("erro ao gravar o resultado final vira `failed`", async () => {
    const f = makeFake({ failCompletedWrite: true });
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("failed");
    expect(f.row["status"]).toBe("failed");
    expect(f.violations()).toBe(0);
  });

  it("se nem `failed` puder ser gravado, não lança e não afirma falha (`pending`)", async () => {
    const f = makeFake({ scan: () => Promise.reject(new Error("scan")), failFailedWrite: true });
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("pending");
    expect(f.row["status"]).toBe("pending"); // fica para failStalePendingAudits
    expect(f.deps.deleteAuditViolations).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("erro que não é Error recebe mensagem genérica", async () => {
    const f = makeFake({ scan: () => Promise.reject("x") });
    await runAudit(PARAMS, f.deps);
    expect(f.row["errorMessage"]).toBe("Erro desconhecido");
  });

  it("conclusão confirmada pela própria gravação: conta a cota sem depender da leitura", async () => {
    const f = makeFake({ failRead: true });
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("completed");
    expect(f.deps.getAuditById).not.toHaveBeenCalled();
    expect(f.deps.incrementScansUsed).toHaveBeenCalledTimes(1);
  });

  it("falha confirmada pela própria gravação: limpa achados sem depender da leitura", async () => {
    const f = makeFake({ failRead: true, scan: () => Promise.reject(new Error("x")) });
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("failed");
    expect(f.deps.getAuditById).not.toHaveBeenCalled();
    expect(f.deps.deleteAuditViolations).toHaveBeenCalledWith(42);
    expect(f.deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("nada confirmado (gravações e leitura falham): `pending`, sem contar a cota nem apagar achados", async () => {
    const f = makeFake({ failCompletedWrite: true, failFailedWrite: true, failRead: true });
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("pending");
    expect(f.row["status"]).toBe("pending");
    expect(f.deps.incrementScansUsed).not.toHaveBeenCalled();
    expect(f.deps.deleteAuditViolations).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("nenhuma gravação confirmada, mas a leitura confirma `completed`: conta uma vez", async () => {
    const f = makeFake({ failFailedWrite: true, failCompletedWrite: true });
    f.row["status"] = "completed"; // concluída por esta execução, sem resposta da escrita
    await expect(runAudit(PARAMS, f.deps)).resolves.toBe("completed");
    expect(f.deps.incrementScansUsed).toHaveBeenCalledTimes(1);
  });
});

describe("runAudit — prazo", () => {
  it("scan que não termina vira `failed` por tempo e nada é gravado depois", async () => {
    vi.useFakeTimers();
    let resolveScan!: (r: ScanResult) => void;
    const f = makeFake({ scan: () => new Promise<ScanResult>((r) => (resolveScan = r)) });

    const pending = runAudit(PARAMS, f.deps, 1_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("failed");
    expect(f.row).toMatchObject({ status: "failed", errorMessage: TIMEOUT_MESSAGE });

    resolveScan(SCAN); // termina depois do prazo
    await vi.runAllTimersAsync();
    expect(f.deps.createViolation).not.toHaveBeenCalled();
    expect(f.history).toEqual(["failed:aplicado"]);
    expect(f.deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("prazo vencido durante a gravação dos achados: nenhum `completed` e achados limpos", async () => {
    vi.useFakeTimers();
    const f = makeFake({ delayViolation: 800 });

    const pending = runAudit(PARAMS, f.deps, 1_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("failed");

    await vi.runAllTimersAsync();
    // As duas inserções começaram antes do prazo (0 ms e 800 ms); o `completed`, não.
    expect(f.deps.createViolation).toHaveBeenCalledTimes(2);
    expect(f.history).toEqual(["failed:aplicado"]);
    expect(f.row["status"]).toBe("failed");
  });

  it("corrida: `completed` em voo no prazo e aplicado DEPOIS do `failed` é ignorado", async () => {
    vi.useFakeTimers();
    // scan 800 ms; `completed` começa em ~800 ms e só é aplicado em ~1300 ms;
    // o prazo vence em 1000 ms e o `failed` é aplicado na hora.
    const f = makeFake({
      scan: () => new Promise<ScanResult>((r) => setTimeout(() => r(SCAN), 800)),
      delayCompleted: 500,
    });

    const pending = runAudit(PARAMS, f.deps, 1_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(pending).resolves.toBe("failed");

    await vi.runAllTimersAsync(); // a escrita tardia chega
    expect(f.history).toEqual(["failed:aplicado", "completed:ignorado"]);
    expect(f.row).toMatchObject({ status: "failed", errorMessage: TIMEOUT_MESSAGE });
    expect(f.deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("corrida: `completed` aplicado ANTES do `failed` prevalece e a resposta é `completed`", async () => {
    vi.useFakeTimers();
    // `completed` aplicado em ~1300 ms; o `failed` (iniciado em 1000 ms) só em ~1600 ms.
    const f = makeFake({
      scan: () => new Promise<ScanResult>((r) => setTimeout(() => r(SCAN), 800)),
      delayCompleted: 500,
      delayFailed: 600,
    });

    const pending = runAudit(PARAMS, f.deps, 1_000);
    await vi.advanceTimersByTimeAsync(2_000);
    await expect(pending).resolves.toBe("completed");

    expect(f.history).toEqual(["completed:aplicado", "failed:ignorado"]);
    expect(f.row["status"]).toBe("completed");
    expect(f.violations()).toBe(2); // relatório concluído mantém os achados
    expect(f.deps.deleteAuditViolations).not.toHaveBeenCalled();
    expect(f.deps.incrementScansUsed).toHaveBeenCalledTimes(1);
  });

  it("análise síncrona que passa do prazo sem o timer disparar: nenhuma escrita começa", async () => {
    vi.useFakeTimers();
    // O relógio avança 1,5 s "dentro" do scan, sem rodar timers: simula o
    // JSDOM bloqueando o event loop além do prazo.
    const f = makeFake({
      scan: () => {
        vi.setSystemTime(Date.now() + 1_500);
        return Promise.resolve(SCAN);
      },
    });

    await expect(runAudit(PARAMS, f.deps, 1_000)).resolves.toBe("failed");

    expect(f.deps.createViolation).not.toHaveBeenCalled();
    expect(f.history).toEqual(["failed:aplicado"]);
    expect(f.row).toMatchObject({ status: "failed", errorMessage: TIMEOUT_MESSAGE });
    expect(f.deps.incrementScansUsed).not.toHaveBeenCalled();
  });

  it("scan dentro do prazo conclui normalmente", async () => {
    vi.useFakeTimers();
    const f = makeFake({ scan: () => new Promise<ScanResult>((r) => setTimeout(() => r(SCAN), 900)) });
    const pending = runAudit(PARAMS, f.deps, 1_000);
    await vi.advanceTimersByTimeAsync(900);
    await expect(pending).resolves.toBe("completed");
    await vi.runAllTimersAsync();
    expect(f.history).toEqual(["completed:aplicado"]);
  });
});

describe("orçamento de tempo na Vercel", () => {
  it("prazo do scan (busca + análise + gravação) cabe no maxDuration, com folga", () => {
    const maxMs = trpcConfig.maxDuration * 1000;
    // Hobby: 60 s no modo antigo; 300 s com Fluid compute. 60 s vale nos dois.
    expect(trpcConfig.maxDuration).toBeLessThanOrEqual(60);
    // A busca da página faz parte do prazo e é menor que ele.
    expect(DEFAULT_TIMEOUT_MS).toBeLessThan(SCAN_DEADLINE_MS);
    // Folga de pelo menos 5 s para autenticação, criação e partida a frio.
    expect(SCAN_DEADLINE_MS + 5_000).toBeLessThanOrEqual(maxMs);
  });

  it("pending só é considerado abandonado depois do maxDuration", () => {
    expect(STALE_PENDING_MS).toBeGreaterThan(trpcConfig.maxDuration * 1000);
  });
});
