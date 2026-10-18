import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, AlertCircle, CheckCircle, AlertTriangle, Info, Loader2, Link2 } from "lucide-react";
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
          <p className="text-muted-foreground">Auditoria não encontrada</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Voltar às auditorias
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (audit.status === "pending") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: "#00FFFF" }} />
          <h2 className="text-2xl font-bold">Análise em andamento</h2>
          <p className="text-muted-foreground">Analisando {audit.url}. Isso pode levar até 30 segundos.</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às auditorias
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
          <AlertCircle className="w-12 h-12" style={{ color: "#FF6605" }} />
          <h2 className="text-2xl font-bold">A análise não foi concluída</h2>
          {errorMessage && <p className="text-muted-foreground max-w-md">{errorMessage}</p>}
          <p className="text-muted-foreground">Confira se o endereço está correto e se a página é pública, e tente de novo.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às auditorias
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Paleta Hubstry: ciano = observado; âmbar = atenção; laranja = revisão prioritária
  const SEVERITY: Record<string, { label: string; color: string; Icon: typeof Info }> = {
    critical: { label: "Crítico", color: "#FF6605", Icon: AlertCircle },
    warning: { label: "Atenção", color: "#E8B931", Icon: AlertTriangle },
    info: { label: "Informativo", color: "#00FFFF", Icon: Info },
  };
  const scoreColor = (score: number) => (score >= 80 ? "#00FFFF" : score >= 60 ? "#E8B931" : "#FF6605");
  const score = audit.complianceScore || 0;
  const findings = (audit.violations ?? []) as Array<{
    severity: string; title: string; description: string; recommendation?: string | null; elementSelector?: string | null;
  }>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-10">
        <header className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Auditorias
          </Button>
          <div>
            <h1 className="hb-display text-3xl sm:text-4xl font-bold break-all">{audit.domain}</h1>
            <p className="text-muted-foreground text-sm mt-1 break-all">{audit.url}</p>
          </div>
          <p className="text-sm text-muted-foreground border-l-2 pl-3 max-w-[70ch]" style={{ borderColor: "#FF6605" }}>
            Triagem automática do HTML inicial retornado pelo servidor. Os achados indicam pontos para
            revisão humana; este relatório não é parecer jurídico nem atestado de conformidade.
          </p>
        </header>

        {/* Resumo */}
        <section className="grid grid-cols-2 md:grid-cols-4 border border-border rounded-lg divide-x divide-y md:divide-y-0 divide-border">
          <div className="p-6">
            <p className="hb-display text-5xl font-bold" style={{ color: scoreColor(score) }}>{score}%</p>
            <p className="text-muted-foreground text-sm mt-2">Score da triagem</p>
          </div>
          {(["critical", "warning", "info"] as const).map((k) => (
            <div key={k} className="p-6">
              <p className="hb-display text-3xl font-bold" style={{ color: SEVERITY[k]!.color }}>
                {k === "critical" ? audit.criticalViolations : k === "warning" ? audit.warningViolations : audit.infoViolations}
              </p>
              <p className="text-muted-foreground text-sm mt-2">{SEVERITY[k]!.label}</p>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled title="Exportação em PDF ainda não disponível">
            Exportar PDF (em breve)
          </Button>
          <Button
            variant="outline"
            title="O link só abre para quem estiver logado nesta conta"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
                .then(() => toast.success("Link copiado. Ele só abre para quem estiver logado nesta conta."))
                .catch(() => toast.error("Não foi possível copiar o link"));
            }}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Copiar link
          </Button>
        </div>

        {/* Temas */}
        {"pillars" in audit && Array.isArray(audit.pillars) && (
          <section aria-labelledby="temas">
            <h2 id="temas" className="text-xl font-semibold mb-4">Temas da análise</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(audit.pillars as Array<{ id: string; name: string; weight: number; passed: boolean; violations: unknown[] }>).map((pillar) => (
                <li key={pillar.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: pillar.passed ? "#00FFFF" : "#FF6605" }} />
                    <p className="font-medium text-sm">{pillar.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {pillar.passed
                      ? "Sem achados"
                      : `${pillar.violations.length} ${pillar.violations.length === 1 ? "achado" : "achados"}`}
                    , peso {Math.round(pillar.weight * 100)}%
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Achados */}
        <section aria-labelledby="achados">
          <h2 id="achados" className="text-xl font-semibold mb-4">Achados</h2>
          {findings.length > 0 ? (
            <ul className="space-y-4">
              {findings.map((f, i) => {
                const sev = SEVERITY[f.severity] ?? SEVERITY["info"]!;
                return (
                  <li key={i} className="border border-border rounded-lg p-6 border-l-4" style={{ borderLeftColor: sev.color }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <sev.Icon className="w-5 h-5 shrink-0" style={{ color: sev.color }} />
                        {f.title}
                      </h3>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full border" style={{ borderColor: sev.color, color: sev.color }}>
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-3 leading-relaxed">{f.description}</p>
                    {f.recommendation && (
                      <div className="mt-4 border-l-2 pl-4" style={{ borderColor: "#00FFFF" }}>
                        <p className="text-sm font-semibold">Recomendação</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.recommendation}</p>
                      </div>
                    )}
                    {f.elementSelector && (
                      <p className="text-xs text-muted-foreground mt-3">Seletor: <code>{f.elementSelector}</code></p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-10 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#00FFFF" }} />
              <p className="font-medium">Nenhum ponto de atenção encontrado na análise automática</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-[60ch] mx-auto">
                Isso não equivale a um atestado de conformidade: a triagem cobre apenas o HTML inicial
                e os temas listados acima.
              </p>
            </div>
          )}
        </section>

        {/* Próximos passos — sequência real */}
        <section aria-labelledby="proximos" className="border border-border rounded-lg p-6">
          <h2 id="proximos" className="text-xl font-semibold mb-4">Próximos passos</h2>
          <ol className="space-y-2 text-muted-foreground list-decimal pl-5">
            <li>Revise primeiro os achados marcados como críticos.</li>
            <li>Avalie cada achado no contexto do seu serviço, com apoio jurídico quando necessário.</li>
            <li>Aplique as correções que fizerem sentido.</li>
            <li>Faça uma nova análise para conferir o resultado.</li>
          </ol>
        </section>
      </div>
    </DashboardLayout>
  );
}
