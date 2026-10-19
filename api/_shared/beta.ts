/**
 * Fase de beta gratuito (ADR-0012). Fonte unica para servidor e interface.
 *
 * Com BETA_GRATUITO ativo:
 * - o checkout do Stripe fica desabilitado no servidor (stripe-router.ts);
 * - o plano gratuito recebe a cota BETA_SCANS_PER_MONTH, aplicada na leitura
 *   (sem migracao nem alteracao das linhas do banco);
 * - a interface mostra "Beta gratuito" no lugar dos planos pagos.
 *
 * Para reativar a cobranca: BETA_GRATUITO = false. Nada do Stripe foi apagado.
 */
export const BETA_GRATUITO = true;

/** Cota mensal do beta: generosa, mas finita, contra abuso e custo inesperado. */
export const BETA_SCANS_PER_MONTH = 30;

export const BETA_LABEL = "Beta gratuito";

export const BETA_CHECKOUT_MESSAGE =
  "Os planos pagos estão suspensos durante o beta gratuito. Nenhuma cobrança é feita.";

/**
 * Cota efetiva do plano. No beta, o plano gratuito recebe a cota do beta;
 * planos pagos ja existentes mantem a sua (-1 = ilimitado).
 */
export function effectiveScansPerMonth(plan: string, storedScansPerMonth: number): number {
  if (!BETA_GRATUITO || plan !== "free") return storedScansPerMonth;
  if (storedScansPerMonth === -1) return -1;
  return Math.max(storedScansPerMonth, BETA_SCANS_PER_MONTH);
}

/** Assinatura com a cota efetiva aplicada (usar em toda leitura da cota). */
export function withBetaQuota<T extends { plan: string; scansPerMonth: number }>(subscription: T): T {
  return {
    ...subscription,
    scansPerMonth: effectiveScansPerMonth(subscription.plan, subscription.scansPerMonth),
  };
}
