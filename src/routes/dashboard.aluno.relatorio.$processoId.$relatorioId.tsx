import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Calendar, Clock, Loader2, AlertTriangle } from "lucide-react";
import { processos as processosApi } from "@/lib/api/endpoints";
import { RoadmapTimeline } from "@/components/roadmap-timeline";

export const Route = createFileRoute("/dashboard/aluno/relatorio/$processoId/$relatorioId")({
  head: () => ({
    meta: [
      { title: "Relatório — Ibmec Estágios" },
      { name: "description", content: "Detalhes do relatório de atividades de estágio." },
    ],
  }),
  component: RelatorioDetalhe,
});

function RelatorioDetalhe() {
  const { processoId, relatorioId } = Route.useParams();
  const navigate = useNavigate();
  const pid = Number(processoId);
  const ridx = Number(relatorioId); // index in the relatorio array

  const { data: processo, isLoading } = useQuery({
    queryKey: ["processos", "detalhe", pid],
    queryFn: () => processosApi.detalhe(pid),
  });

  const relatorio = processo?.relatorio?.[ridx];

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!processo || !relatorio) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">
          <Card className="p-12 text-center">
            <p className="text-sm text-muted-foreground">Relatório não encontrado.</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/dashboard/aluno" })}>Voltar</Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  const relatorioEvaluations = (relatorio.historico ?? []).map((h) => ({
    id: h.id,
    type: "relatorio" as const,
    title: relatorio.titulo ?? "Relatório de Estágio",
    data_avaliacao: h.data_avaliacao,
    veredito: h.veredito,
    avaliador_nome: h.avaliador_nome,
    observacoes: h.observacoes,
    justificativa: h.justificativa,
  }));

  relatorioEvaluations.push({
    id: -relatorio.id,
    type: "relatorio" as const,
    title: relatorio.titulo ?? "Relatório de Estágio",
    data_avaliacao: relatorio.data_upload ? new Date(relatorio.data_upload).toISOString() : new Date().toISOString(),
    veredito: "sob_analise" as any,
    avaliador_nome: "Coordenação",
    observacoes: (relatorio.status === "aguardando_validacao" || relatorio.status === "pendente" || relatorio.status === "analise_coord")
      ? "O relatório foi enviado e está aguardando validação da Coordenação."
      : "O relatório foi enviado para análise.",
    justificativa: "",
  });

  relatorioEvaluations.sort((a, b) => new Date(b.data_avaliacao).getTime() - new Date(a.data_avaliacao).getTime());

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <Link to="/dashboard/aluno" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Meu Estágio
        </Link>
        <PageHeader
          title={relatorio.titulo ?? "Relatório de Estágio"}
          description={`Processo #${processoId} — ${processo.nome_empresa}`}
          action={<StatusBadge status={relatorio.status} />}
        />

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Report content or placeholder */}
          <Card className="overflow-hidden">
            {relatorio.corpo ? (
              <div className="w-full min-h-[720px] p-8">
                {relatorio.titulo && (
                  <h2 className="font-display text-xl font-semibold mb-4">{relatorio.titulo}</h2>
                )}
                <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap">
                  {relatorio.corpo}
                </div>
              </div>
            ) : (
              <div className="w-full h-[720px] bg-card-alt flex flex-col items-center justify-center text-center p-8">
                <FileText className="h-12 w-12 text-primary/60 mb-4" />
                <p className="font-display font-medium">Relatório de Estágio</p>
                <p className="text-xs text-muted-foreground mt-2">
                  O relatório foi enviado como arquivo. O conteúdo está sendo processado.
                </p>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            {/* Report Data */}
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-3">Dados do relatório</h3>
              <dl className="space-y-3 text-sm">
                <Field icon={Calendar} label="Data de upload" value={relatorio.data_upload} />
                <Field icon={Clock} label="Entrega" value={relatorio.fora_do_prazo ? "⚠️ Fora do prazo" : "Dentro do prazo"} />
                <Field icon={FileText} label="Empresa" value={processo.nome_empresa} />
              </dl>
            </Card>

            {/* Histórico de Avaliação em formato de Roadmap */}
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-sm text-foreground/90 px-1">Histórico de Avaliações</h3>
              <RoadmapTimeline items={relatorioEvaluations} emptyMessage="Nenhuma avaliação para este relatório ainda." />
            </div>

            {/* Reprovado Alert (no historico) */}
            {relatorio.status === "reprovado" && (relatorio.historico ?? []).length === 0 && (
              <Card className="p-5 border-destructive/30 bg-destructive/5">
                <p className="font-medium text-destructive flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" /> Relatório reprovado
                </p>
                <p className="text-sm text-foreground/80 mt-2">
                  Entre em contato com a coordenação para detalhes.
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
