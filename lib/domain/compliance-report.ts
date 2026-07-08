/**
 * Domínio: Relatório de Conformidade (agregado raiz do resultado)
 *
 * Aplica as regras RN-SCORE-01..04 de docs/02-regras-de-negocio.md.
 */

import { ECA_PILLARS, type PillarId, type PillarResult } from "./pillars"
import type { Severity, Violation } from "./violation"

export type Classification =
  | "compliant"
  | "partial"
  | "high_risk"
  | "non_compliant"

export interface ComplianceReport {
  score: number
  classification: Classification
  summary: Record<Severity, number>
  pillars: PillarResult[]
  violations: Violation[]
}

/** RN-SCORE-04: classificação qualitativa a partir do score. */
export function classifyScore(score: number): Classification {
  if (score >= 90) return "compliant"
  if (score >= 70) return "partial"
  if (score >= 40) return "high_risk"
  return "non_compliant"
}

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  compliant: "Conforme",
  partial: "Conformidade parcial",
  high_risk: "Risco elevado",
  non_compliant: "Não conforme",
}

/**
 * Monta o relatório a partir das violações detectadas.
 * RN-SCORE-01: cada pilar sem violação soma peso × 100.
 * RN-SCORE-02: pilar reprovado se houver violação com type === pillar.id.
 * RN-SCORE-03: score arredondado e no intervalo [0, 100].
 */
export function buildComplianceReport(violations: Violation[]): ComplianceReport {
  const violatedPillars = new Set<PillarId>(violations.map((v) => v.type))

  const pillars: PillarResult[] = ECA_PILLARS.map((pillar) => ({
    id: pillar.id,
    name: pillar.name,
    weight: pillar.weight,
    passed: !violatedPillars.has(pillar.id),
  }))

  const rawScore = pillars.reduce(
    (acc, pillar) => acc + (pillar.passed ? pillar.weight * 100 : 0),
    0,
  )
  const score = Math.min(100, Math.max(0, Math.round(rawScore)))

  const summary: Record<Severity, number> = {
    critical: violations.filter((v) => v.severity === "critical").length,
    warning: violations.filter((v) => v.severity === "warning").length,
    info: violations.filter((v) => v.severity === "info").length,
  }

  return {
    score,
    classification: classifyScore(score),
    summary,
    pillars,
    violations,
  }
}
