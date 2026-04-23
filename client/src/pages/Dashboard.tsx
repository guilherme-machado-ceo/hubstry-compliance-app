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
      setScanningAuditId(result.auditId);
      refetch();
      void pollStatus(result.auditId);
    } catch {
      // handled by onError
    }
  };

  const hasPending = audits?.some((a) => a.status === "pending");
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [hasPending, refetch]);

  const isPro = subscription?.plan === "pro" || subscription?.plan === "enterprise";

  const scansRemaining = subscription && !isPro
    ? subscription.scansPerMonth - subscription.scansUsedThisMonth
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Auditorias</h1>
          <p className="text-slate-600 mt-2">Gerencie e acompanhe suas auditorias de conformidade</p>
        </div>

        {/* Subscription Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Plano: {subscription?.plan.toUpperCase()}</h3>
              <p className="text-slate-600">
                {isPro
                  ? "Scans ilimitados"
                  : `${scansRemaining} scan${scansRemaining !== 1 ? "s" : ""} restante${scansRemaining !== 1 ? "s" : ""} este mês`}
              </p>
              {!isPro && (
                <p className="text-slate-400 text-xs mt-1">
                  Seus scans reiniciam no dia 1º de cada mês.
                </p>
              )}
            </div>
            <Button variant="outline" onClick={() => navigate("/pricing")}>Gerenciar Plano</Button>
          </div>
        </Card>

        {/* Scanner Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Nova Auditoria</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="https://seu-site.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleScan()}
                disabled={isScanning || (!isPro && scansRemaining <= 0)}
                className="flex-1"
              />
              <Button
                onClick={handleScan}
                disabled={isScanning || (!isPro && scansRemaining <= 0)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Escanear
                  </>
                )}
              </Button>
            </div>
            {isScanning && (
              <p className="text-sm text-slate-500 animate-pulse">
                Analisando {scanningUrl || "o site"}... isso pode levar até 30 segundos
              </p>
            )}
            {!isPro && scansRemaining <= 0 && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div>
                  <p className="text-amber-800 font-medium text-sm">
                    Você atingiu o limite de scans este mês.
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    Reinicia em 1º do próximo mês ou faça upgrade agora.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shrink-0 ml-4"
                  onClick={() => navigate("/pricing")}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Fazer Upgrade
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Audits List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Histórico de Auditorias</h2>
          {auditLoading ? (
            <div className="text-center py-12">
              <div className="animate-pulse">Carregando auditorias...</div>
            </div>
          ) : audits && audits.length > 0 ? (
            <div className="space-y-4">
              {audits.map((audit) => (
                <Card
                  key={audit.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/audit/${audit.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{audit.domain}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            audit.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : audit.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {audit.status === "completed"
                            ? "Concluído"
                            : audit.status === "failed"
                            ? "Erro"
                            : "Processando"}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-3">{audit.url}</p>
                      {audit.status === "completed" && (
                        <div className="flex gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                            <span>Score: {audit.complianceScore}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span>{audit.totalViolations} violações</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600 text-sm">
                        {new Date(audit.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      {audit.status === "completed" && (
                        <div className="mt-2">
                          <Button size="sm" variant="outline">
                            Ver Relatório
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nenhuma auditoria realizada ainda</p>
              <p className="text-slate-500 text-sm">Comece escaneando um site acima</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
