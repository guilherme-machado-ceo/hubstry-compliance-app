import * as db from "./db.js";
import { scanUrl, type ScanResult } from "./scanner.js";

/**
 * Execucao da auditoria dentro da propria requisicao (ADR-0012).
 *
 * O scan e a gravacao dos resultados terminam antes da resposta, com um prazo
 * total explicito. Falha ou prazo excedido sempre resultam em `failed`; o que
 * escapar disso (processo encerrado pela plataforma, banco indisponivel) e
 * marcado como `failed` por failStalePendingAudits na leitura seguinte.
 *
 * Orcamento de tempo (funcao tRPC com maxDuration 30 s, api/trpc/[trpc].ts):
 * - busca da pagina: ate 10 s (safe-fetch.ts, DEFAULT_TIMEOUT_MS);
 * - scan + gravacao: ate SCAN_DEADLINE_MS;
 * - folga para autenticacao, criacao da auditoria e partida a frio.
 */
export const SCAN_DEADLINE_MS = 20_000;

/** Auditoria `pending` mais antiga que isto nao tem mais execucao viva. */
export const STALE_PENDING_MS = 2 * 60_000;

export const TIMEOUT_MESSAGE =
  "A análise excedeu o tempo limite e foi interrompida. Tente novamente.";
export const STALE_MESSAGE =
  "A análise foi interrompida antes de terminar. Tente novamente.";

type ViolationType =
  | "dark_pattern"
  | "autoplay"
  | "infinite_scroll"
  | "ad_tracker"
  | "lootbox"
  | "missing_privacy_policy"
  | "data_collection"
  | "age_verification"
  | "other";

export interface AuditRunnerDeps {
  scanUrl: (url: string) => Promise<ScanResult>;
  createViolation: typeof db.createViolation;
  updateAudit: typeof db.updateAudit;
  incrementScansUsed: typeof db.incrementScansUsed;
}

const defaultDeps: AuditRunnerDeps = {
  scanUrl,
  createViolation: db.createViolation,
  updateAudit: db.updateAudit,
  incrementScansUsed: db.incrementScansUsed,
};

class AuditTimeoutError extends Error {
  constructor() {
    super(TIMEOUT_MESSAGE);
  }
}

export type AuditOutcome = "completed" | "failed";

export async function runAudit(
  params: { auditId: number; userId: number; url: string },
  deps: AuditRunnerDeps = defaultDeps,
  deadlineMs: number = SCAN_DEADLINE_MS,
): Promise<AuditOutcome> {
  const { auditId, userId, url } = params;
  // Depois do prazo, a execucao em andamento para antes da proxima escrita.
  let expired = false;
  const ensureTime = () => {
    if (expired) throw new AuditTimeoutError();
  };

  const work = (async () => {
    const result = await deps.scanUrl(url);
    for (const violation of result.violations) {
      ensureTime();
      await deps.createViolation(auditId, {
        type: violation.type as ViolationType,
        severity: violation.severity,
        title: violation.title,
        description: violation.description,
        recommendation: violation.recommendation,
        elementSelector: violation.elementSelector ?? null,
        lineNumber: null,
      });
    }
    ensureTime();
    await deps.updateAudit(auditId, {
      status: "completed",
      complianceScore: result.complianceScore,
      totalViolations: result.violations.length,
      criticalViolations: result.summary.critical,
      warningViolations: result.summary.warning,
      infoViolations: result.summary.info,
    });
  })();
  // Se o prazo vencer primeiro, a rejeicao tardia de `work` nao fica solta.
  work.catch(() => {});

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      expired = true;
      reject(new AuditTimeoutError());
    }, deadlineMs);
  });

  try {
    await Promise.race([work, timeout]);
  } catch (error) {
    try {
      await deps.updateAudit(auditId, {
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } catch (persistError) {
      // Sem banco nao ha como gravar `failed` agora; a leitura seguinte
      // aplica failStalePendingAudits.
      console.error(`[audit ${auditId}] falha ao registrar erro:`, persistError);
    }
    return "failed";
  } finally {
    clearTimeout(timer);
  }

  // Conta o scan so quando concluido. Uma falha aqui nao desfaz o resultado.
  try {
    await deps.incrementScansUsed(userId);
  } catch (error) {
    console.error(`[audit ${auditId}] falha ao contar o scan:`, error);
  }
  return "completed";
}
