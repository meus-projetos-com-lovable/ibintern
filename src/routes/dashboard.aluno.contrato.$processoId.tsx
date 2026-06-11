import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, FileText, Download, Building2, Calendar, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const DEMO_PDF = "https://www.africau.edu/images/default/sample.pdf";

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
  const processo = useAppStore((s) => s.processos.find((p) => p.id === processoId));

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const c = processo?.contrato;

  useEffect(() => {
    if (!c || !c.id) return;
    const fetchPdf = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`http://localhost:8000/contrato/${c.id}/download/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Erro ao baixar");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error("Erro ao carregar o PDF:", err);
      }
    };
    fetchPdf();
    return () => {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
    };
  }, [c?.id]);

  const downloadContrato = async () => {
    if (!c) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:8000/contrato/${c.id}/download/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao baixar");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = c.nome_arquivo || "contrato.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download iniciado");
    } catch (err) {
      toast.error("Erro ao baixar o contrato.");
    }
  };

  const eventos = useMemo(() => {
    if (!processo) return [];
    return processo.historico.filter((h) =>
      /contrato/i.test(h.evento) || /aprovad/i.test(h.evento) || /reprovad/i.test(h.evento)
    );
  }, [processo]);

  if (!processo || !c) {
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
          description={c.nome_arquivo}
          action={<StatusBadge status={c.status} />}
        />

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium truncate">{c.nome_arquivo}</span>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={downloadContrato}>
                <Download className="h-3.5 w-3.5" /> Baixar
              </Button>
            </div>
            <iframe
              title="Pré-visualização do contrato"
              src={pdfUrl || DEMO_PDF}
              className="w-full h-[720px] bg-muted"
            />
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-3">Dados do documento</h3>
              <dl className="space-y-3 text-sm">
                <Field icon={Building2} label="Empresa concedente" value={c.nome_empresa ?? processo.empresa} />
                <Field icon={Calendar} label="Data de envio" value={c.data_envio} />
                <Field icon={Calendar} label="Início do estágio" value={c.data_inicio ?? "—"} />
                <Field icon={ShieldCheck} label="Apólice de seguro" value={c.apolice_seguro ?? "—"} />
              </dl>
            </Card>

            {c.status === "Reprovado" && c.observacoes && (
              <Card className="p-5 border-destructive/30 bg-destructive/5">
                <p className="font-medium text-destructive flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4" /> Justificativa da reprovação
                </p>
                <p className="text-sm text-foreground/80 mt-2">{c.observacoes}</p>
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
