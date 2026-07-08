/**
 * Domínio: Pilares da ECA Digital (Lei 15.211/2025)
 *
 * Value Objects que definem as 8 dimensões avaliadas e seus pesos.
 * A soma dos pesos é 1.0 (100%). Alterar pesos é uma mudança de regra de negócio
 * (ver docs/02-regras-de-negocio.md — RN-PESO).
 */

export const ECA_PILLARS = [
  { id: "dark_pattern", name: "Dark Patterns", weight: 0.2 },
  { id: "autoplay", name: "Autoplay e Estímulo Excessivo", weight: 0.15 },
  { id: "ad_tracker", name: "Rastreadores de Publicidade", weight: 0.15 },
  { id: "age_verification", name: "Verificação de Idade", weight: 0.15 },
  { id: "lootbox", name: "Lootboxes e Sorteios", weight: 0.1 },
  { id: "infinite_scroll", name: "Scroll Infinito", weight: 0.1 },
  { id: "missing_privacy_policy", name: "Política de Privacidade", weight: 0.1 },
  { id: "other", name: "Consentimento e Acessibilidade", weight: 0.05 },
] as const

export type PillarId = (typeof ECA_PILLARS)[number]["id"]

export interface PillarResult {
  id: PillarId
  name: string
  weight: number
  passed: boolean
}

/** Descrição curta de cada pilar para uso na UI institucional. */
export const PILLAR_DESCRIPTIONS: Record<PillarId, string> = {
  dark_pattern:
    "Padrões de interface enganosos que induzem o usuário a decisões contra seu interesse.",
  autoplay:
    "Reprodução automática de mídia e estímulos excessivos sem consentimento.",
  ad_tracker:
    "Rastreadores de publicidade que coletam dados sem consentimento explícito.",
  age_verification:
    "Mecanismos de verificação de idade em conteúdo direcionado a menores.",
  lootbox:
    "Mecânicas de sorteio ou caixas-surpresa associadas a pagamento.",
  infinite_scroll:
    "Rolagem infinita usada como mecanismo de retenção prejudicial.",
  missing_privacy_policy:
    "Presença e acessibilidade de uma política de privacidade.",
  other:
    "Mecanismo de consentimento (CMP) e boas práticas de acessibilidade.",
}
