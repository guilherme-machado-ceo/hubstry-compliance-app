import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, AlertCircle, CheckCircle, AlertTriangle, Info, Download, Loader2, Zap, Star } from "lucide-react";
import { useParams } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AuditDetail() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { id } = useParams();

  const auditId = id ? parseInt(id) : null;
  const utils = trpc.useUtils();
  const { data: subscription } = trpc.subscription.get.useQuery();
  const { data: audit, isLoading, refetch } = trpc.audits.get.useQuery(
    { id: auditId! },
    { enabled: !!auditId }
  );

  const isPending = audit?.status === "pending";
  useEffect(() => {
    if (!isPending || !auditId) return;
    const interval = setInterval(async () => {
      const status = await utils.audits.status.fetch({ id: auditId }).catch(() => null);
      if (status && status.status !== "pending") refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [isPending, auditId, utils, refetch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse">Carregando auditoria...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!audit) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Auditoria não encontrada</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (audit.status === "pending") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <h2 className="text-2xl font-bold">Análise em andamento...</h2>
          <p className="text-slate-500">Verificando {audit.url} — isso pode levar até 30 segundos</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (audit.status === "failed") {
    const errorMessage = (audit as Record<string, unknown>)["errorMessage"] as string | null;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-2xl font-bold">Análise falhou</h2>
          {errorMessage && <p className="text-slate-600 max-w-md">{errorMessage}</p>}
          <p className="text-slate-500">Verifique se a URL é válida e acessível.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{audit.domain}</h1>
            <p className="text-slate-600 text-sm mt-1">{audit.url}</p>
          </div>
        </div>

        {/* Score Card */}
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(audit.complianceScore || 0)}`}>
                {audit.complianceScore || 0}%
              </div>
              <p className="text-slate-600 mt-2">Score de Conformidade</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{audit.criticalViolations}</div>
              <p className="text-slate-600 mt-2">Críticas</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{audit.warningViolations}</div>
              <p className="text-slate-600 mt-2">Avisos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{audit.infoViolations}</div>
              <p className="text-slate-600 mt-2">Informações</p>
            </div>
          </div>
        </Card>

        {/* Export & Share */}
        {(() => {
          const plan = subscription?.plan;
          const isPro = plan === "pro" || plan === "enterprise";
          const isEnterprise = plan === "enterprise";
          return (
            <div className="space-y-3">
              <div className="flex gap-3 flex-wrap">
                {isPro ? (
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    onClick={() => toast.info("Exportação de PDF em breve")}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => window.location.assign("/pricing")}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Exportar PDF — disponível no plano Pro
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                      .then(() => toast.success("Link copiado para a área de transferência"))
                      .catch(() => toast.error("Não foi possível copiar o link"));
                  }}
                >
                  Compartilhar Relatório
                </Button>
              </div>

              {isEnterprise && (
                <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-violet-600" />
                    <h4 className="font-semibold text-violet-800">Funcionalidades Enterprise</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-violet-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-violet-500" />
                      <span>API access <span className="text-violet-400 text-xs">(em breve)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-violet-500" />
                      <span>Suporte prioritário <span className="text-violet-400 text-xs">(em breve)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-violet-500" />
                      <span>Webhooks customizados <span className="text-violet-400 text-xs">(em breve)</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-violet-500" />
                      <span>Histórico ilimitado</span>
                    </div>
                  </div>
                </Card>
              )}

              {!isPro && (
                <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-800 text-sm">Desbloqueie recursos avançados</p>
                      <p className="text-blue-600 text-xs mt-0.5">PDF export, histórico completo e muito mais no plano Pro.</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shrink-0 ml-4"
                      onClick={() => window.location.assign("/pricing")}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Ver Planos
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          );
        })()}

        {/* Pillars */}
        {"pillars" in audit && Array.isArray(audit.pillars) && (
          <div>
            <h2 className="text-2xl font-bold mb-6">8 Pilares ECA Digital</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(audit.pillars as Array<{ id: string; name: string; weight: number; passed: boolean; violations: unknown[] }>).map((pillar) => (
                <Card
                  key={pillar.id}
                  className={`p-4 flex flex-col items-center text-center gap-2 border-2 ${
                    pillar.passed ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
                  }`}
                >
                  {pillar.passed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  )}
                  <p className="font-semibold text-xs leading-tight">{pillar.name}</p>
                  <p className="text-xs text-slate-500">
                    {pillar.passed
                      ? "Aprovado"
                      : `${pillar.violations.length} violação${pillar.violations.length !== 1 ? "ões" : ""}`}
                  </p>
                  <p className="text-xs text-slate-400">Peso: {Math.round(pillar.weight * 100)}%</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Violations */}
        {audit.violations && audit.violations.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Violações Encontradas</h2>
            <div className="space-y-4">
              {audit.violations.map((violation: any, i: number) => (
                <Card
                  key={i}
                  className={`p-6 border-l-4 ${getSeverityBg(violation.severity)}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(violation.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{violation.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          violation.severity === "critical"
                            ? "bg-red-200 text-red-800"
                            : violation.severity === "warning"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-blue-200 text-blue-800"
                        }`}>
                          {violation.severity === "critical"
                            ? "Crítica"
                            : violation.severity === "warning"
                            ? "Aviso"
                            : "Informação"}
                        </span>
                      </div>
                      <p className="text-slate-700 mb-3">{violation.description}</p>
                      {violation.recommendation && (
                        <div className="bg-white bg-opacity-50 p-3 rounded border-l-2 border-blue-400">
                          <p className="text-sm font-semibold text-slate-700 mb-1">Recomendação:</p>
                          <p className="text-sm text-slate-600">{violation.recommendation}</p>
                        </div>
                      )}
                      {violation.elementSelector && (
                        <p className="text-xs text-slate-500 mt-3 font-mono">
                          Seletor: {violation.elementSelector}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-semibold">Nenhuma violação encontrada!</p>
            <p className="text-slate-500">Este site está em conformidade com os padrões analisados.</p>
          </Card>
        )}

        {/* Recommendations */}
        <Card className="bg-blue-50 border-blue-200 p-6">
          <h3 className="font-semibold text-lg mb-4">Próximos Passos</h3>
          <ul className="space-y-2 text-slate-700">
            <li className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Revise todas as violações críticas primeiro</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Implemente as recomendações fornecidas</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Execute uma nova auditoria após as correções</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Documente as mudanças para conformidade</span>
            </li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
