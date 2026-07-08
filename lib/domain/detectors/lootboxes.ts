/** Detector: Lootboxes e Sorteios (RN-DET-LOOTBOX) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

const LOOTBOX_PATTERNS = ["caixa", "sorteio", "prêmio", "premio", "gacha", "loot", "roleta", "roulette", "spin"]
const PAYMENT_PATTERNS = ["comprar", "pagar", "crédito", "credito", "buy", "pay"]

export function detectLootboxes(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []
  const bodyText = doc.bodyText()

  const hasLootbox = LOOTBOX_PATTERNS.some((p) => bodyText.includes(p))
  const hasPayment = PAYMENT_PATTERNS.some((p) => bodyText.includes(p))

  if (hasLootbox && hasPayment) {
    violations.push({
      type: "lootbox",
      severity: "critical",
      title: "Possível Mecânica de Lootbox Detectada",
      description:
        "A página pode conter mecanismos de sorteio ou caixas-surpresa com pagamento, o que é prejudicial para menores.",
      recommendation:
        "Implemente controles de idade robustos e avisos claros sobre mecânicas de sorteio. Considere remover essas funcionalidades para usuários menores.",
    })
  }

  return violations
}
