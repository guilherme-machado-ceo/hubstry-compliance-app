import { NextResponse } from "next/server"
import { auditUrl } from "@/lib/application/audit-url"
import { UrlNotAllowedError } from "@/lib/infrastructure/url-guard"
import { PageFetchError } from "@/lib/infrastructure/page-fetcher"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: Request) {
  let url: unknown
  try {
    const body = await request.json()
    url = body?.url
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "Informe uma URL para auditar." }, { status: 400 })
  }

  const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`

  try {
    const result = await auditUrl(normalized)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof UrlNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof PageFetchError) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }
    console.error("[v0] Erro inesperado na auditoria:", error)
    return NextResponse.json(
      { error: "Ocorreu um erro inesperado ao processar a auditoria." },
      { status: 500 },
    )
  }
}
