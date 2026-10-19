import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Dot, HB, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { useLocation } from "wouter";
import { BETA_GRATUITO, BETA_LABEL, BETA_SCANS_PER_MONTH } from "@shared/beta";

const COVERAGE = [
  "Padrões de design manipulativo",
  "Reprodução automática de mídia",
  "Rolagem infinita",
  "Rastreadores de publicidade",
  "Sinais de público infantojuvenil",
  "Política de privacidade",
  "Consentimento e controle de cookies",
  "Acessibilidade básica",
];

const STEPS = [
  { title: "Cole o endereço", text: "Informe a URL pública da página que você quer analisar." },
  { title: "O scanner lê o HTML", text: "O HTML inicial retornado pelo servidor é analisado em memória e não é armazenado." },
  { title: "Receba o relatório", text: "Score, achados agrupados por tema e uma recomendação para cada ponto." },
];

const PLANS = [
  {
    name: "Free",
    price: "Grátis",
    items: ["5 análises por mês", "Todos os temas da análise", "Relatório com recomendações"],
    cta: "Começar grátis",
    action: "login" as const,
  },
  {
    name: "Pro",
    price: "R$ 99",
    period: "/mês",
    items: ["500 análises por mês", "Todos os temas da análise", "Suporte por e-mail", "Relatórios em PDF (em breve)"],
    cta: "Ver detalhes do Pro",
    action: "pricing" as const,
    featured: true,
  },
  {
    name: "Enterprise",
    price: "R$ 299",
    period: "/mês",
    items: ["Análises ilimitadas", "Todos os temas da análise", "Suporte prioritário por e-mail"],
    cta: "Falar com a Hubstry",
    action: "contact" as const,
  },
];

