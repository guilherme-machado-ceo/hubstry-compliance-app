/** Detector: Autoplay (RN-DET-AUTOPLAY) */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"

export function detectAutoplay(doc: HtmlDocument): Violation[] {
  const violations: Violation[] = []
  const videos = doc.queryAll("video")

  const hasAutoplay = videos.some(
    (video) => video.hasAttribute("autoplay") || video.hasAttribute("data-autoplay"),
  )

  if (hasAutoplay) {
    violations.push({
      type: "autoplay",
      severity: "warning",
      title: "Vídeo com Autoplay Detectado",
      description:
        "Vídeos com autoplay podem prejudicar a experiência do usuário e consumir dados desnecessariamente, especialmente para usuários menores de idade.",
      recommendation:
        "Remova o atributo 'autoplay' ou implemente um controle de consentimento do usuário antes de reproduzir automaticamente.",
      elementSelector: "video[autoplay]",
    })
  }

  return violations
}
