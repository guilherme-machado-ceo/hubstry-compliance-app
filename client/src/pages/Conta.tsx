import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";

const CONFIRMACAO = "EXCLUIR";

export default function Conta() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const deleteAccount = trpc.gdpr.deleteAccount.useMutation({
    onSuccess: async (data) => {
      setOpen(false);
      utils.auth.me.setData(undefined, null);
      await utils.invalidate();
      toast.success(data.message);
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível excluir a conta. Tente novamente.");
    },
  });

  // Hooks precisam rodar antes de qualquer return condicional (React #310)
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-10">
        <header>
          <h1 className="hb-display text-3xl sm:text-4xl font-bold">Conta</h1>
          <p className="text-muted-foreground mt-2">Dados da sua conta e exclusão.</p>
        </header>

        <section className="border border-border rounded-lg px-6 py-5 space-y-2" aria-labelledby="dados">
          <h2 id="dados" className="text-xl font-semibold">Seus dados</h2>
          <p className="text-sm">
            <span className="text-muted-foreground">Nome: </span>
            {user?.name || "-"}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">E-mail: </span>
            {user?.email || "-"}
          </p>
          <p className="text-sm text-muted-foreground pt-2">
            Saiba como tratamos seus dados na{" "}
            <a className="underline underline-offset-4" href="/privacidade">
              Política de Privacidade
            </a>
            .
          </p>
        </section>

        <section className="border rounded-lg px-6 py-5 space-y-4" style={{ borderColor: "#FF6605" }} aria-labelledby="excluir">
          <h2 id="excluir" className="text-xl font-semibold">Excluir conta</h2>
          <p className="text-sm">
            A exclusão é imediata e não pode ser desfeita. Serão apagados do nosso banco de dados: seu cadastro
            (nome, e-mail e identificador do GitHub), todas as suas auditorias e resultados, e os dados de plano e
            uso.
          </p>
          <p className="text-sm text-muted-foreground">
            A exclusão não remove a autorização concedida ao app na sua conta do GitHub; você pode revogá-la nas
            configurações do GitHub. Registros técnicos de acesso mantidos pelos provedores de infraestrutura seguem
            os prazos descritos na Política de Privacidade.
          </p>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Excluir minha conta
          </Button>
        </section>
      </div>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setTyped("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a conta definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu cadastro, suas auditorias e os dados de uso serão apagados agora. Para confirmar, digite{" "}
              <strong>{CONFIRMACAO}</strong> abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label={`Digite ${CONFIRMACAO} para confirmar`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccount.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={typed.trim() !== CONFIRMACAO || deleteAccount.isPending}
              onClick={() => deleteAccount.mutate()}
            >
              {deleteAccount.isPending ? "Excluindo…" : "Excluir definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
