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
import { processos as processosApi, contratos as contratosApi } from "@/lib/api/endpoints";
import type { Processo, StatusContrato } from "@/lib/api/types";
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
                      key={`${p.matricula_aluno}-${p.nome_empresa}`}
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
              <>
                <div className="border-b bg-card px-6 py-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{selecionado.nome_empresa}</h2>
                    <p className="text-xs text-muted-foreground">
                      Aluno: {selecionado.matricula_aluno} · Secretaria: {selecionado.matricula_secretaria} · Coordenação: {selecionado.matricula_coordenacao}
                    </p>
                  </div>
                  <StatusBadge status={selecionado.status} />
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <Card className="p-6 max-w-3xl mx-auto">
                    <h3 className="font-display font-semibold mb-4">Dados do Processo</h3>
                    <div className="space-y-3 text-sm">
                      <Field label="Empresa" value={selecionado.nome_empresa} />
                      <Field label="Matrícula do Aluno" value={selecionado.matricula_aluno} />
                      <Field label="Status" value={STATUS_PROCESSO_LABEL[selecionado.status] ?? selecionado.status} />
                      <Field label="Secretaria" value={selecionado.matricula_secretaria} />
                      <Field label="Coordenação" value={selecionado.matricula_coordenacao} />
                    </div>
                  </Card>
                </div>
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
