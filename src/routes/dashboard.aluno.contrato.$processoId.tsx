import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Building2, Calendar, ShieldCheck, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { processos as processosApi, contratos as contratosApi } from "@/lib/api/endpoints";
import { STATUS_CONTRATO_LABEL } from "@/lib/api/types";
import { toast } from "sonner";
import { RoadmapTimeline } from "@/components/roadmap-timeline";

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

  const contratoAtivo = processo?.contrato && processo.contrato.length > 0
    ? processo.contrato[processo.contrato.length - 1]
    : undefined;

  // Download URL for the latest contrato — now we have the ID
  const { data: downloadUrl } = useQuery({
    queryKey: ["contratos", "download", contratoAtivo?.id],
    queryFn: () => contratosApi.download(contratoAtivo!.id),
    enabled: !!contratoAtivo?.id,
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

  const contractEvaluations = (processo.contrato ?? [])
    .flatMap((c) => {
      const evals = (c.historico ?? []).map((h) => ({
        id: h.id,
        type: "contrato" as const,
        title: c.nome_empresa ?? processo.nome_empresa,
        data_avaliacao: h.data_avaliacao,
        veredito: h.veredito,
        avaliador_nome: h.avaliador_nome,
        observacoes: h.observacoes,
        justificativa: h.justificativa,
      }));

      evals.push({
        id: -c.id,
        type: "contrato" as const,
        title: c.nome_empresa ?? processo.nome_empresa,
        data_avaliacao: c.data_upload ? new Date(c.data_upload).toISOString() : new Date().toISOString(),
        veredito: "sob_analise" as any,
        avaliador_nome: "Secretaria",
        observacoes: (c.status === "pendente" || c.status === "analise_sec")
          ? "O contrato foi enviado e está aguardando validação manual da Secretaria."
          : "O contrato foi enviado para análise.",
        justificativa: "",
      });
      return evals;
    })
    .sort((a, b) => new Date(b.data_avaliacao).getTime() - new Date(a.data_avaliacao).getTime());

  const temInformacoes =
    (contratoAtivo.status !== "pendente" && contratoAtivo.status !== "analise_sec") ||
    contratoAtivo.conflito_grade ||
    contractEvaluations.length > 0;

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

        {temInformacoes ? (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            {/* PDF Preview via iframe */}
            <Card className="overflow-hidden">
              {downloadUrl ? (
                <iframe
                  src={downloadUrl}
                  title="Contrato PDF"
                  className="w-full h-[720px] border-0"
                />
              ) : (
                <div className="w-full h-[720px] bg-card-alt flex flex-col items-center justify-center text-center p-8">
                  <FileText className="h-12 w-12 text-primary/60 mb-4" />
                  <p className="font-display font-medium">Contrato — {contratoAtivo.nome_empresa ?? processo.nome_empresa}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Carregando pré-visualização...
                  </p>
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-4" />
                </div>
              )}
            </Card>

            <div className="space-y-6">
              {/* Contract Data */}
              <Card className="p-5">
                <h3 className="font-display font-semibold mb-3">Informações</h3>
                <dl className="space-y-3 text-sm">
                  <Field icon={Building2} label="Empresa concedente" value={contratoAtivo.nome_empresa ?? processo.nome_empresa} />
                  <Field icon={Calendar} label="Data de upload" value={contratoAtivo.data_upload} />
                  <Field icon={ShieldCheck} label="Conflito de grade" value={contratoAtivo.conflito_grade ? "⚠️ Sim" : "Não"} />
                </dl>
              </Card>

              {/* Download Button */}
              {downloadUrl && (
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = `contrato_${contratoAtivo.id}.pdf`;
                    a.click();
                    toast.success("Download iniciado.");
                  }}
                >
                  <Download className="h-4 w-4" /> Baixar PDF
                </Button>
              )}

              {/* Histórico de Avaliação em formato de Roadmap */}
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-sm text-foreground/90 px-1">Histórico de Avaliações</h3>
                <RoadmapTimeline items={contractEvaluations} emptyMessage="Nenhuma avaliação para este contrato ainda." />
              </div>

              {/* Reprovado Alert (no historico) */}
              {contratoAtivo.status === "reprovado" && (contratoAtivo.historico ?? []).length === 0 && (
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
        ) : (
          <div className="w-full">
            {/* PDF Preview via iframe */}
            <Card className="overflow-hidden">
              {downloadUrl ? (
                <iframe
                  src={downloadUrl}
                  title="Contrato PDF"
                  className="w-full h-[720px] border-0"
                />
              ) : (
                <div className="w-full h-[720px] bg-card-alt flex flex-col items-center justify-center text-center p-8">
                  <FileText className="h-12 w-12 text-primary/60 mb-4" />
                  <p className="font-display font-medium">Contrato — {contratoAtivo.nome_empresa ?? processo.nome_empresa}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Carregando pré-visualização...
                  </p>
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-4" />
                </div>
              )}
            </Card>
          </div>
        )}
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
