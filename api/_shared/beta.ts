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

/**
 * Convite publico ao beta. Desligado ate a decisao de hospedagem (ADR-0012):
 * enquanto isso, o beta e fechado, com acesso externo so em testes
 * controlados, e a interface pede convite por e-mail em vez de convidar.
 * Isto muda apenas a comunicacao; nao e controle de acesso (o login continua
 * aberto como hoje na `main`).
 */
export const BETA_CONVITE_PUBLICO = false;

export const BETA_CONTATO = "guilhermemachado@hubstry.onmicrosoft.com";

export const BETA_CHECKOUT_MESSAGE =
  "Os planos pagos estão suspensos durante o beta gratuito. Nenhuma cobrança é feita.";

/**
 * Cota efetiva do plano. No beta, TODA conta gratuita recebe exatamente a
 * cota do beta, que e finita, mesmo que o banco guarde outro valor (inclusive
 * -1, ilimitado). Planos pagos ja contratados mantem a sua.
 */
export function effectiveScansPerMonth(plan: string, storedScansPerMonth: number): number {
  if (!BETA_GRATUITO || plan !== "free") return storedScansPerMonth;
  return BETA_SCANS_PER_MONTH;
}

/** Assinatura com a cota efetiva aplicada (usar em toda leitura da cota). */
export function withBetaQuota<T extends { plan: string; scansPerMonth: number }>(subscription: T): T {
  return {
    ...subscription,
    scansPerMonth: effectiveScansPerMonth(subscription.plan, subscription.scansPerMonth),
  };
}
