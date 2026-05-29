export const ECA_PILLARS = [
  { id: "dark_pattern",           name: "Dark Patterns",                 weight: 0.20 },
  { id: "autoplay",               name: "Autoplay e Estímulo Excessivo",  weight: 0.15 },
  { id: "ad_tracker",             name: "Rastreadores de Publicidade",    weight: 0.15 },
  { id: "age_verification",       name: "Verificação de Idade",           weight: 0.15 },
  { id: "lootbox",                name: "Lootboxes e Sorteios",           weight: 0.10 },
  { id: "infinite_scroll",        name: "Scroll Infinito",                weight: 0.10 },
  { id: "missing_privacy_policy", name: "Política de Privacidade",        weight: 0.10 },
  { id: "other",                  name: "Consentimento e Acessibilidade", weight: 0.05 },
] as const;

export type PillarId = (typeof ECA_PILLARS)[number]["id"];

export interface PillarResult {
  id: string;
  name: string;
  weight: number;
  passed: boolean;
  violations: unknown[];
}
