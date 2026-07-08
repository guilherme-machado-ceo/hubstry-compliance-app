/** Detector: Scroll Infinito (RN-DET-INFINITE) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

export function detectInfiniteScroll(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []
  const elements = doc.queryAll(
    "[class*='infinite'], [class*='endless'], [data-infinite-scroll]",
  )

  if (elements.length > 0) {
    violations.push({
      type: "infinite_scroll",
      severity: "warning",
      title: "Rolagem Infinita Detectada",
      description:
        "A rolagem infinita pode ser uma prática de dark pattern que mantém usuários engajados indefinidamente, especialmente prejudicial para menores.",
      recommendation:
        "Implemente paginação explícita ou adicione um aviso claro sobre o conteúdo infinito com opção de parar.",
      elementSelector: "[class*='infinite']",
    })
  }

  return violations
}
