/** Detector: Verificação de Idade (RN-DET-AGE) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

const CHILD_PATTERNS = ["jogo", "game", "criança", "crianca", "kid", "infantil", "jovem", "teen"]
const AGE_GATE_PATTERNS = [
  "verificar idade",
  "verificação de idade",
  "age verification",
  "confirm age",
  "datavalid",
  "gov.br",
  "serpro",
]

export function detectAgeVerification(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []
  const bodyText = doc.bodyText()

  const targetsChildren = CHILD_PATTERNS.some((p) => bodyText.includes(p))
  const hasAgeGate = AGE_GATE_PATTERNS.some((p) => bodyText.includes(p))

  if (targetsChildren && !hasAgeGate) {
    violations.push({
      type: "age_verification",
      severity: "critical",
      title: "Verificação de Idade Ausente",
      description:
        "A página parece ser direcionada a menores, mas não possui mecanismo de verificação de idade conforme exigido pela ECA Digital.",
      recommendation:
        "Implemente um sistema robusto de verificação de idade usando APIs oficiais como Datavalid (Serpro/Gov.br) antes de permitir acesso.",
    })
  }

  return violations
}
