"use client"

import { useState, useRef } from "react"
import type { ReportDTO } from "@/lib/types"
import { ComplianceReport } from "@/components/compliance-report"

type Status = "idle" | "loading" | "done" | "error"

export function Scanner() {
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [report, setReport] = useState<ReportDTO | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const resultRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || status === "loading") return

    setStatus("loading")
    setReport(null)
    setErrorMsg("")

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setErrorMsg(data?.error ?? "Não foi possível analisar esta URL.")
        return
      }

      setReport(data as ReportDTO)
      setStatus("done")
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    } catch {
      setStatus("error")
      setErrorMsg("Erro de conexão. Tente novamente.")
    }
  }

  return (
    <section id="scanner" className="border-t border-border bg-card">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Auditoria gratuita</p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-medium text-foreground md:text-4xl">
            Analise a conformidade do seu site
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Informe a URL pública. A análise é feita em tempo real e nenhum dado é armazenado.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="url" className="sr-only">
            URL do site
          </label>
          <input
            id="url"
            type="text"
            inputMode="url"
            placeholder="https://exemplo.com.br"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-12 flex-1 rounded-md border border-input bg-background px-4 font-mono text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="h-12 rounded-md bg-primary px-6 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Analisando..." : "Auditar site"}
          </button>
        </form>

        {status === "error" && (
          <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMsg}
          </p>
        )}

        {status === "loading" && (
          <div className="mt-10 flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
            <p className="font-mono text-xs uppercase tracking-widest">Verificando 8 pilares da ECA Digital</p>
          </div>
        )}
      </div>

      {status === "done" && report && (
        <div ref={resultRef}>
          <ComplianceReport report={report} />
        </div>
      )}
    </section>
  )
}
