import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, FileText, Download, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

const DEMO_PDF = "https://www.africau.edu/images/default/sample.pdf";

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
  const processo = useAppStore((s) => s.processos.find((p) => p.id === processoId));
  const relatorio = processo?.relatorios.find((r) => r.id === relatorioId);

  const eventos = useMemo(() => {
    if (!processo || !relatorio) return [];
    return processo.historico.filter((h) => h.evento.toLowerCase().includes(relatorio.titulo.toLowerCase()) || /relatório/i.test(h.evento));
  }, [processo, relatorio]);

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

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <Link to="/dashboard/aluno" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Meu Estágio
        </Link>
        <PageHeader
          title={relatorio.titulo}
          description={`Relatório de atividades · Processo #${processo.id}`}
          action={<StatusBadge status={relatorio.status} />}
        />

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium truncate">{relatorio.titulo}.pdf</span>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.success("Download iniciado")}>
                <Download className="h-3.5 w-3.5" /> Baixar
              </Button>
            </div>
            <iframe
              title="Pré-visualização do relatório"
              src={DEMO_PDF}
              className="w-full h-[720px] bg-muted"
            />
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-3">Dados do documento</h3>
              <dl className="space-y-3 text-sm">
                <Field icon={Calendar} label="Data de envio" value={relatorio.data_envio} />
                <Field icon={Clock} label="Entrega" value={relatorio.atraso ? "Com atraso" : "No prazo"} />
                <Field icon={FileText} label="Empresa" value={processo.empresa} />
              </dl>
              {relatorio.corpo && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Resumo</p>
                  <p className="text-sm">{relatorio.corpo}</p>
                </div>
              )}
            </Card>

            {relatorio.status === "Reprovado" && (
              <Card className="p-5 border-destructive/30 bg-destructive/5">
                <p className="font-medium text-destructive flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" /> Justificativa da reprovação
                </p>
                <p className="text-sm text-foreground/80 mt-2">
                  {eventos.find((e) => /reprovad/i.test(e.evento))?.evento ?? "Reprovado sem justificativa registrada."}
                </p>
              </Card>
            )}

            <Card className="p-5">
              <h3 className="font-display font-semibold mb-3">Histórico de avaliações</h3>
              {eventos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem registros ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {eventos.slice().reverse().map((h, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <div className="flex h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">{h.evento}</p>
                        <p className="text-xs text-muted-foreground">{h.data}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
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
