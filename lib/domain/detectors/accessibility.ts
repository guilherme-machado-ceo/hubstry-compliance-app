/** Detector: Acessibilidade básica (RN-DET-A11Y) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

export function detectAccessibility(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []

  // Imagens sem atributo alt.
  const images = doc.queryAll("img")
  const imagesWithoutAlt = images.filter((img) => !img.hasAttribute("alt")).length

  if (imagesWithoutAlt > 0) {
    violations.push({
      type: "other",
      severity: "info",
      title: `${imagesWithoutAlt} Imagem(ns) sem Texto Alternativo`,
      description:
        "Imagens sem atributo alt dificultam o acesso por pessoas com deficiência visual, impactando a acessibilidade digital.",
      recommendation:
        'Adicione o atributo alt descritivo a todas as imagens. Use alt="" para imagens decorativas.',
      elementSelector: "img:not([alt])",
    })
  }

  // <html> sem atributo lang.
  const htmlEl = doc.query("html")
  if (htmlEl && !htmlEl.hasAttribute("lang")) {
    violations.push({
      type: "other",
      severity: "info",
      title: "Idioma da Página Não Declarado",
      description:
        "O atributo lang não está definido no elemento <html>, dificultando o uso de leitores de tela.",
      recommendation:
        'Adicione lang="pt-BR" ao elemento <html> para indicar o idioma da página.',
      elementSelector: "html:not([lang])",
    })
  }

  return violations
}
