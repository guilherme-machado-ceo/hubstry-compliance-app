import * as db from "./db.js";
import { scanUrl, type ScanResult } from "./scanner.js";

/**
 * Execucao da auditoria dentro da propria requisicao (ADR-0012).
 *
 * Prazo total de SCAN_DEADLINE_MS para a operacao inteira: busca da pagina,
 * analise e gravacao dos resultados. O timer NAO interrompe codigo sincrono
 * em execucao (a analise do JSDOM bloqueia o event loop); por isso, antes de
 * cada escrita, o prazo tambem e conferido pelo relogio, e nenhuma escrita
 * comeca depois dele, mesmo que o timer ainda nao tenha disparado. Isso
 * garante estado final consistente, nao corte rigido; o teto absoluto
 * continua sendo o maxDuration da funcao (api/trpc/[trpc].ts).
 *
 * Garantias:
 * - As transicoes finais (`completed`/`failed`) so valem a partir de
 *   `pending` (db.updateAuditIfPending): a primeira gravada prevalece e uma
 *   escrita atrasada nao sobrescreve o estado final.
 * - O resultado e a contagem da cota se baseiam em estado CONFIRMADO: a
 *   propria transicao aplicada (linha afetada) ou, se nenhuma foi confirmada,
 *   a leitura do banco. Sem confirmacao, o resultado e `pending`: nao afirma
 *   conclusao nem falha, nao conta a cota e nao apaga achados.
 * - Auditoria que termina `failed` tem os achados parciais removidos (melhor
 *   esforco); a leitura so expoe achados de auditorias `completed`.
 * - O que escapar disso (funcao encerrada pela plataforma, banco indisponivel)
 *   vira `failed` em failStalePendingAudits na leitura seguinte.
 *
 * Orcamento: busca da pagina ate 10 s (safe-fetch.ts) dentro dos 20 s;
 * maxDuration 30 s deixa folga para autenticacao, criacao e partida a frio.
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
  updateAuditIfPending: typeof db.updateAuditIfPending;
  deleteAuditViolations: typeof db.deleteAuditViolations;
  getAuditById: (auditId: number) => Promise<{ status: string } | undefined>;
  incrementScansUsed: typeof db.incrementScansUsed;
}

const defaultDeps: AuditRunnerDeps = {
  scanUrl,
  createViolation: db.createViolation,
  updateAuditIfPending: db.updateAuditIfPending,
  deleteAuditViolations: db.deleteAuditViolations,
  getAuditById: db.getAuditById,
  incrementScansUsed: db.incrementScansUsed,
};

class AuditTimeoutError extends Error {
  constructor() {
    super(TIMEOUT_MESSAGE);
  }
}

/** `pending` = estado final nao confirmado. */
export type AuditOutcome = "completed" | "failed" | "pending";

export async function runAudit(
  params: { auditId: number; userId: number; url: string },
  deps: AuditRunnerDeps = defaultDeps,
  deadlineMs: number = SCAN_DEADLINE_MS,
): Promise<AuditOutcome> {
  const { auditId, userId, url } = params;
  const deadlineAt = Date.now() + deadlineMs;
  // Depois do prazo, nenhuma escrita comeca. O relogio cobre o caso em que
  // codigo sincrono atrasou o disparo do timer.
  let expired = false;
  const ensureTime = () => {
    if (expired || Date.now() >= deadlineAt) {
      expired = true;
      throw new AuditTimeoutError();
    }
  };

  let completedApplied = false;
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
    completedApplied = await deps.updateAuditIfPending(auditId, {
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

  let failedApplied = false;
  try {
    await Promise.race([work, timeout]);
  } catch (error) {
    try {
      failedApplied = await deps.updateAuditIfPending(auditId, {
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } catch (persistError) {
      // Sem banco nao ha como gravar `failed` agora; a leitura seguinte
      // aplica failStalePendingAudits.
      console.error(`[audit ${auditId}] falha ao registrar erro:`, persistError);
    }
  } finally {
    clearTimeout(timer);
  }

  const outcome = await confirmOutcome(auditId, deps, completedApplied, failedApplied);

  if (outcome === "completed") {
    // Conta o scan so com conclusao confirmada. Falha aqui nao desfaz o resultado.
    try {
      await deps.incrementScansUsed(userId);
    } catch (error) {
      console.error(`[audit ${auditId}] falha ao contar o scan:`, error);
    }
  } else if (outcome === "failed") {
    // Remove achados parciais. Uma insercao ja em voo pode chegar depois
    // desta limpeza; por isso a leitura so expoe achados de `completed`.
    try {
      await deps.deleteAuditViolations(auditId);
    } catch (error) {
      console.error(`[audit ${auditId}] falha ao limpar achados parciais:`, error);
    }
  }
  return outcome;
}

/**
 * Estado final confirmado: a transicao aplicada por esta execucao ou, se
 * nenhuma foi confirmada, a leitura do banco. Sem confirmacao: `pending`.
 */
async function confirmOutcome(
  auditId: number,
  deps: AuditRunnerDeps,
  completedApplied: boolean,
  failedApplied: boolean,
): Promise<AuditOutcome> {
  if (completedApplied) return "completed";
  if (failedApplied) return "failed";
  try {
    const status = (await deps.getAuditById(auditId))?.status;
    if (status === "completed" || status === "failed") return status;
  } catch (error) {
    console.error(`[audit ${auditId}] falha ao ler o estado final:`, error);
  }
  return "pending";
}
