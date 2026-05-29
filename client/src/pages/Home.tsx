import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Shield, Zap, BarChart3, Lock, AlertTriangle, Scale, Eye, Fingerprint, Timer } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A]">
        <div className="animate-pulse text-white/70 text-lg">Carregando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const brand = "#5930d5";
  const brandLight = "#7C4DFF";

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/5 backdrop-blur-md bg-[#0A0A1A]/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brand}, ${brandLight})` }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">Hubstry Compliance</span>
              <span className="text-[10px] text-white/40 -mt-1 tracking-wider uppercase">by Hubstry Deep Tech</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => navigate("/pricing")}
            >
              Planos
            </Button>
            <Button
              className="text-white border-0 rounded-lg font-medium"
              style={{ background: `linear-gradient(135deg, ${brand}, ${brandLight})` }}
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20 blur-[120px]" style={{ background: brand }} />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 mb-8">
            <Scale className="w-4 h-4" style={{ color: brandLight }} />
            ECA Digital (Lei 15.211/2025) — Prazo ANPD: janeiro 2027
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            Sua empresa está{" "}
            <span className="inline-block" style={{ background: `linear-gradient(135deg, ${brand}, ${brandLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              em conformidade
            </span>
            <br />
            com a ECA Digital?
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            A Lei 15.211/2025 estabelece 8 obrigações de conformidade para sites e apps.
            Nosso scanner audita automaticamente seu site em 30 segundos e aponta cada violação
            com recomendações claras de correção.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-white text-lg px-8 py-6 rounded-xl border-0 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow"
              style={{ background: `linear-gradient(135deg, ${brand}, ${brandLight})` }}
              onClick={() => (window.location.href = getLoginUrl())}
            >
              <Zap className="w-5 h-5 mr-2" />
              Auditar Meu Site Grátis
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/5 text-lg px-8 py-6 rounded-xl"
              onClick={() => navigate("/pricing")}
            >
              Ver Planos
            </Button>
          </div>

          <p className="text-sm text-white/30 mt-6">
            3 scans gratuitos por mês · Sem cartão de crédito · Resultado em 30 segundos
          </p>
        </div>
      </section>

      {/* 8 Pillars Preview */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">8 Pilares da ECA Digital</h2>
          <p className="text-white/40">Nosso scanner avalia cada pilar automaticamente</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Eye className="w-5 h-5" />, label: "Dark Patterns" },
            { icon: <Zap className="w-5 h-5" />, label: "Autoplay" },
            { icon: <Timer className="w-5 h-5" />, label: "Infinite Scroll" },
            { icon: <BarChart3 className="w-5 h-5" />, label: "Ad Trackers" },
            { icon: <Fingerprint className="w-5 h-5" />, label: "Age Verification" },
            { icon: <Lock className="w-5 h-5" />, label: "Política de Privacidade" },
            { icon: <AlertTriangle className="w-5 h-5" />, label: "Consentimento" },
            { icon: <Shield className="w-5 h-5" />, label: "Acessibilidade" },
          ].map((pillar, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all"
            >
              <div className="text-white/40">{pillar.icon}</div>
              <span className="text-sm text-white/70 font-medium">{pillar.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Por que escolher o Hubstry Compliance?</h2>
          <p className="text-white/40">Ferramenta brasileira, criada por deep tech nacional</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6" />,
              title: "Resultado em 30 Segundos",
              description: "Cole a URL e receba o score de conformidade instantaneamente. Sem configuração, sem espera.",
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: "Foco na ECA Digital",
              description: "Cobertura completa dos 8 pilares da Lei 15.211/2025, com detalhamento por violação e recomendações.",
            },
            {
              icon: <Lock className="w-6 h-6" />,
              title: "100% LGPD Compliant",
              description: "Dados excluídos automaticamente após 90 dias. Sem retenção de HTML. Direito ao esquecimento garantido.",
            },
          ].map((feature, i) => (
            <Card
              key={i}
              className="border border-white/5 bg-white/[0.02] p-8 hover:border-white/10 hover:bg-white/[0.04] transition-all"
            >
              <div className="mb-5" style={{ color: brandLight }}>{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-white/40 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Planos</h2>
          <p className="text-white/40">Comece grátis, upgrade quando precisar</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Free",
              price: "Grátis",
              scans: "3 scans/mês",
              features: ["Análise dos 8 pilares", "Score de conformidade", "Detalhamento de violações"],
            },
            {
              name: "Pro",
              price: "R$ 99",
              period: "/mês",
              scans: "Scans ilimitados",
              features: ["Tudo do Free", "Relatórios PDF", "Histórico completo", "Suporte prioritário"],
              highlighted: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              scans: "Tudo ilimitado",
              features: ["Tudo do Pro", "API REST", "Integração customizada", "Suporte dedicado"],
            },
          ].map((plan, i) => (
            <Card
              key={i}
              className={`p-8 rounded-2xl transition-all ${
                plan.highlighted
                  ? "border-2 shadow-xl"
                  : "border border-white/5 bg-white/[0.02] hover:border-white/10"
              }`}
              style={plan.highlighted ? { borderColor: brand, boxShadow: `0 20px 60px ${brand}33` } : undefined}
            >
              <h3 className="text-lg font-semibold text-white/60 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-white/40 ml-1">{plan.period}</span>}
              </div>
              <p className="text-sm font-medium mb-6" style={{ color: brandLight }}>{plan.scans}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-white/60 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: brandLight }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full rounded-xl border-0 py-5 font-medium ${
                  plan.highlighted ? "text-white" : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
                style={plan.highlighted ? { background: `linear-gradient(135deg, ${brand}, ${brandLight})` } : undefined}
                onClick={() => (window.location.href = getLoginUrl())}
              >
                {plan.highlighted ? "Começar Agora" : "Escolher Plano"}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="rounded-3xl p-12 border border-white/5" style={{ background: `linear-gradient(135deg, ${brand}15, ${brandLight}10)` }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para se proteger?</h2>
          <p className="text-lg text-white/50 mb-8 max-w-xl mx-auto">
            O prazo da ANPD é janeiro de 2027. Não espere a fiscalização chegar.
            Comece a auditoria do seu site agora.
          </p>
          <Button
            size="lg"
            className="text-white text-lg px-10 py-6 rounded-xl border-0 shadow-lg shadow-purple-500/20"
            style={{ background: `linear-gradient(135deg, ${brand}, ${brandLight})` }}
            onClick={() => (window.location.href = getLoginUrl())}
          >
            <Zap className="w-5 h-5 mr-2" />
            Auditoria Gratuita
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brand}, ${brandLight})` }}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-sm">Hubstry Compliance</span>
                <span className="text-white/30 text-xs ml-2">© 2026 Hubstry Deep Tech</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <a href="mailto:guilhermemachado@hubstry.onmicrosoft.com" className="hover:text-white/60 transition">Contato</a>
              <a href="https://hubstry.dev" className="hover:text-white/60 transition" target="_blank" rel="noopener">hubstry.dev</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
