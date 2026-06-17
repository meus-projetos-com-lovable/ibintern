import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentDropzone } from "@/components/document-dropzone";
import { FileText, Plus, Send, Loader2, Upload, CheckCircle2, Clock, XCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { processos as processosApi, contratos as contratosApi, relatorios as relatoriosApi } from "@/lib/api/endpoints";
import { STATUS_PROCESSO_LABEL, STATUS_CONTRATO_LABEL, STATUS_RELATORIO_LABEL } from "@/lib/api/types";
import type { Processo, ProcessoDetail } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/aluno/")({
  head: () => ({
    meta: [
      { title: "Painel do Aluno — Ibmec Estágios" },
      { name: "description", content: "Acompanhe a timeline do seu processo de estágio, envie contratos e relatórios." },
    ],
  }),
  component: DashboardAluno,
});

/* ── Roadmap Steps ──────────────────────────────────────────────── */
const ROADMAP_STEPS = [
  { key: "aberto", label: "Processo Aberto", icon: Clock },
  { key: "contrato_pendente", label: "Contrato Pendente", icon: Upload },
  { key: "em_andamento", label: "Em Andamento", icon: CheckCircle2 },
  { key: "relatorio_pendente", label: "Relatório Pendente", icon: FileText },
  { key: "concluido", label: "Concluído", icon: CheckCircle2 },
] as const;

function getRoadmapIndex(processo: Processo, detalhe?: ProcessoDetail): number {
  if (processo.status === "concluido") {
    return 4;
  }
  if (processo.status === "em_andamento") {
    if (detalhe && detalhe.relatorio && detalhe.relatorio.length > 0) {
      return 3; // Relatório Pendente
    }
    return 2; // Em Andamento
  }
  if (processo.status === "aberto") {
    if (detalhe && detalhe.contrato && detalhe.contrato.length > 0) {
      return 1; // Contrato Pendente
    }
    return 0; // Processo Aberto
  }
  if (processo.status === "reprovado") {
    return 1;
  }
  if (processo.status === "cancelado") {
    return 3;
  }
  return 0;
}

