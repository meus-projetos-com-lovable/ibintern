import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Building2, Calendar, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { processos as processosApi, contratos as contratosApi } from "@/lib/api/endpoints";
import { STATUS_CONTRATO_LABEL } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/aluno/contrato/$processoId")({
  head: () => ({
    meta: [
      { title: "Contrato — Ibmec Estágios" },
      { name: "description", content: "Detalhes do Termo de Compromisso de Estágio." },
    ],
  }),
  component: ContratoDetalhe,
});

function ContratoDetalhe() {
  const { processoId } = Route.useParams();
  const navigate = useNavigate();
  const pid = Number(processoId);

  const { data: processo, isLoading } = useQuery({
    queryKey: ["processos", "detalhe", pid],
    queryFn: () => processosApi.detalhe(pid),
  });

  const contratoAtivo = processo?.contrato?.[0];

  // Download URL for the latest contrato
  const { data: downloadUrl } = useQuery({
    queryKey: ["contratos", "download", contratoAtivo?.nome_empresa],
    queryFn: async () => {
      // We need the contrato ID for download, but NestedContratoSerializer doesn't return it.
      // For now, we'll show an unavailable state.
      return null;
    },
    enabled: false,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!processo || !contratoAtivo) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">
          <Card className="p-12 text-center">
            <p className="text-sm text-muted-foreground">Contrato não encontrado.</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/dashboard/aluno" })}>Voltar</Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <Link to="/dashboard/aluno" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Meu Estágio
        </Link>
        <PageHeader
          title="Termo de Compromisso"
          description={processo.nome_empresa}
          action={<StatusBadge status={contratoAtivo.status} />}
        />

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <Card className="overflow-hidden">
            <div className="w-full h-[720px] bg-card-alt flex flex-col items-center justify-center text-center p-8">
              <FileText className="h-12 w-12 text-primary/60 mb-4" />
              <p className="font-display font-medium">Contrato — {contratoAtivo.nome_empresa ?? processo.nome_empresa}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Use o botão de download para acessar o arquivo PDF
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-3">Dados do contrato</h3>
              <dl className="space-y-3 text-sm">
                <Field icon={Building2} label="Empresa concedente" value={contratoAtivo.nome_empresa ?? processo.nome_empresa} />
                <Field icon={Calendar} label="Data de upload" value={contratoAtivo.data_upload} />
                <Field icon={ShieldCheck} label="Conflito de grade" value={contratoAtivo.conflito_grade ? "⚠️ Sim" : "Não"} />
              </dl>
            </Card>

            {contratoAtivo.status === "reprovado" && (
              <Card className="p-5 border-destructive/30 bg-destructive/5">
                <p className="font-medium text-destructive flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" /> Contrato reprovado
                </p>
                <p className="text-sm text-foreground/80 mt-2">
                  Entre em contato com a secretaria para detalhes.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium truncate">{value}</dd>
      </div>
    </div>
  );
}
