import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { meuHistorico } from "@/lib/api/endpoints";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader } from "@/components/app-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, FileText, FileCheck, Loader2, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/historico")({
  beforeLoad: () => {
    const user = useAppStore.getState().user;
    if (!user || user.role === "aluno") {
      throw redirect({ to: "/" });
    }
  },
  component: HistoricoPage,
});

function HistoricoPage() {
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [vereditoFiltro, setVereditoFiltro] = useState<string>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["meu-historico", tipoFiltro, vereditoFiltro],
    queryFn: () =>
      meuHistorico.listar({
        tipo: tipoFiltro === "todos" ? undefined : tipoFiltro,
        veredito: vereditoFiltro === "todos" ? undefined : vereditoFiltro,
      }),
  });

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <PageHeader
          title="Meu Histórico"
          description="Registro de todas as avaliações que você realizou."
        />

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 max-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Tipo de Documento
            </label>
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger id="filtro-tipo">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
                <SelectItem value="relatorio">Relatório</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 max-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Veredito
            </label>
            <Select value={vereditoFiltro} onValueChange={setVereditoFiltro}>
              <SelectTrigger id="filtro-veredito">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">Carregando histórico...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!data || data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Nenhuma avaliação encontrada
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Você ainda não realizou nenhuma avaliação
              {tipoFiltro !== "todos" || vereditoFiltro !== "todos"
                ? " com os filtros selecionados"
                : ""}
              .
            </p>
          </div>
        )}

        {/* Timeline */}
        {!isLoading && data && data.length > 0 && (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-6">
              {data.map((item) => {
                const isAprovado = item.veredito === "aprovado";
                const dataFormatada = new Date(item.data_avaliacao).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={`${item.tipo_documento}-${item.id_historico}`} className="relative flex gap-4 pl-0">
                    {/* Ícone do nó da timeline */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                        isAprovado
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-red-500/30 bg-red-500/10 text-red-600"
                      }`}
                    >
                      {isAprovado ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>

                    {/* Card */}
                    <div className="flex-1 rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.tipo_documento === "Contrato" ? (
                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {item.tipo_documento}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              isAprovado
                                ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-700 border border-red-500/20"
                            }`}
                          >
                            {isAprovado ? "Aprovado" : "Reprovado"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {dataFormatada}
                        </span>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm font-medium text-foreground">
                          {item.nome_aluno}
                          <span className="text-muted-foreground font-normal"> — {item.nome_empresa}</span>
                        </p>
                      </div>

                      {item.observacoes && (
                        <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                          {item.observacoes}
                        </p>
                      )}

                      {item.justificativa && (
                        <p className="mt-1.5 text-sm text-muted-foreground italic">
                          Justificativa: {item.justificativa}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
