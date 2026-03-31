import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Shield, Zap, BarChart3, Lock, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Hubstry Compliance
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Entrar
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Conformidade Digital{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Simplificada
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Audite seus sites em busca de violações de LGPD, ECA Digital e padrões de ética digital. Obtenha relatórios detalhados e recomendações de correção em minutos.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-base"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Iniciar Auditoria Grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 hover:bg-slate-800 text-base"
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Por que escolher Hubstry?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-8 h-8" />,
              title: "Análise Rápida",
              description: "Resultados em segundos com detecção automática de violações",
            },
            {
              icon: <Shield className="w-8 h-8" />,
              title: "Conformidade Garantida",
              description: "Cumpra LGPD, ECA Digital e padrões internacionais de privacidade",
            },
            {
              icon: <BarChart3 className="w-8 h-8" />,
              title: "Relatórios Detalhados",
              description: "Visualize violações, elementos problemáticos e recomendações",
            },
            {
              icon: <Lock className="w-8 h-8" />,
              title: "Segurança de Dados",
              description: "Seus dados são criptografados e nunca compartilhados",
            },
            {
              icon: <AlertCircle className="w-8 h-8" />,
              title: "Dark Pattern Detection",
              description: "Identifique padrões enganosos que prejudicam usuários",
            },
            {
              icon: <Check className="w-8 h-8" />,
              title: "Suporte 24/7",
              description: "Equipe especializada pronta para ajudar",
            },
          ].map((feature, i) => (
            <Card
              key={i}
              className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all p-6"
            >
              <div className="text-blue-400 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Planos Transparentes</h2>
        <p className="text-center text-slate-400 mb-16">Escolha o plano ideal para suas necessidades</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              name: "Free",
              price: "Grátis",
              scans: "3 scans/mês",
              features: ["Análise básica", "Relatório em HTML", "Suporte por email"],
            },
            {
              name: "Pro",
              price: "R$ 99",
              period: "/mês",
              scans: "Scans ilimitados",
              features: [
                "Análise completa",
                "Relatórios em PDF",
                "Histórico completo",
                "Prioridade no suporte",
              ],
              highlighted: true,
            },
            {
              name: "Enterprise",
              price: "Customizado",
              scans: "API access",
              features: [
                "Tudo do Pro",
                "API REST",
                "Integração customizada",
                "Suporte dedicado",
              ],
            },
          ].map((plan, i) => (
            <Card
              key={i}
              className={`p-8 border transition-all ${
                plan.highlighted
                  ? "bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20 scale-105"
                  : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
              }`}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-slate-400">{plan.period}</span>}
              </div>
              <p className="text-blue-400 font-semibold mb-6">{plan.scans}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Escolher Plano
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Pronto para auditar seu site?</h2>
        <p className="text-xl text-slate-300 mb-8">Comece gratuitamente e veja como podemos ajudar</p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-base"
          onClick={() => (window.location.href = getLoginUrl())}
        >
          Começar Agora
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Hubstry Compliance</h4>
              <p className="text-slate-400 text-sm">Conformidade digital simplificada</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition">Preços</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition">Termos</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 Hubstry Compliance. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