export default function Home() {
  // A home é pública para todos. Usuário logado não é mais redirecionado:
  // os botões levam ao painel em vez de pedir login de novo.
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const login = () => (isAuthenticated ? navigate("/dashboard") : (window.location.href = getLoginUrl()));
  const runPlan = (action: "login" | "pricing" | "contact") => {
    if (action === "login") return login();
    if (action === "pricing") return navigate("/pricing");
    window.location.href = "mailto:guilhermemachado@hubstry.onmicrosoft.com?subject=Hubstry%20Compliance%20Enterprise";
  };

  return (
    <div className="hb-sans min-h-screen" style={{ background: HB.ink, color: HB.text }}>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid gap-16 lg:grid-cols-[1.35fr_1fr] items-start">
          <div>
            <h1 className="hb-display font-bold leading-[1.02] tracking-[-0.01em] text-[2.4rem] sm:text-6xl lg:text-[3.9rem] text-balance">
              Triagem do seu site frente ao ECA Digital e à LGPD.
            </h1>
            <p className="mt-8 text-lg leading-relaxed max-w-[58ch]" style={{ color: HB.muted }}>
              Cole o endereço do site. O scanner analisa o HTML inicial da página e aponta os sinais que merecem revisão,
              como rastreadores, padrões de design manipulativo e ausência de política de privacidade,
              com uma recomendação para cada um.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <button
                className="hb-focus px-6 py-3.5 rounded-md text-base font-semibold text-black"
                style={{ background: HB.cyan }}
                onClick={login}
              >
                {isAuthenticated ? "Fazer uma análise" : "Analisar meu site grátis"}
              </button>
              <button className="hb-focus text-base underline underline-offset-4 hover:text-white" style={{ color: HB.muted }} onClick={() => navigate("/pricing")}>
                Ver planos
              </button>
            </div>
            <p className="mt-5 text-sm" style={{ color: HB.muted }}>
              5 análises gratuitas por mês. Sem cartão de crédito.
            </p>
          </div>

          <aside className="border rounded-lg p-7" style={{ borderColor: HB.line }} aria-labelledby="cobertura">
            <h2 id="cobertura" className="text-base font-semibold">O que a análise cobre</h2>
            <ul className="mt-5 space-y-3">
              {COVERAGE.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[15px]">
                  <Dot color={HB.cyan} />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed" style={{ color: HB.muted }}>
              Organização própria do Hubstry Compliance para a triagem, não uma lista oficial da
              Lei 15.211/2025 (ECA Digital), em vigor desde março de 2026.
            </p>
          </aside>
        </section>

        {/* Como funciona — sequência real, por isso numerada */}
        <section className="max-w-6xl mx-auto px-6 pb-24" aria-labelledby="como-funciona">
          <h2 id="como-funciona" className="hb-display text-2xl sm:text-3xl font-semibold">Como funciona</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t pt-6" style={{ borderColor: HB.line }}>
                <span className="hb-display text-4xl font-bold" style={{ color: HB.line }}>{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed" style={{ color: HB.muted }}>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Honestidade sobre o alcance da ferramenta (ADR-0005) */}
        <section className="max-w-6xl mx-auto px-6 pb-24" aria-labelledby="alcance">
          <h2 id="alcance" className="hb-display text-2xl sm:text-3xl font-semibold">O que a análise é, e o que não é</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div className="flex gap-4">
              <Dot color={HB.cyan} className="mt-2" />
              <p className="leading-relaxed max-w-[52ch]">
                <strong className="font-semibold">É uma triagem técnica automática.</strong>{" "}
                <span style={{ color: HB.muted }}>
                  Reproduzível e baseada no HTML inicial retornado pelo servidor. Conteúdo carregado
                  depois por JavaScript não entra na análise.
                </span>
              </p>
            </div>
            <div className="flex gap-4">
              <Dot color={HB.orange} className="mt-2" />
              <p className="leading-relaxed max-w-[52ch]">
                <strong className="font-semibold">Não é parecer jurídico.</strong>{" "}
                <span style={{ color: HB.muted }}>
                  Os achados indicam pontos para revisão humana. A conformidade depende de contexto
                  que nenhuma ferramenta automática enxerga sozinha.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Beta gratuito (ADR-0012): substitui a seção de planos durante o beta */}
        {BETA_GRATUITO && (
          <section className="max-w-6xl mx-auto px-6" aria-labelledby="beta">
            <h2 id="beta" className="hb-display text-2xl sm:text-3xl font-semibold">{BETA_LABEL}</h2>
            <p className="mt-4 text-lg max-w-[60ch]" style={{ color: HB.muted }}>
              Durante o beta, o uso é gratuito: {BETA_SCANS_PER_MONTH} análises por mês, todos os temas da análise e
              relatório com recomendações. Sem cartão de crédito.
            </p>
            <button
              className="hb-focus mt-8 px-6 py-3 rounded-md font-medium border"
              style={{ background: HB.cyan, color: "#000", borderColor: HB.cyan }}
              onClick={login}
            >
              {isAuthenticated ? "Ir para o painel" : "Participar do beta"}
            </button>
          </section>
        )}

        {/* Planos */}
        {!BETA_GRATUITO && (
        <section className="max-w-6xl mx-auto px-6" aria-labelledby="planos">
          <h2 id="planos" className="hb-display text-2xl sm:text-3xl font-semibold">Planos</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="rounded-lg p-7 flex flex-col border"
                style={{ borderColor: plan.featured ? HB.cyan : HB.line }}
              >
                <h3 className="text-base font-semibold" style={{ color: HB.muted }}>{plan.name}</h3>
                <p className="mt-3">
                  <span className="hb-display text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span style={{ color: HB.muted }}> {plan.period}</span>}
                </p>
                <ul className="mt-6 space-y-2.5 text-[15px] flex-1">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Dot color={HB.cyan} className="opacity-70" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className="hb-focus mt-8 py-3 rounded-md font-medium border"
                  style={
                    plan.featured
                      ? { background: HB.cyan, color: "#000", borderColor: HB.cyan }
                      : { borderColor: HB.line, color: HB.text }
                  }
                  onClick={() => runPlan(plan.action)}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
