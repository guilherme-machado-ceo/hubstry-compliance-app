import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

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
      description: "Perfeito para começar",
      scans: "3 scans",
      features: [
        "3 scans por mês",
        "Relatórios básicos",
        "Score de conformidade",
        "Detecção de violações",
      ],
      cta: "Começar Agora",
      highlighted: false,
      plan: "free" as const,
    },
    {
      name: "Pro",
      price: "R$ 99",
      period: "por mês",
      description: "Para profissionais",
      scans: "Ilimitados",
      features: [
        "Scans ilimitados",
        "Relatórios detalhados",
        "Exportação em PDF",
        "Histórico completo",
        "Suporte por email",
      ],
      cta: "Upgrade para Pro",
      highlighted: true,
      plan: "pro" as const,
    },
    {
      name: "Enterprise",
      price: "R$ 299",
      period: "por mês",
      description: "Para grandes equipes",
      scans: "Ilimitados",
      features: [
        "Scans ilimitados",
        "API access",
        "Relatórios avançados",
        "Exportação em PDF",
        "Histórico completo",
        "Suporte prioritário",
        "Webhooks customizados",
        "SLA garantido",
      ],
      cta: "Upgrade para Enterprise",
      highlighted: false,
      plan: "enterprise" as const,
    },
  ];

  const handleUpgrade = (planName: string) => {
    if (!isAuthenticated) {
      navigate("/");
      toast.error("Faça login para fazer upgrade");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Planos Transparentes
          </h1>
          <p className="text-xl text-slate-400">
            Escolha o plano perfeito para suas necessidades de conformidade
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-8 transition-all duration-300 ${
                plan.highlighted
                  ? "border-cyan-500 bg-gradient-to-b from-cyan-950 to-slate-900 ring-2 ring-cyan-500 scale-105"
                  : "border-slate-700 bg-slate-900 hover:border-slate-600"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-400">/{plan.period}</span>
                </div>
                <p className="text-cyan-400 font-semibold mt-2">{plan.scans}</p>
              </div>

              <Button
                onClick={() => handleUpgrade(plan.plan)}
                disabled={createCheckout.isPending}
                className={`w-full mb-6 ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                {createCheckout.isPending ? "Processando..." : plan.cta}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-2">
                Posso cancelar minha subscrição a qualquer momento?
              </h3>
              <p className="text-slate-400">
                Sim, você pode cancelar sua subscrição a qualquer momento sem
                penalidades. Seu acesso continuará até o final do período de
                faturamento.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                Qual é a diferença entre Pro e Enterprise?
              </h3>
              <p className="text-slate-400">
                O plano Enterprise inclui acesso à API, webhooks customizados,
                suporte prioritário e SLA garantido. Ideal para grandes
                organizações com necessidades avançadas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                Posso fazer upgrade ou downgrade de plano?
              </h3>
              <p className="text-slate-400">
                Sim, você pode mudar de plano a qualquer momento. As alterações
                serão refletidas no próximo ciclo de faturamento.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                Vocês oferecem desconto para pagamento anual?
              </h3>
              <p className="text-slate-400">
                Entre em contato com nosso time de vendas para discutir planos
                customizados e descontos para compromissos anuais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
