/**
 * App gratuito na Vercel Hobby, com cobranca congelada (ADR-0012). Fonte
 * unica para servidor e interface.
 *
 * Com COBRANCA_CONGELADA ativo:
 * - o checkout do Stripe fica desativado no servidor (stripe-router.ts); o
 *   codigo, os segredos e as configuracoes do Stripe sao preservados;
 * - toda conta gratuita recebe a cota COTA_MENSAL_GRATUITA, aplicada na
 *   leitura (sem migracao nem alteracao das linhas do banco);
 * - a interface apresenta o app como gratuito, sem planos pagos.
 */
export const COBRANCA_CONGELADA = true;

/** Limite operacional por conta: finito, contra abuso e consumo de recursos. */
export const COTA_MENSAL_GRATUITA = 30;

export const ROTULO_PLANO_GRATUITO = "Plano gratuito";

export const CHECKOUT_DESATIVADO_MENSAGEM =
  "O Hubstry Compliance é gratuito: não há planos pagos nem cobrança.";

export const CONTATO = "guilhermemachado@hubstry.onmicrosoft.com";

/**
 * Cota efetiva do plano. Com a cobranca congelada, TODA conta gratuita
 * recebe exatamente a cota gratuita, que e finita, mesmo que o banco guarde
 * outro valor (inclusive -1, ilimitado). Planos pagos ja contratados mantem
 * a sua.
 */
export function effectiveScansPerMonth(plan: string, storedScansPerMonth: number): number {
  if (!COBRANCA_CONGELADA || plan !== "free") return storedScansPerMonth;
  return COTA_MENSAL_GRATUITA;
}

/** Assinatura com a cota efetiva aplicada (usar em toda leitura da cota). */
export function withCotaGratuita<T extends { plan: string; scansPerMonth: number }>(subscription: T): T {
  return {
    ...subscription,
    scansPerMonth: effectiveScansPerMonth(subscription.plan, subscription.scansPerMonth),
  };
}
