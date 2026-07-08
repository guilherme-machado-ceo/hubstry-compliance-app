/** Detector: Rastreadores de Publicidade (RN-DET-TRACKER) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

const TRACKER_PATTERNS = [
  "google-analytics",
  "googletagmanager",
  "facebook.com/tr",
  "connect.facebook.net",
  "doubleclick.net",
  "googleadservices",
  "amazon-adsystem",
  "criteo.com",
  "bing.com/ads",
]

export function detectAdTrackers(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []
  const scripts = doc.queryAll("script")

  let trackerCount = 0
  for (const script of scripts) {
    const src = (script.getAttribute("src") ?? script.textContent ?? "").toLowerCase()
    if (TRACKER_PATTERNS.some((pattern) => src.includes(pattern))) {
      trackerCount++
    }
  }

  if (trackerCount > 0) {
    violations.push({
      type: "ad_tracker",
      severity: "warning",
      title: `${trackerCount} Rastreador(es) de Anúncios Detectado(s)`,
      description:
        "Múltiplos rastreadores de anúncios foram encontrados na página, potencialmente coletando dados de usuários sem consentimento.",
      recommendation:
        "Revise a política de privacidade e implemente consentimento explícito antes de carregar rastreadores, especialmente para menores.",
    })
  }

  return violations
}
