/** Detector: Dark Patterns — roach motel e misdirection (RN-DET-DARK) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

export function detectDarkPatterns(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []

  // Roach motel: formulário com envio, mas sem opção clara de cancelar/sair.
  const forms = doc.queryAll("form")
  let roachMotelFound = false
  for (const form of forms) {
    const submitButtons = form.querySelectorAll(
      "button[type='submit'], input[type='submit']",
    )
    const cancelButtons = form.querySelectorAll(
      "button[onclick*='cancel'], button[onclick*='close'], a[href*='cancel']",
    )
    if (submitButtons.length > 0 && cancelButtons.length === 0) {
      roachMotelFound = true
      break
    }
  }
  if (roachMotelFound) {
    violations.push({
      type: "dark_pattern",
      severity: "warning",
      title: "Padrão de Roach Motel Detectado",
      description:
        "Formulário sem opção clara de cancelamento ou saída, tornando difícil para usuários se desinscreverem.",
      recommendation:
        "Adicione um botão de cancelamento ou voltar com a mesma proeminência do botão de envio.",
    })
  }

  // Misdirection: botões de recusa visualmente desfavorecidos via opacidade.
  const buttons = doc.queryAll("button, a[role='button']")
  const misdirectionFound = buttons.some((button) => {
    const text = (button.textContent ?? "").toLowerCase()
    const style = button.getAttribute("style") ?? ""
    return (
      (text.includes("não") || text.includes("nao") || text.includes("recusar")) &&
      style.includes("opacity")
    )
  })
  if (misdirectionFound) {
    violations.push({
      type: "dark_pattern",
      severity: "critical",
      title: "Misdirection Detectada",
      description:
        "Botões de recusa estão visualmente desfavorecidos em relação aos botões de aceitação.",
      recommendation:
        "Certifique-se de que os botões de recusa têm a mesma proeminência visual que os de aceitação.",
    })
  }

  return violations
}
