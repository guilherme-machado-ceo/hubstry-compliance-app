/**
 * Infraestrutura: busca do HTML da página (RN-SEC-03 — timeout 10s).
 */

export class PageFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PageFetchError"
  }
}

const TIMEOUT_MS = 10_000

export async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    })

    if (!response.ok) {
      throw new PageFetchError(`A página respondeu com HTTP ${response.status} (${response.statusText}).`)
    }

    return await response.text()
  } catch (error) {
    if (error instanceof PageFetchError) throw error
    if (error instanceof Error && error.name === "AbortError") {
      throw new PageFetchError("Tempo limite excedido ao buscar a página (10s).")
    }
    throw new PageFetchError(
      `Não foi possível acessar a URL. Verifique se o endereço está correto e acessível.`,
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
