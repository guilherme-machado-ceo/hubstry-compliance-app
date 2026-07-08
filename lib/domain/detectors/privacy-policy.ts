/** Detector: Política de Privacidade (RN-DET-PRIVACY) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

const PRIVACY_PATTERNS = ["privacidade", "privacy", "política", "politica", "policy", "dados pessoais"]

export function detectPrivacyPolicy(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []

  const bodyText = doc.bodyText()
  const footerText = doc.textOf("footer")
  const headerText = doc.textOf("header")

  const hasPrivacy = PRIVACY_PATTERNS.some(
    (p) => bodyText.includes(p) || footerText.includes(p) || headerText.includes(p),
  )

  if (!hasPrivacy) {
    violations.push({
      type: "missing_privacy_policy",
      severity: "critical",
      title: "Política de Privacidade Não Encontrada",
      description:
        "Nenhuma referência a política de privacidade foi encontrada na página. Isso viola a LGPD e regulamentações de proteção de dados.",
      recommendation:
        "Adicione um link para a política de privacidade no rodapé ou cabeçalho da página, tornando-o facilmente acessível.",
    })
  }

  return violations
}
