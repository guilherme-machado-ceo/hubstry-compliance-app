import type { ViolationDetail } from "../../scanner.js";

/**
 * Identificadores dos achados na implementação ATUAL do scanner.
 *
 * Centralizados aqui de propósito: quando os critérios da Luna renomearem
 * tipos, títulos ou severidades, só este arquivo muda — os testes de
 * regressão continuam descrevendo o mesmo comportamento esperado.
 */
export type FindingCategory =
  | "publico_infantojuvenil"
  | "roach_motel"
  | "ausencia_banner_consentimento";

const MATCHERS: Record<FindingCategory, (v: ViolationDetail) => boolean> = {
  // Hoje: "Verificacao de Idade Ausente", disparada quando a página é
  // classificada como direcionada a menores.
  publico_infantojuvenil: (v) => v.type === "age_verification",
  roach_motel: (v) => v.type === "dark_pattern" && /roach motel/i.test(v.title),
  ausencia_banner_consentimento: (v) => /consentimento/i.test(v.title),
};

export function findingsOf(
  violations: ViolationDetail[],
  category: FindingCategory,
): ViolationDetail[] {
  return violations.filter(MATCHERS[category]);
}
