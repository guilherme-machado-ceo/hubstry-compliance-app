/**
 * Domínio: Violação e Severidade
 */

import type { PillarId } from "./pillars"

export type Severity = "critical" | "warning" | "info"

export interface Violation {
  /** Pilar ao qual a violação pertence (RN-SCORE-02). */
  type: PillarId
  severity: Severity
  title: string
  description: string
  recommendation: string
  elementSelector?: string
}
