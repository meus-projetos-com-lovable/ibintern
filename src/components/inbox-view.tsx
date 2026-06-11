import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle2, XCircle, FileText, Inbox } from "lucide-react";
import { toast } from "sonner";
import type { ProcessoStatus } from "@/lib/mock-data";

interface InboxViewProps {
  title: string;
  description?: string;
  /** If set, only show processes whose contract status is in this list. */
  onlyContratoStatus?: ProcessoStatus[];
  /** Allow user to toggle status filters in the UI (secretaria). */
  showStatusFilter?: boolean;
  /** Whether to render the approve/reprove footer (only for pending items). */
  allowAvaliacao?: boolean;
}

const ALL_STATUS: ProcessoStatus[] = ["Pendente", "Em Andamento", "Aprovado", "Reprovado"];

export function InboxView({
  title,
  description,
  onlyContratoStatus,
  showStatusFilter = false,
  allowAvaliacao = true,
}: InboxViewProps) {
  const processos = useAppStore((s) => s.processos);
  const avaliarContrato = useAppStore((s) => s.avaliarContrato);
  const user = useAppStore((s) => s.user);
  const avaliacoes = useAppStore((s) => s.avaliacoes);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<ProcessoStatus | "Todos">("Todos");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [showJustif, setShowJustif] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [aba, setAba] = useState<"fila" | "log">("fila");

  const meuLog = useMemo(
    () => (user ? avaliacoes.filter((a) => a.avaliador_id === user.id) : []),
    [avaliacoes, user]
  );

  const lista = useMemo(() => {
    return processos.filter((p) => {
      if (!p.contrato) return false;
      if (onlyContratoStatus && !onlyContratoStatus.includes(p.contrato.status)) return false;
      if (showStatusFilter && statusFiltro !== "Todos" && p.contrato.status !== statusFiltro) return false;
      if (busca) {
        const q = busca.toLowerCase();
        if (!p.aluno_nome.toLowerCase().includes(q) && !p.matricula.includes(q)) return false;
      }
      return true;
    });
  }, [processos, busca, statusFiltro, onlyContratoStatus, showStatusFilter]);

  const selecionado = lista.find((p) => p.id === selecionadoId) ?? lista[0];
  const isPendente = selecionado?.contrato?.status === "Pendente";

  return (
    <AppShell>
      <div className="md:h-screen flex flex-col">
        <div className="px-6 lg:px-10 pt-8 pb-4 border-b">
          <PageHeader
            title={title}
            description={description ?? `${lista.length} processo(s) na fila.`}
          />
          {showStatusFilter && (
            <div className="flex flex-wrap gap-2 -mt-4">
              {(["Todos", ...ALL_STATUS] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFiltro(s)}
                  className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                    statusFiltro === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground/70 hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 grid md:grid-cols-[380px_1fr] min-h-0">
          <aside className="border-r flex flex-col min-h-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {lista.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">Nenhum processo na fila</p>
                  <p className="text-xs text-muted-foreground mt-1">Você está em dia.</p>
                </div>
              ) : (
                lista.map((p) => {
                  const active = selecionado?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setSelecionadoId(p.id); setShowJustif(false); setJustificativa(""); }}
                      className={`w-full text-left rounded-lg border p-3 transition-all ${
                        active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{p.aluno_nome}</p>
                        <StatusBadge status={p.contrato?.status ?? "Pendente"} />
                      </div>
                      <p className="text-xs text-muted-foreground">{p.matricula} · {p.curso}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">→ {p.empresa}</p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex flex-col min-h-0 bg-muted/30">
            {!selecionado ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium">Selecione um processo</p>
                  <p className="text-sm text-muted-foreground mt-1">Escolha um item da fila à esquerda para visualizar o contrato.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b bg-card px-6 py-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{selecionado.aluno_nome}</h2>
                    <p className="text-xs text-muted-foreground">{selecionado.matricula} · {selecionado.curso} · {selecionado.empresa}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selecionado.contrato?.status ?? "Pendente"} />
                    <Button variant="outline" size="sm" onClick={() => toast.success("Download iniciado")}>Baixar PDF</Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <Card className="p-0 overflow-hidden max-w-3xl mx-auto">
                    <div className="aspect-[1/1.3] bg-card-alt flex flex-col items-center justify-center text-center p-8 border-b">
                      <FileText className="h-12 w-12 text-primary/60 mb-4" />
                      <p className="font-display font-medium">{selecionado.contrato?.nome_arquivo}</p>
                      <p className="text-xs text-muted-foreground mt-2">Visualização do PDF (demonstração)</p>
                    </div>
                    <div className="p-6 space-y-3 text-sm">
                      <Field label="Empresa" value={selecionado.contrato?.nome_empresa} />
                      <Field label="Data de início" value={selecionado.contrato?.data_inicio} />
                      <Field label="Apólice de seguro" value={selecionado.contrato?.apolice_seguro} />
                      <Field label="Recebido em" value={selecionado.contrato?.data_envio} />
                      {selecionado.contrato?.observacoes && (
                        <Field label="Observações" value={selecionado.contrato.observacoes} />
                      )}
                    </div>
                  </Card>

                  <Card className="p-5 max-w-3xl mx-auto mt-4">
                    <h3 className="font-display font-semibold text-sm mb-3">Histórico de avaliações</h3>
                    {selecionado.historico.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem eventos registrados.</p>
                    ) : (
                      <ol className="relative border-l border-border ml-2 space-y-4">
                        {selecionado.historico.slice().reverse().map((h, i) => {
                          const ev = h.evento.toLowerCase();
                          const isReprov = ev.includes("reprovad");
                          const isAprov = ev.includes("aprovad");
                          const dotClass = isReprov
                            ? "bg-destructive"
                            : isAprov
                              ? "bg-success"
                              : "bg-primary";
                          return (
                            <li key={i} className="ml-4">
                              <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-card ${dotClass}`} />
                              <p className="text-sm font-medium">{h.evento}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{h.data}</p>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </Card>

                  {showJustif && (
                    <Card className="p-4 max-w-3xl mx-auto mt-4 border-destructive/30 bg-destructive/5">
                      <p className="text-sm font-medium mb-2">Justificativa da reprovação</p>
                      <Textarea
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        placeholder="Descreva o que precisa ser corrigido pelo aluno..."
                        rows={3}
                      />
                    </Card>
                  )}
                </div>

                {allowAvaliacao && isPendente && (
                  <div className="sticky bottom-0 border-t bg-card px-6 py-4 flex flex-wrap gap-3 justify-end">
                    {!showJustif ? (
                      <>
                        <Button variant="outline" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/5" onClick={() => setShowJustif(true)}>
                          <XCircle className="h-4 w-4" /> Reprovar / Solicitar Ajuste
                        </Button>
                        <Button
                          className="gap-2"
                          onClick={() => {
                            avaliarContrato(selecionado.id, "Aprovado");
                            toast.success("Contrato aprovado.");
                            setSelecionadoId(null);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Aprovar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => { setShowJustif(false); setJustificativa(""); }}>Cancelar</Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (justificativa.trim().length < 5) { toast.error("Descreva a justificativa."); return; }
                            avaliarContrato(selecionado.id, "Reprovado", justificativa.trim());
                            toast.success("Contrato reprovado e aluno notificado.");
                            setSelecionadoId(null); setShowJustif(false); setJustificativa("");
                          }}
                        >
                          Confirmar Reprovação
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {allowAvaliacao && !isPendente && (
                  <div className="border-t bg-muted/40 px-6 py-3 text-xs text-muted-foreground text-center">
                    Este processo já foi avaliado. Mostrando apenas leitura.
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}
