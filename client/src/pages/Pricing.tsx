import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Dot, HB, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { toast } from "sonner";
import { COBRANCA_CONGELADA, CONTATO, COTA_MENSAL_GRATUITA } from "@shared/gratuito";

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: subscription } = trpc.subscription.get.useQuery();

  const createCheckout = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirecionando para checkout...");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao iniciar checkout");
    },
  });

  const plans = [
    {
      name: "Free",
      price: "R$ 0",
      period: "para sempre",
      description: "Para conhecer a triagem",
      scans: "5 análises/mês",
      features: [
        "5 análises por mês",
        "Todos os temas da análise",
        "Score da triagem",
        "Relatório com recomendações",
      ],
      cta: "Começar grátis",
      highlighted: false,
      plan: "free" as const,
    },
    {
      name: "Pro",
      price: "R$ 99",
      period: "por mês",
      description: "Para quem analisa sites com frequência",
      scans: "500 análises/mês",
      features: [
        "500 análises por mês",
        "Todos os temas da análise",
        "Suporte por e-mail",
        "Exportação em PDF (em breve)",
      ],
      cta: "Assinar o Pro",
      highlighted: true,
      plan: "pro" as const,
    },
    {
      name: "Enterprise",
      price: "R$ 299",
      period: "por mês",
      description: "Sem limite mensal de análises",
      scans: "Análises ilimitadas",
      features: [
        "Análises ilimitadas",
        "Todos os temas da análise",
        "Suporte prioritário por e-mail",
        "Exportação em PDF (em breve)",
      ],
      cta: "Assinar o Enterprise",
      highlighted: false,
      plan: "enterprise" as const,
    },
  ];

  const handleUpgrade = (planName: string) => {
    if (!isAuthenticated) {
      // Visitante: o login com GitHub cria a conta; depois ele volta aos planos
      window.location.href = getLoginUrl();
      return;
    }

    if (planName === "free") {
      navigate("/dashboard");
      return;
    }

    createCheckout.mutate({
      plan: planName.toUpperCase() as "PRO" | "ENTERPRISE",
    });
  };

  const faq = [
    { q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim, sem multa. Enquanto o cancelamento direto pelo painel não está disponível, peça pelo e-mail guilhermemachado@hubstry.onmicrosoft.com. O acesso continua até o fim do período já pago." },
    { q: "Qual é a diferença entre Pro e Enterprise?", a: "O Enterprise não tem limite mensal de análises e inclui suporte prioritário por e-mail. Os dois planos usam a mesma análise." },
    { q: "Posso mudar de plano?", a: "Sim. Para mudar de plano, fale conosco pelo e-mail guilhermemachado@hubstry.onmicrosoft.com." },
    { q: "Há desconto para pagamento anual?", a: "Fale conosco pelo e-mail para conversar sobre planos sob medida e pagamento anual." },
  ];
  const current = subscription?.plan;

  // Cobranca congelada (ADR-0012): o app e gratuito e nao ha planos pagos; o
  // checkout tambem e bloqueado no servidor. O conteudo abaixo e preservado.
  if (COBRANCA_CONGELADA) {
    return <PlanoGratuito isAuthenticated={isAuthenticated} onStart={() => handleUpgrade("free")} />;
  }

  return (
    <div className="hb-sans min-h-screen" style={{ background: HB.ink, color: HB.text }}>
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-6 pt-16">
        <h1 className="hb-display font-bold leading-[1.05] text-4xl sm:text-5xl">Planos</h1>
        <p className="mt-4 text-lg max-w-[60ch]" style={{ color: HB.muted }}>
          Todos os planos usam a mesma análise. A diferença está no número de análises por mês e no suporte.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = isAuthenticated && current === plan.plan;
            return (
              <div
                key={plan.name}
                className="rounded-lg p-7 flex flex-col border"
                style={{ borderColor: plan.highlighted ? HB.cyan : HB.line }}
              >
                <h2 className="text-base font-semibold" style={{ color: HB.muted }}>{plan.name}</h2>
                <p className="mt-3">
                  <span className="hb-display text-3xl font-bold">{plan.price}</span>
                  <span style={{ color: HB.muted }}> {plan.period}</span>
                </p>
                <p className="mt-2 text-sm" style={{ color: HB.muted }}>{plan.description}</p>
                <ul className="mt-6 space-y-2.5 text-[15px] flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Dot color={HB.cyan} className="opacity-70" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className="hb-focus mt-8 py-3 rounded-md font-medium border disabled:opacity-60"
                  style={
                    plan.highlighted
                      ? { background: HB.cyan, color: "#000", borderColor: HB.cyan }
                      : { borderColor: HB.line, color: HB.text }
                  }
                  disabled={createCheckout.isPending || isCurrent}
                  onClick={() => handleUpgrade(plan.plan)}
                >
                  {isCurrent ? "Seu plano atual" : createCheckout.isPending ? "Processando…" : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <section className="mt-20 max-w-3xl" aria-labelledby="faq">
          <h2 id="faq" className="hb-display text-2xl font-semibold">Perguntas frequentes</h2>
          <dl className="mt-8 space-y-8">
            {faq.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-2 leading-relaxed" style={{ color: HB.muted }}>{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const ITENS_GRATUITOS = [
  `${COTA_MENSAL_GRATUITA} análises por mês por conta`,
  "Todos os temas da análise",
  "Relatório com recomendações",
  "Sem cartão de crédito",
];

const FAQ_GRATUITO = [
  {
    q: "O Hubstry Compliance é gratuito mesmo?",
    a: "Sim. Não há planos pagos nem cobrança, e não pedimos cartão de crédito. Basta entrar com sua conta do GitHub.",
  },
  {
    q: "Vou ser cobrado depois?",
    a: "Não. Se isso mudar um dia, avisaremos com antecedência, e nada será cobrado sem que você contrate de forma expressa.",
  },
  {
    q: "Por que existe um limite mensal?",
    a: "Para evitar abuso e manter o serviço estável. O saldo reinicia no dia 1º de cada mês.",
  },
  {
    q: "Preciso de mais análises ou quero dar feedback.",
    a: `Escreva para ${CONTATO}.`,
  },
];

function PlanoGratuito({ isAuthenticated, onStart }: { isAuthenticated: boolean; onStart: () => void }) {
  return (
    <div className="hb-sans min-h-screen" style={{ background: HB.ink, color: HB.text }}>
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-6 pt-16">
        <h1 className="hb-display font-bold leading-[1.05] text-4xl sm:text-5xl">Gratuito</h1>
        <p className="mt-4 text-lg max-w-[60ch]" style={{ color: HB.muted }}>
          O Hubstry Compliance é gratuito. Não há planos pagos nem cobrança.
        </p>

        <div className="mt-12 max-w-md rounded-lg p-7 flex flex-col border" style={{ borderColor: HB.cyan }}>
          <h2 className="text-base font-semibold" style={{ color: HB.muted }}>Plano gratuito</h2>
          <p className="mt-3">
            <span className="hb-display text-3xl font-bold">R$ 0</span>
          </p>
          <ul className="mt-6 space-y-2.5 text-[15px] flex-1">
            {ITENS_GRATUITOS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Dot color={HB.cyan} className="opacity-70" />
                {item}
              </li>
            ))}
          </ul>
          <button
            className="hb-focus mt-8 py-3 rounded-md font-medium border"
            style={{ background: HB.cyan, color: "#000", borderColor: HB.cyan }}
            onClick={onStart}
          >
            {isAuthenticated ? "Ir para o painel" : "Começar grátis"}
          </button>
        </div>

        <section className="mt-20 max-w-3xl" aria-labelledby="faq">
          <h2 id="faq" className="hb-display text-2xl font-semibold">Perguntas frequentes</h2>
          <dl className="mt-8 space-y-8">
            {FAQ_GRATUITO.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-2 leading-relaxed" style={{ color: HB.muted }}>{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
