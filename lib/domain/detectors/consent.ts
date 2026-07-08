/** Detector: Mecanismo de Consentimento / CMP (RN-DET-CONSENT) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

const CONSENT_PATTERNS = [
  "aceitar",
  "aceito",
  "concordo",
  "consentimento",
  "consent",
  "cookies",
  "lgpd",
  "termos",
]
const CMP_SCRIPT_PATTERNS = ["cookiebot", "onetrust", "cookiepro", "didomi"]

export function detectConsent(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []
  const bodyText = doc.bodyText()

  const hasConsentText = CONSENT_PATTERNS.some((p) => bodyText.includes(p))

  const scripts = doc.queryAll("script[src]")
  const hasCmpScript = scripts.some((s) => {
    const src = (s.getAttribute("src") ?? "").toLowerCase()
    return CMP_SCRIPT_PATTERNS.some((p) => src.includes(p))
  })

  if (!hasConsentText && !hasCmpScript) {
    violations.push({
      type: "other",
      severity: "critical",
      title: "Mecanismo de Consentimento Não Encontrado",
      description:
        "Nenhum banner ou mecanismo de consentimento para cookies/dados foi detectado, violando a LGPD e a ECA Digital.",
      recommendation:
        "Implemente uma plataforma de gerenciamento de consentimento (CMP) compatível com LGPD antes de carregar rastreadores.",
    })
  }

  return violations
}
