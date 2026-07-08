/**
 * Caso de uso: Auditar uma URL contra a ECA Digital.
 *
 * Orquestra domínio + infraestrutura. Não persiste nada (RN-PRIV-01).
 * Fluxo: valida URL -> busca HTML -> parseia -> roda detectores -> monta relatório.
 */

import { buildComplianceReport, type ComplianceReport } from "@/lib/domain/compliance-report"
import { runDetectors } from "@/lib/domain/detectors"
import { HtmlDocument } from "@/lib/infrastructure/html-document"
import { fetchPage } from "@/lib/infrastructure/page-fetcher"
import { assertSafeUrl } from "@/lib/infrastructure/url-guard"

export interface AuditResult extends ComplianceReport {
  url: string
  scannedAt: string
}

export async function auditUrl(rawUrl: string): Promise<AuditResult> {
  const safeUrl = assertSafeUrl(rawUrl)

  const html = await fetchPage(safeUrl.toString())
  const doc = HtmlDocument.fromHtml(html)
  const violations = runDetectors(doc)
  const report = buildComplianceReport(violations)

  return {
    url: safeUrl.toString(),
    scannedAt: new Date().toISOString(),
    ...report,
  }
}
