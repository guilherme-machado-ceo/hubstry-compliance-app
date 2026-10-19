import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Plus, BarChart3, AlertCircle, CheckCircle, Loader2, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [urlInput, setUrlInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanningUrl, setScanningUrl] = useState("");
  const [scanningAuditId, setScanningAuditId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Fetch user's audits
  const { data: audits, isLoading: auditLoading, refetch } = trpc.audits.list.useQuery();
  const { data: subscription } = trpc.subscription.get.useQuery();

  // Create new audit mutation
  const createAudit = trpc.audits.create.useMutation({
    onError: (error) => {
      setIsScanning(false);
      setScanningUrl("");
      toast.error(error.message || "Erro ao iniciar auditoria");
    },
  });

  // Hooks precisam rodar antes de qualquer return condicional (React #310)
  const hasPending = audits?.some((a) => a.status === "pending");
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [hasPending, refetch]);

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

  const pollStatus = async (auditId: number) => {
    const MAX_ATTEMPTS = 30;
    const INTERVAL_MS = 2000;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
      try {
        const status = await utils.audits.status.fetch({ id: auditId });

        if (status.status === "completed") {
          setIsScanning(false);
          setScanningUrl("");
          setScanningAuditId(null);
          navigate(`/audit/${auditId}`);
          return;
        }

        if (status.status === "failed") {
          setIsScanning(false);
          setScanningUrl("");
          setScanningAuditId(null);
          refetch();
          toast.error("Análise falhou. Tente novamente.");
          return;
        }
      } catch {
        // Network hiccup during poll — continue
      }
    }

    setIsScanning(false);
    setScanningUrl("");
    setScanningAuditId(null);
    refetch();
    toast.error("Tempo limite atingido. Tente novamente.");
  };

  const handleScan = async () => {
    if (!urlInput.trim()) {
      toast.error("Por favor, insira uma URL válida");
      return;
    }

    try {
      new URL(urlInput);
    } catch {
      toast.error("URL inválida. Use https://exemplo.com");
      return;
    }

    const currentUrl = urlInput;
    setIsScanning(true);
    setScanningUrl(currentUrl);
    setUrlInput("");

    try {
      const result = await createAudit.mutateAsync({ url: currentUrl });
      // O servidor devolve o estado final; se ele não pôde ser confirmado
      // (`pending`), o polling consulta o status até a confirmação.
      if (result.status === "completed") {
        setIsScanning(false);
        setScanningUrl("");
        navigate(`/audit/${result.auditId}`);
        return;
      }
      if (result.status === "failed") {
        setIsScanning(false);
        setScanningUrl("");
        refetch();
        toast.error("Análise falhou. Tente novamente.");
        return;
      }
      setScanningAuditId(result.auditId);
      refetch();
      void pollStatus(result.auditId);
    } catch {
      // handled by onError
    }
  };

  // Limite real do plano (o backend aplica: -1 = ilimitado)
  const isUnlimited = subscription?.scansPerMonth === -1;
  const scansRemaining = subscription && !isUnlimited
    ? Math.max(0, subscription.scansPerMonth - subscription.scansUsedThisMonth)
    : 0;
  const limitReached = !!subscription && !isUnlimited && scansRemaining <= 0;
  const planLabel = subscription
    ? { free: "Free", pro: "Pro", enterprise: "Enterprise" }[subscription.plan] ?? subscription.plan
    : "";

  const statusStyle: Record<string, { label: string; color: string }> = {
    completed: { label: "Concluída", color: "#00FFFF" },
    failed: { label: "Erro", color: "#FF6605" },
    pending: { label: "Processando", color: "#E8B931" },
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-10">
        <header>
          <h1 className="hb-display text-3xl sm:text-4xl font-bold">Auditorias</h1>
          <p className="text-muted-foreground mt-2">
            Triagem automática do HTML inicial dos sites. Os achados indicam pontos para revisão humana.
          </p>
        </header>

        {/* Plano e saldo */}
        <section className="flex flex-wrap items-center justify-between gap-4 border border-border rounded-lg px-6 py-5">
          <div>
            <p className="font-semibold">Plano {planLabel}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {isUnlimited
                ? "Análises ilimitadas"
                : `${scansRemaining} ${scansRemaining === 1 ? "análise restante" : "análises restantes"} este mês. O saldo reinicia no dia 1º.`}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/pricing")}>Ver planos</Button>
        </section>

        {/* Nova análise */}
        <section aria-labelledby="nova-analise">
          <h2 id="nova-analise" className="text-xl font-semibold mb-4">Nova análise</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="https://seu-site.com"
              aria-label="Endereço do site"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              disabled={isScanning || limitReached}
              className="flex-1 h-11"
            />
            <Button onClick={handleScan} disabled={isScanning || limitReached} className="h-11 px-6 font-semibold">
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Analisar
                </>
              )}
            </Button>
          </div>
          {isScanning && (
            <p className="text-sm text-muted-foreground mt-3">
              Analisando {scanningUrl || "o site"}. Isso pode levar até 30 segundos.
            </p>
          )}
          {limitReached && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border rounded-lg p-4" style={{ borderColor: "#FF6605" }}>
              <p className="text-sm">
                Você usou todas as análises do mês. O saldo reinicia no dia 1º, ou mude de plano agora.
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
                <Zap className="w-4 h-4 mr-1" />
                Ver planos
              </Button>
            </div>
          )}
        </section>

        {/* Histórico */}
        <section aria-labelledby="historico">
          <h2 id="historico" className="text-xl font-semibold mb-4">Histórico</h2>
          {auditLoading ? (
            <p className="text-muted-foreground py-8">Carregando auditorias…</p>
          ) : audits && audits.length > 0 ? (
            <ul className="border border-border rounded-lg divide-y divide-border">
              {audits.map((audit) => {
                const st = statusStyle[audit.status] ?? statusStyle["pending"]!;
                return (
                  <li key={audit.id}>
                    <button
                      className="w-full text-left px-6 py-5 flex flex-wrap items-center justify-between gap-4 hover:bg-accent/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#00FFFF]"
                      onClick={() => navigate(`/audit/${audit.id}`)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold truncate">{audit.domain}</span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full" style={{ background: st.color }} />
                            {st.label}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1 truncate">{audit.url}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        {audit.status === "completed" && (
                          <>
                            <span className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-muted-foreground" />
                              Score {audit.complianceScore}%
                            </span>
                            <span className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-muted-foreground" />
                              {audit.totalViolations} {audit.totalViolations === 1 ? "achado" : "achados"}
                            </span>
                          </>
                        )}
                        <span className="text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-10 text-center">
              <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Nenhuma auditoria ainda</p>
              <p className="text-muted-foreground text-sm mt-1">Cole o endereço de um site acima para fazer a primeira análise.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