function DashboardAluno() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  // Fetch all processos for the logged-in aluno
  const { data: processosData, isLoading } = useQuery({
    queryKey: ["processos", "meus"],
    queryFn: () => processosApi.listar(),
    enabled: !!user,
  });

  const meus = processosData?.results ?? [];

  const [iniciarOpen, setIniciarOpen] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [secretariaMatricula, setSecretariaMatricula] = useState("");
  const [coordenacaoMatricula, setCoordenacaoMatricula] = useState("");
  const [uploadContratoOpen, setUploadContratoOpen] = useState<number | null>(null);
  const [uploadRelatorioOpen, setUploadRelatorioOpen] = useState<number | null>(null);

  const iniciarProcesso = useMutation({
    mutationFn: (data: { nome_empresa: string; matricula_secretaria: string; matricula_coordenacao: string }) =>
      processosApi.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Processo criado com sucesso.");
      setIniciarOpen(false);
      setEmpresa("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadContrato = useMutation({
    mutationFn: (data: { processoId: number; arquivo: File }) =>
      contratosApi.upload(data.processoId, data.arquivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Contrato enviado e secretaria notificada!");
      setUploadContratoOpen(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadRelatorio = useMutation({
    mutationFn: (data: { processoId: number; arquivo: File }) =>
      relatoriosApi.upload(data.processoId, data.arquivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Relatório enviado e coordenação notificada!");
      setUploadRelatorioOpen(null);
    },
    onError: (err: Error) => toast.error(err.message),
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

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <PageHeader
          title="Meu Estágio"
          description="Acompanhe cada etapa do seu processo e envie documentos quando necessário."
          action={
            meus.length === 0 && (
              <Dialog open={iniciarOpen} onOpenChange={setIniciarOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Iniciar Processo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Iniciar processo de estágio</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="empresa">Nome da empresa concedente</Label>
                      <Input id="empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ex: Petrobras S.A." />
                    </div>
                    <div>
                      <Label htmlFor="secretaria">Matrícula da Secretaria</Label>
                      <Input id="secretaria" value={secretariaMatricula} onChange={(e) => setSecretariaMatricula(e.target.value)} placeholder="Matrícula" />
                    </div>
                    <div>
                      <Label htmlFor="coordenacao">Matrícula da Coordenação</Label>
                      <Input id="coordenacao" value={coordenacaoMatricula} onChange={(e) => setCoordenacaoMatricula(e.target.value)} placeholder="Matrícula" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIniciarOpen(false)}>Cancelar</Button>
                    <Button
                      disabled={iniciarProcesso.isPending}
                      onClick={() => {
                        if (!empresa || !secretariaMatricula || !coordenacaoMatricula) {
                          toast.error("Preencha todos os campos.");
                          return;
                        }
                        iniciarProcesso.mutate({
                          nome_empresa: empresa,
                          matricula_secretaria: secretariaMatricula,
                          matricula_coordenacao: coordenacaoMatricula,
                        });
                      }}
                    >
                      {iniciarProcesso.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      <Send className="h-4 w-4 mr-2" /> Criar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )
          }
        />

        {meus.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold mt-4">Você não possui processos de estágio ativos</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Inicie um novo processo de estágio.</p>
            <Button onClick={() => setIniciarOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Iniciar Processo</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {meus.map((proc) => (
              <ProcessoCard
                key={proc.id}
                processo={proc}
                onUploadContrato={() => setUploadContratoOpen(proc.id)}
                onUploadRelatorio={() => setUploadRelatorioOpen(proc.id)}
              />
            ))}
          </div>
        )}

        {/* Upload Contrato Dialog */}
        <Dialog open={uploadContratoOpen !== null} onOpenChange={() => setUploadContratoOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar Contrato (TCE)</DialogTitle></DialogHeader>
            <DocumentDropzone
              onFile={(file) => {
                if (uploadContratoOpen !== null) {
                  uploadContrato.mutate({ processoId: uploadContratoOpen, arquivo: file });
                }
              }}
            />
            {uploadContrato.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Upload Relatório Dialog */}
        <Dialog open={uploadRelatorioOpen !== null} onOpenChange={() => setUploadRelatorioOpen(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar Relatório de Estágio</DialogTitle></DialogHeader>
            <DocumentDropzone
              onFile={(file) => {
                if (uploadRelatorioOpen !== null) {
                  uploadRelatorio.mutate({ processoId: uploadRelatorioOpen, arquivo: file });
                }
              }}
            />
            {uploadRelatorio.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

/* ── Processo Card with Detail + Roadmap ─────────────────────── */
function ProcessoCard({ processo, onUploadContrato, onUploadRelatorio }: {
  processo: Processo;
  onUploadContrato: () => void;
  onUploadRelatorio: () => void;
}) {
  const { data: detalhe } = useQuery({
    queryKey: ["processos", "detalhe", processo.id],
    queryFn: () => processosApi.detalhe(processo.id),
  });

  const roadmapIdx = getRoadmapIndex(processo, detalhe);
  const isReprovado = processo.status === "reprovado" || processo.status === "cancelado";

  const ultimoContrato = detalhe?.contrato && detalhe.contrato.length > 0
    ? detalhe.contrato[detalhe.contrato.length - 1]
    : null;
  const canUploadContrato = !ultimoContrato || ultimoContrato.status === "reprovado";

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-75">Estágio</p>
            <h2 className="font-display text-2xl font-medium mt-1">{processo.nome_empresa}</h2>
            <p className="text-sm opacity-85 mt-1">Aluno: {processo.matricula_aluno}</p>
          </div>
          <StatusBadge status={processo.status} />
        </div>
      </div>

      {/* Roadmap */}
      <div className="px-6 py-4 border-b bg-card-alt/30">
        <div className="flex items-center gap-1">
          {ROADMAP_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const done = !isReprovado && idx <= roadmapIdx;
            const current = !isReprovado && idx === roadmapIdx;
            return (
              <div key={step.key} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${
                  done ? "text-primary" : isReprovado ? "text-destructive/50" : "text-muted-foreground/50"
                }`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
                    current ? "bg-primary text-primary-foreground" :
                    done ? "bg-primary/15 text-primary" :
                    "bg-muted text-muted-foreground/50"
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden sm:inline whitespace-nowrap">{step.label}</span>
                </div>
                {idx < ROADMAP_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded-full ${
                    done && idx < roadmapIdx ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            );
          })}
          {isReprovado && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15 text-destructive shrink-0">
                <XCircle className="h-3.5 w-3.5" />
              </div>
              <span className="hidden sm:inline">{processo.status === "reprovado" ? "Reprovado" : "Cancelado"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Secretaria</p>
            <p className="font-medium">{processo.matricula_secretaria}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Coordenação</p>
            <p className="font-medium">{processo.matricula_coordenacao}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="font-medium">{STATUS_PROCESSO_LABEL[processo.status] ?? processo.status}</p>
          </div>
        </div>

        {/* Contratos */}
        {detalhe && detalhe.contrato.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contratos</h4>
            <div className="space-y-2">
              {detalhe.contrato.map((c) => (
                <Link
                  key={c.id}
                  to="/dashboard/aluno/contrato/$processoId"
                  params={{ processoId: String(processo.id) }}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary/60" />
                    <div>
                      <p className="text-sm font-medium">{c.nome_empresa ?? processo.nome_empresa}</p>
                      <p className="text-xs text-muted-foreground">{c.data_upload}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Relatórios */}
        {detalhe && detalhe.relatorio.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Relatórios</h4>
            <div className="space-y-2">
              {detalhe.relatorio.map((r, idx) => (
                <Link
                  key={r.id}
                  to="/dashboard/aluno/relatorio/$processoId/$relatorioId"
                  params={{ processoId: String(processo.id), relatorioId: String(idx) }}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary/60" />
                    <div>
                      <p className="text-sm font-medium">{r.titulo ?? `Relatório ${idx + 1}`}</p>
                      <p className="text-xs text-muted-foreground">{r.data_upload}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {(processo.status === "aberto" || processo.status === "reprovado") && canUploadContrato && (
            <Button size="sm" variant="outline" className="gap-2" onClick={onUploadContrato}>
              <Upload className="h-3.5 w-3.5" /> Enviar Contrato
            </Button>
          )}
          {processo.status === "em_andamento" && (
            <Button size="sm" variant="outline" className="gap-2" onClick={onUploadRelatorio}>
              <Upload className="h-3.5 w-3.5" /> Enviar Relatório
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
