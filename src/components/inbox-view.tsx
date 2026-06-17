import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle2, XCircle, FileText, Inbox, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { processos as processosApi, contratos as contratosApi, relatorios as relatoriosApi } from "@/lib/api/endpoints";
import type { Processo, ProcessoDetail, StatusContrato } from "@/lib/api/types";
import { STATUS_PROCESSO_LABEL } from "@/lib/api/types";

interface InboxViewProps {
  title: string;
  description?: string;
  /** If set, only show processes whose status is in this list */
  filterStatus?: string[];
  /** Allow user to toggle status filters in the UI (secretaria). */
  showStatusFilter?: boolean;
  /** Whether to render the approve/reprove footer (only for pending items). */
  allowAvaliacao?: boolean;
}

const ALL_STATUS = ["aberto", "pendente", "em_andamento", "reprovado", "concluido", "cancelado"] as const;

export function InboxView({
  title,
  description,
  filterStatus,
  showStatusFilter = false,
  allowAvaliacao = true,
}: InboxViewProps) {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: processosData, isLoading } = useQuery({
    queryKey: ["processos"],
    queryFn: () => processosApi.listar(),
    enabled: !!user,
  });

  const allProcessos = processosData?.results ?? [];

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("Todos");
  const [selecionadoIdx, setSelecionadoIdx] = useState<number>(0);

  const lista = useMemo(() => {
    return allProcessos.filter((p) => {
      if (filterStatus && !filterStatus.includes(p.status)) return false;
      if (showStatusFilter && statusFiltro !== "Todos" && p.status !== statusFiltro) return false;
      if (busca) {
        const q = busca.toLowerCase();
        if (!p.matricula_aluno.toLowerCase().includes(q) && !p.nome_empresa.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allProcessos, busca, statusFiltro, filterStatus, showStatusFilter]);

  const selecionado = lista[selecionadoIdx] ?? lista[0];

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

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
                  {s === "Todos" ? "Todos" : STATUS_PROCESSO_LABEL[s] ?? s}
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
                  placeholder="Buscar por matrícula ou empresa..."
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
                lista.map((p, idx) => {
                  const active = selecionadoIdx === idx;
                  return (
                    <button
                      key={`${p.id}-${p.matricula_aluno}`}
                      onClick={() => setSelecionadoIdx(idx)}
                      className={`w-full text-left rounded-lg border p-3 transition-all ${
                        active ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{p.nome_empresa}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">Aluno: {p.matricula_aluno}</p>
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
                  <p className="text-sm text-muted-foreground mt-1">Escolha um item da fila à esquerda para visualizar.</p>
                </div>
              </div>
            ) : (
              <ProcessoDetailPanel
                processo={selecionado}
                isSecretaria={user?.role === "secretaria"}
                isCoordenador={user?.role === "coordenador"}
                userId={user?.id ?? 0}
                allowAvaliacao={allowAvaliacao}
              />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

/* ── Detail Panel with iframe + evaluation ──────────────────── */
function ProcessoDetailPanel({
  processo,
  isSecretaria,
  isCoordenador,
  userId,
  allowAvaliacao,
}: {
  processo: Processo;
  isSecretaria: boolean;
  isCoordenador: boolean;
  userId: number;
  allowAvaliacao: boolean;
}) {
  const queryClient = useQueryClient();

  // Fetch processo detail to get contratos/relatorios
  const { data: detalhe, isLoading: detailLoading } = useQuery({
    queryKey: ["processos", "detalhe", processo.id],
    queryFn: () => processosApi.detalhe(processo.id),
    enabled: !!processo.id,
  });

  // Download contrato PDF for iframe
  const contratoAtivo = detalhe?.contrato && detalhe.contrato.length > 0
    ? detalhe.contrato[detalhe.contrato.length - 1]
    : undefined;
  const { data: contratoUrl } = useQuery({
    queryKey: ["contratos", "download", contratoAtivo?.id],
    queryFn: () => contratosApi.download(contratoAtivo!.id),
    enabled: !!contratoAtivo?.id && isSecretaria,
  });

  // Evaluation state
  const [observacoes, setObservacoes] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const avaliarContrato = useMutation({
    mutationFn: (veredito: "aprovado" | "reprovado") =>
      contratosApi.avaliar({
        observacoes,
        veredito,
        avaliador: userId,
        contrato_id: contratoAtivo!.id,
        justificativa: veredito === "reprovado" ? justificativa : undefined,
      }),
    onSuccess: (_, veredito) => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success(`Contrato ${veredito} com sucesso!`);
      setObservacoes("");
      setJustificativa("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const relatorioAtivo = detalhe?.relatorio?.[detalhe.relatorio.length - 1];

  const avaliarRelatorio = useMutation({
    mutationFn: (veredito: "aprovado" | "reprovado") =>
      relatoriosApi.avaliar({
        observacoes,
        veredito,
        avaliador: userId,
        relatorio_id: relatorioAtivo!.id,
        justificativa: veredito === "reprovado" ? justificativa : undefined,
      }),
    onSuccess: (_, veredito) => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success(`Relatório ${veredito} com sucesso!`);
      setObservacoes("");
      setJustificativa("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Determine which evaluation is active
  const canEvalContrato = isSecretaria && contratoAtivo && contratoAtivo.status === "pendente" && allowAvaliacao;
  const canEvalRelatorio = isCoordenador && relatorioAtivo &&
    (relatorioAtivo.status === "aguardando_validacao" || relatorioAtivo.status === "pendente") && allowAvaliacao;

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">{processo.nome_empresa}</h2>
          <p className="text-xs text-muted-foreground">
            Aluno: {processo.matricula_aluno} · Secretaria: {processo.matricula_secretaria} · Coordenação: {processo.matricula_coordenacao}
          </p>
        </div>
        <StatusBadge status={processo.status} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Processo Info */}
            <Card className="p-6">
              <h3 className="font-display font-semibold mb-4">Dados do Processo</h3>
              <div className="space-y-3 text-sm">
                <Field label="Empresa" value={processo.nome_empresa} />
                <Field label="Matrícula do Aluno" value={processo.matricula_aluno} />
                <Field label="Status" value={STATUS_PROCESSO_LABEL[processo.status] ?? processo.status} />
                {detalhe && (
                  <>
                    <Field label="Aluno" value={detalhe.aluno.nome} />
                    <Field label="Secretaria" value={detalhe.secretaria.nome} />
                    <Field label="Coordenação" value={detalhe.coordenacao.nome} />
                  </>
                )}
              </div>
            </Card>

            {/* Dados Extraídos pela IA */}
            {isSecretaria && contratoAtivo && (
              <Card className="p-6 border-primary/20 bg-primary/5">
                <h3 className="font-display font-semibold mb-4 text-primary flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Dados Extraídos pelo Leitor de IA
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <Field label="Razão Social" value={contratoAtivo.nome_empresa ?? undefined} />
                    <Field label="CNPJ da Empresa" value={contratoAtivo.cnpj_empresa ?? undefined} />
                    <Field label="Número da Apólice" value={contratoAtivo.apolice_seguro ?? undefined} />
                    <Field label="Plano de Atividades Anexo?" value={contratoAtivo.plano_atividade ? "Sim" : "Não"} />
                  </div>
                  <div className="space-y-2">
                    <Field label="Data de Início" value={contratoAtivo.data_inicio ?? undefined} />
                    <Field label="Data de Término" value={contratoAtivo.data_termino ?? undefined} />
                    <Field label="Assinatura do Aluno?" value={contratoAtivo.assinatura_aluno ? "Sim" : "Não"} />
                    <Field label="Assinatura da Empresa?" value={contratoAtivo.assinatura_empresa ? "Sim" : "Não"} />
                  </div>
                </div>
              </Card>
            )}

            {/* Document Preview — Secretaria sees contrato, Coordenador sees relatório */}
            {isSecretaria && contratoAtivo && (
              <Card className="overflow-hidden">
                <div className="px-5 py-3 border-b bg-muted/30">
                  <h3 className="font-display text-sm font-semibold">Contrato (TCE) — {contratoAtivo.nome_empresa ?? processo.nome_empresa}</h3>
                  <StatusBadge status={contratoAtivo.status} />
                </div>
                {contratoUrl ? (
                  <iframe
                    src={contratoUrl}
                    title="Contrato PDF"
                    className="w-full h-[500px] border-0"
                  />
                ) : (
                  <div className="w-full h-[300px] flex items-center justify-center bg-card-alt">
                    <div className="text-center">
                      <FileText className="h-10 w-10 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Carregando documento...</p>
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto mt-2" />
                    </div>
                  </div>
                )}
              </Card>
            )}

            {isCoordenador && relatorioAtivo && (
              <Card className="overflow-hidden">
                <div className="px-5 py-3 border-b bg-muted/30">
                  <h3 className="font-display text-sm font-semibold">Relatório de Estágio</h3>
                  <StatusBadge status={relatorioAtivo.status} />
                </div>
                {relatorioAtivo.corpo ? (
                  <div className="p-6 max-h-[500px] overflow-y-auto">
                    {relatorioAtivo.titulo && (
                      <h4 className="font-display font-semibold mb-3">{relatorioAtivo.titulo}</h4>
                    )}
                    <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap">
                      {relatorioAtivo.corpo}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[300px] flex items-center justify-center bg-card-alt">
                    <div className="text-center">
                      <FileText className="h-10 w-10 text-primary/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Relatório enviado como arquivo. Processando...</p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Evaluation Form */}
            {(canEvalContrato || canEvalRelatorio) && (
              <Card className="p-6">
                <h3 className="font-display font-semibold mb-4">
                  {canEvalContrato ? "Avaliar Contrato" : "Avaliar Relatório"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Observações</label>
                    <Textarea
                      placeholder="Descreva suas observações sobre o documento..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Justificativa (obrigatória para reprovação)</label>
                    <Textarea
                      placeholder="Justifique caso reprove o documento..."
                      value={justificativa}
                      onChange={(e) => setJustificativa(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="gap-2 flex-1"
                      disabled={!observacoes.trim() || avaliarContrato.isPending || avaliarRelatorio.isPending}
                      onClick={() => {
                        if (canEvalContrato) avaliarContrato.mutate("aprovado");
                        else avaliarRelatorio.mutate("aprovado");
                      }}
                    >
                      {(avaliarContrato.isPending || avaliarRelatorio.isPending) && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <CheckCircle2 className="h-4 w-4" /> Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      className="gap-2 flex-1"
                      disabled={!observacoes.trim() || !justificativa.trim() || avaliarContrato.isPending || avaliarRelatorio.isPending}
                      onClick={() => {
                        if (canEvalContrato) avaliarContrato.mutate("reprovado");
                        else avaliarRelatorio.mutate("reprovado");
                      }}
                    >
                      <XCircle className="h-4 w-4" /> Reprovar
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
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
