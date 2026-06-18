import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

export interface EvaluationItem {
  id: number;
  type: "contrato" | "relatorio";
  title: string;
  data_avaliacao: string;
  veredito: "aprovado" | "reprovado" | "sob_analise";
  avaliador_nome: string;
  observacoes: string;
  justificativa?: string;
}

interface RoadmapTimelineProps {
  items: EvaluationItem[];
  emptyMessage?: string;
}

export function RoadmapTimeline({ items, emptyMessage = "Nenhuma avaliação registrada ainda." }: RoadmapTimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-card/30 border border-dashed rounded-xl">
        <AlertCircle className="h-5 w-5 text-muted-foreground/60 mb-1" />
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 border-l border-border/60 ml-2.5 space-y-4">
      {items.map((item) => {
        const isApproved = item.veredito === "aprovado";
        const isUnderAnalysis = item.veredito === "sob_analise";
        const dateFormatted = new Date(item.data_avaliacao).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        const Icon = isUnderAnalysis ? Clock : isApproved ? CheckCircle2 : XCircle;

        return (
          <div key={`${item.type}-${item.id}`} className="relative group">
            {/* Timeline Dot/Icon */}
            <div className={`absolute -left-[35px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-xs transition-all ${
              isUnderAnalysis
                ? "border-amber-500 text-amber-500 bg-amber-50/50"
                : isApproved 
                  ? "border-green-500 text-green-600 dark:text-green-500 bg-green-50/50" 
                  : "border-destructive text-destructive bg-destructive/5"
            }`}>
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Content Container */}
            <div className="text-sm">
              {/* Header: Title, Veredito, Evaluator & Date */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-1 leading-none">
                <span className="font-semibold text-foreground font-display text-sm mr-1">
                  {item.title}
                </span>
                
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-semibold capitalize ring-1 ring-inset ${
                  isUnderAnalysis
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/10"
                    : isApproved
                      ? "bg-green-500/10 text-green-700 dark:text-green-400 ring-green-600/10"
                      : "bg-destructive/10 text-destructive ring-destructive/10"
                }`}>
                  {item.veredito === "sob_analise" ? "Sob Análise" : item.veredito}
                </span>

                <span>•</span>
                {isUnderAnalysis ? (
                  <span>Aguardando <strong className="text-foreground/80 font-medium">{item.avaliador_nome}</strong></span>
                ) : (
                  <span>Por <strong className="text-foreground/80 font-medium">{item.avaliador_nome}</strong></span>
                )}
                <span>•</span>
                <span>{isUnderAnalysis ? `Enviado em ${dateFormatted}` : dateFormatted}</span>
              </div>

              {/* Body: Observation & Justification */}
              <div className="space-y-1 pl-0.5">
                {item.observacoes && (
                  <p className="text-foreground/85 text-xs leading-relaxed">{item.observacoes}</p>
                )}

                {item.justificativa && (
                  <p className="text-xs text-destructive/90 leading-relaxed">
                    <span className="font-semibold">Justificativa:</span> {item.justificativa}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
