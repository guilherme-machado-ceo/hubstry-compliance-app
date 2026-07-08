/**
 * Orquestrador dos detectores de domínio.
 * Executa todas as regras RN-DET-* sobre um documento parseado.
 */
import type { HtmlDocument } from "@/lib/infrastructure/html-document"
import type { Violation } from "../violation"
import { detectAutoplay } from "./autoplay"
import { detectInfiniteScroll } from "./infinite-scroll"
import { detectDarkPatterns } from "./dark-patterns"
import { detectAdTrackers } from "./ad-trackers"
import { detectLootboxes } from "./lootboxes"
import { detectPrivacyPolicy } from "./privacy-policy"
import { detectAgeVerification } from "./age-verification"
import { detectConsent } from "./consent"
import { detectAccessibility } from "./accessibility"

const DETECTORS: Array<(doc: HtmlDocument) => Violation[]> = [
  detectAutoplay,
  detectInfiniteScroll,
  detectDarkPatterns,
  detectAdTrackers,
  detectLootboxes,
  detectPrivacyPolicy,
  detectAgeVerification,
  detectConsent,
  detectAccessibility,
]

export function runDetectors(doc: HtmlDocument): Violation[] {
  return DETECTORS.flatMap((detect) => detect(doc))
}
