import { useAuth } from "@/_core/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

/** Paleta derivada do logo Hubstry. */
export const HB = {
  ink: "#000000",
  text: "#EDEDE8",
  muted: "#9A9CA3",
  line: "#26282E",
  cyan: "#00FFFF", // o que o scanner observa
  orange: "#FF6605", // o que exige revisão humana
} as const;

export function Dot({ color, className = "" }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-full shrink-0 ${className}`}
      style={{ background: color, width: 10, height: 10 }}
    />
  );
}

export function SiteHeader() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  return (
    <header className="border-b" style={{ borderColor: HB.line }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <a href="/" className="hb-focus flex items-center gap-3" aria-label="Hubstry Compliance — início">
          <BrandLogo variant="light" height={16} />
          <span className="hidden min-[400px]:inline text-sm pl-3 border-l" style={{ color: HB.muted, borderColor: HB.line }}>
            Compliance
          </span>
        </a>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <button className="hb-focus px-3 py-2 hover:text-white hidden sm:inline" style={{ color: HB.muted }} onClick={() => navigate("/pricing")}>
            Planos
          </button>
          <button className="hb-focus px-3 py-2 hover:text-white hidden sm:inline" style={{ color: HB.muted }} onClick={() => navigate("/sobre")}>
            Sobre a Hubstry
          </button>
          <button
            className="hb-focus ml-1 px-4 py-2 rounded-md font-medium text-black"
            style={{ background: HB.cyan }}
            onClick={() => (isAuthenticated ? navigate("/dashboard") : (window.location.href = getLoginUrl()))}
          >
            {isAuthenticated ? "Ir para o painel" : "Entrar"}
          </button>
        </nav>
      </div>
      {/* Em telas estreitas, a navegação vai para uma segunda linha visível. */}
      <nav className="sm:hidden border-t px-6 h-11 flex items-center gap-6 text-sm" style={{ borderColor: HB.line, color: HB.muted }}>
        <a className="hb-focus hover:text-white" href="/pricing">Planos</a>
        <a className="hb-focus hover:text-white" href="/sobre">Sobre a Hubstry</a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t mt-24" style={{ borderColor: HB.line }}>
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-4">
          <BrandLogo variant="light" height={16} />
          <p className="text-sm max-w-md" style={{ color: HB.muted }}>
            Hubstry Compliance é um produto da Hubstry Deep Tech, operating deep tech venture builder
            com sede no Rio de Janeiro.
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: HB.muted }}>
            <a className="hb-focus hover:text-white" href="/sobre">Sobre a Hubstry</a>
            <a className="hb-focus hover:text-white" href="/pricing">Planos</a>
            <a className="hb-focus hover:text-white" href="mailto:guilhermemachado@hubstry.onmicrosoft.com">Contato</a>
            <a className="hb-focus hover:text-white" href="https://hubstry.dev" target="_blank" rel="noopener">hubstry.dev</a>
          </nav>
          <p className="text-xs" style={{ color: HB.muted }}>© 2026 Hubstry Deep Tech</p>
        </div>
        {/* Selo oficial NVIDIA Inception (arquivo sem alterações) — ADR-0010:
            só em páginas institucionais, nunca junto de auditorias ou scores. */}
        <img
          src="/brand/nvidia-inception-program-badge-rgb-for-screen.svg"
          alt="Membro do NVIDIA Inception Program"
          width={139}
          height={60}
          decoding="async"
        />
      </div>
    </footer>
  );
}
