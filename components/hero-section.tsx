export function HeroSection() {
  return (
    <section id="topo" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="flex items-center gap-2 font-mono-label text-xs text-primary">
          <span className="h-1.5 w-1.5 bg-primary" aria-hidden="true" />
          Lei 15.211/2025 · ECA Digital
        </div>
        <h1 className="mt-6 max-w-3xl text-balance font-serif text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Conformidade digital para a proteção de crianças e adolescentes.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          O Hubstry Compliance audita sites e aplicações contra os 8 pilares da ECA
          Digital. Informe uma URL e receba um diagnóstico de conformidade em segundos —
          sem cadastro e sem retenção de dados.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono-label text-xs text-muted-foreground">
          <span>Análise real de HTML</span>
          <span>8 pilares avaliados</span>
          <span>100% stateless</span>
          <span>Compatível com LGPD</span>
        </div>
      </div>
    </section>
  )
}
