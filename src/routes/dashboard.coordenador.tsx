import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Loader2, Users, TrendingUp, Clock } from "lucide-react";
import { alunos as alunosApi, processos as processosApi } from "@/lib/api/endpoints";

export const Route = createFileRoute("/dashboard/coordenador")({
  head: () => ({
    meta: [
      { title: "Dashboards — Coordenação" },
      {
        name: "description",
        content: "Indicadores de desempenho da coordenação de estágios.",
      },
    ],
  }),
  component: DashboardCoordenador,
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const labels: Record<number, string> = {
    1: "1º", 2: "2º", 3: "3º", 4: "4º", 5: "5º",
    6: "6º", 7: "7º", 8: "8º", 9: "9º", 10: "10º",
  };
  return labels[n] ?? `${n}º`;
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function formatDuration(totalDays: number): string {
  if (totalDays <= 0) return "—";
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  if (months === 0) return `${days}d`;
  if (days === 0) return `${months} mes${months > 1 ? "es" : ""}`;
  return `${months} mes${months > 1 ? "es" : ""} e ${days}d`;
}

// ── Main Component ─────────────────────────────────────────────────────────────

function DashboardCoordenador() {
  const user = useAppStore((s) => s.user);

  // 1. Load all students (single page — backend returns all for coordenador)
  const { data: alunosData, isLoading: loadingAlunos } = useQuery({
    queryKey: ["alunos", "dashboard"],
    queryFn: () => alunosApi.listar(),
    enabled: !!user,
  });

  // 2. Load all processos
  const { data: processosData, isLoading: loadingProcessos } = useQuery({
    queryKey: ["processos", "dashboard"],
    queryFn: () => processosApi.listar(),
    enabled: !!user,
  });

  const allAlunos = alunosData?.results ?? [];
  const allProcessos = processosData?.results ?? [];

  // 3. Load details for processos em_andamento or concluido (for contract durations)
  const processoIdsForDetail = useMemo(
    () =>
      allProcessos
        .filter((p) => p.status === "em_andamento" || p.status === "concluido")
        .map((p) => p.id),
    [allProcessos],
  );

  const detalheQueries = useQueries({
    queries: processoIdsForDetail.map((id) => ({
      queryKey: ["processos", "detalhe", id, "dashboard"],
      queryFn: () => processosApi.detalhe(id),
      enabled: processoIdsForDetail.length > 0,
    })),
  });

  const loadingDetalhes =
    processoIdsForDetail.length > 0 &&
    detalheQueries.some((q) => q.isLoading);

  // ── Metric 1: % alunos estagiando ──────────────────────────────────────────
  // Numerador : alunos da área do coordenador com processo em_andamento
  // Denominador: VITE_NUMERO_TOTAL_CURSO (total do curso ≥ 3º per., sem filtro)
  //              → fallback para o total filtrado da API se a env não estiver configurada

  const totalCursoEnv = parseInt(
    import.meta.env.VITE_NUMERO_TOTAL_CURSO ?? "0",
    10,
  );

  const { alunosElegiveis, alunosEstagiando, percentEstagiando } =
    useMemo(() => {
      // Numerador: todos os alunos da área do coordenador com processo em_andamento
      const estagiando = allAlunos.filter((a) =>
        (a.processos ?? []).some((p) => p.status === "em_andamento"),
      );

      // Denominador: env var se configurada (> 0), senão conta os elegíveis da API
      const elegiveis =
        totalCursoEnv > 0
          ? totalCursoEnv
          : allAlunos.filter((a) => a.periodo >= 3).length;

      const pct =
        elegiveis > 0 ? Math.round((estagiando.length / elegiveis) * 100) : 0;

      return {
        alunosElegiveis: elegiveis,
        alunosEstagiando: estagiando.length,
        percentEstagiando: pct,
      };
    }, [allAlunos, totalCursoEnv]);


  // ── Metric 2: Período mais comum de início ────────────────────────────────

  const { periodoMaisComum, periodoCounts } = useMemo(() => {
    const counts: Record<number, number> = {};
    allAlunos.forEach((a) => {
      if ((a.processos ?? []).some((p) => p.status === "em_andamento")) {
        counts[a.periodo] = (counts[a.periodo] ?? 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return {
      periodoMaisComum: sorted.length > 0 ? Number(sorted[0][0]) : null,
      periodoCounts: sorted.map(([p, n]) => ({ periodo: Number(p), count: n })),
    };
  }, [allAlunos]);

  // ── Metric 3: Tempo médio de contrato ─────────────────────────────────────

  const { avgDays, contractCount } = useMemo(() => {
    const durations: number[] = [];
    detalheQueries.forEach((q) => {
      if (!q.data) return;
      q.data.contrato.forEach((c) => {
        if (c.data_inicio && c.data_termino) {
          const d = daysBetween(c.data_inicio, c.data_termino);
          if (d > 0) durations.push(d);
        }
      });
    });
    const avg =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
    return { avgDays: avg, contractCount: durations.length };
  }, [detalheQueries]);

  const isLoading = loadingAlunos || loadingProcessos || loadingDetalhes;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <PageHeader
          title="Dashboards"
          description="Indicadores da coordenação de estágios."
        />

        {/* ── Grid de métricas ─────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Bloco 1 – % Estagiando */}
          <MetricCard
            icon={<Users className="h-4 w-4" />}
            label="Alunos Estagiando"
            sublabel="a partir do 3º período"
          >
            <div className="mt-4 space-y-3">
              <div className="flex items-end gap-2">
                <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
                  {percentEstagiando}%
                </span>
                <span className="text-sm text-muted-foreground pb-1">
                  ({alunosEstagiando}/{alunosElegiveis})
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${percentEstagiando}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {alunosElegiveis} alunos elegíveis no total
              </p>
            </div>
          </MetricCard>

          {/* Bloco 2 – Período mais comum */}
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Período de Início Mais Comum"
            sublabel="entre alunos em estágio ativo"
          >
            <div className="mt-4 space-y-3">
              {periodoMaisComum !== null ? (
                <>
                  <div className="flex items-end gap-2">
                    <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
                      {ordinal(periodoMaisComum)}
                    </span>
                    <span className="text-sm text-muted-foreground pb-1">
                      período
                    </span>
                  </div>

                  {/* Mini bar chart */}
                  {periodoCounts.length > 1 && (
                    <div className="flex items-end gap-1 h-10">
                      {periodoCounts.slice(0, 6).map(({ periodo, count }) => {
                        const maxCount = periodoCounts[0].count;
                        const height = Math.max(
                          8,
                          Math.round((count / maxCount) * 40),
                        );
                        const isTop = periodo === periodoMaisComum;
                        return (
                          <div
                            key={periodo}
                            className="flex-1 flex flex-col items-center gap-0.5"
                            title={`${ordinal(periodo)} per.: ${count}`}
                          >
                            <div
                              className={`w-full rounded-sm transition-all ${isTop ? "bg-primary" : "bg-muted-foreground/20"}`}
                              style={{ height }}
                            />
                            <span className="text-[9px] text-muted-foreground">
                              {ordinal(periodo)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {periodoCounts[0]?.count ?? 0} aluno
                    {(periodoCounts[0]?.count ?? 0) !== 1 ? "s" : ""} iniciaram
                    neste período
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-4">
                  Sem dados disponíveis
                </p>
              )}
            </div>
          </MetricCard>

          {/* Bloco 3 – Tempo médio de contrato */}
          <MetricCard
            icon={<Clock className="h-4 w-4" />}
            label="Duração Média de Contrato"
            sublabel="com data de início e término"
          >
            <div className="mt-4 space-y-3">
              {contractCount > 0 ? (
                <>
                  <div className="flex items-end gap-2">
                    <span className="font-display text-4xl font-semibold tracking-tight text-foreground">
                      {formatDuration(avgDays)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    {/* Visual: fill proportional to 12 months max */}
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.round((avgDays / 365) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    baseado em {contractCount} contrato
                    {contractCount !== 1 ? "s" : ""} com vigência definida
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-4">
                  Sem contratos com vigência registrada
                </p>
              )}
            </div>
          </MetricCard>
        </div>
      </div>
    </AppShell>
  );
}

// ── MetricCard ─────────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  sublabel,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">
            {label}
          </p>
          {sublabel && (
            <p className="text-[11px] text-muted-foreground truncate">
              {sublabel}
            </p>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}
