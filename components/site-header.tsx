import { ShieldCheck } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <a href="#topo" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-serif text-lg font-semibold tracking-tight">
            Hubstry <span className="text-primary">Compliance</span>
          </span>
        </a>
        <nav aria-label="Navegação principal" className="hidden items-center gap-6 md:flex">
          <a href="#scanner" className="font-mono-label text-xs text-muted-foreground transition-colors hover:text-foreground">
            Scanner
          </a>
          <a href="#pilares" className="font-mono-label text-xs text-muted-foreground transition-colors hover:text-foreground">
            8 Pilares
          </a>
          <a href="#privacidade" className="font-mono-label text-xs text-muted-foreground transition-colors hover:text-foreground">
            Privacidade
          </a>
        </nav>
        <a
          href="#scanner"
          className="rounded-md bg-primary px-3 py-1.5 font-mono-label text-xs text-primary-foreground transition-opacity hover:opacity-90"
        >
          Escanear agora
        </a>
      </div>
    </header>
  )
}
