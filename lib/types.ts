/**
 * Tipos compartilhados com o cliente (sem dependência de infraestrutura).
 * Mantém a UI desacoplada do código server-only (parser, fetch).
 */

export type Severity = "critical" | "warning" | "info"

export type PillarId =
  | "dark_pattern"
  | "autoplay"
  | "ad_tracker"
  | "age_verification"
  | "lootbox"
  | "infinite_scroll"
  | "missing_privacy_policy"
  | "other"

export type Classification = "compliant" | "partial" | "high_risk" | "non_compliant"

export interface Violation {
  type: PillarId
  severity: Severity
  title: string
  description: string
  recommendation: string
  elementSelector?: string
}

export interface PillarResult {
  id: PillarId
  name: string
  weight: number
  passed: boolean
}

export interface AuditResult {
  url: string
  scannedAt: string
  score: number
  classification: Classification
  summary: Record<Severity, number>
  pillars: PillarResult[]
  violations: Violation[]
}
