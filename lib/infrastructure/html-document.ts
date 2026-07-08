/**
 * Infraestrutura: abstração de parsing de HTML.
 *
 * Encapsula o node-html-parser para que os detectores de domínio não dependam
 * diretamente da biblioteca — facilita testes e troca de parser.
 */

import { parse, type HTMLElement } from "node-html-parser"

export class HtmlDocument {
  private readonly root: HTMLElement

  private constructor(root: HTMLElement) {
    this.root = root
  }

  static fromHtml(html: string): HtmlDocument {
    const root = parse(html, {
      lowerCaseTagName: true,
      comment: false,
      blockTextElements: { script: true, style: true },
    })
    return new HtmlDocument(root)
  }

  /** querySelectorAll com fallback seguro. */
  queryAll(selector: string): HTMLElement[] {
    try {
      return this.root.querySelectorAll(selector)
    } catch {
      return []
    }
  }

  query(selector: string): HTMLElement | null {
    try {
      return this.root.querySelector(selector)
    } catch {
      return null
    }
  }

  /** Texto do corpo em minúsculas (para heurísticas textuais). */
  bodyText(): string {
    const body = this.query("body") ?? this.root
    return (body.textContent ?? "").toLowerCase()
  }

  textOf(selector: string): string {
    return (this.query(selector)?.textContent ?? "").toLowerCase()
  }
}
