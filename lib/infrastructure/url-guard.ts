/**
 * Infraestrutura: proteção de URL (RN-SEC-01 e RN-SEC-02).
 * Bloqueia protocolos não-http e alvos de rede interna (proteção contra SSRF).
 */

export class UrlNotAllowedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UrlNotAllowedError"
  }
}

const BLOCKED_HOSTNAMES = ["localhost", "0.0.0.0", "::1", "[::1]"]

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fe80:/i,
]

const BLOCKED_PATTERNS = ["169.254.169.254", "metadata.google.internal"]

/** Normaliza e valida a URL, lançando UrlNotAllowedError se proibida. */
export function assertSafeUrl(rawUrl: string): URL {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new UrlNotAllowedError("URL inválida. Informe um endereço completo, ex.: https://exemplo.com.br")
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new UrlNotAllowedError("Protocolo não permitido. Use http:// ou https://")
  }

  const hostname = parsed.hostname.toLowerCase()

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new UrlNotAllowedError("URL aponta para host local não permitido.")
  }

  if (PRIVATE_RANGES.some((r) => r.test(hostname))) {
    throw new UrlNotAllowedError("URL aponta para rede privada não permitida.")
  }

  if (BLOCKED_PATTERNS.some((p) => hostname.includes(p))) {
    throw new UrlNotAllowedError("URL não permitida.")
  }

  return parsed
}
