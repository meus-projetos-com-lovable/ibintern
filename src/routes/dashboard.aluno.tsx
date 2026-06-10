import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentDropzone } from "@/components/document-dropzone";
import { CheckCircle2, Circle, Clock, FileText, AlertTriangle, Plus, Send, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/aluno")({
  head: () => ({
    meta: [
      { title: "Painel do Aluno — Ibmec Estágios" },
      { name: "description", content: "Acompanhe a timeline do seu processo de estágio, envie contratos e relatórios." },
    ],
  }),
  component: DashboardAluno,
});

function DashboardAluno() {
  const user = useAppStore((s) => s.user);
  const processos = useAppStore((s) => s.processos);
  const iniciarProcesso = useAppStore((s) => s.iniciarProcesso);
  const enviarRelatorio = useAppStore((s) => s.enviarRelatorio);

  const meus = useMemo(
    () => (user ? processos.filter((p) => p.aluno_id === user.id) : []),
    [processos, user]
  );
  const ativo = meus[0];

  const [iniciarOpen, setIniciarOpen] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [tituloRelat, setTituloRelat] = useState("");
  const [arquivoRelat, setArquivoRelat] = useState<File | null>(null);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        <PageHeader
          title="Meu Estágio"
          description="Acompanhe cada etapa do seu processo e envie documentos quando necessário."
          action={
            !ativo && (
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
                      <Label>Termo de Compromisso (TCE)</Label>
                      <div className="mt-2">
                        <DocumentDropzone onFile={setArquivo} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIniciarOpen(false)}>Cancelar</Button>
                    <Button
                      onClick={() => {
                        if (!empresa || !arquivo || !user) {
                          toast.error("Preencha a empresa e anexe o contrato.");
                          return;
                        }
                        iniciarProcesso(user.id, empresa, arquivo.name);
                        toast.success("Processo iniciado e contrato enviado para análise.");
                        setIniciarOpen(false); setEmpresa(""); setArquivo(null);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" /> Enviar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )
          }
        />

        {!ativo ? (
          <Card className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold mt-4">Você não possui processos de estágio ativos</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Inicie um novo processo enviando o seu Termo de Compromisso de Estágio.</p>
            <Button onClick={() => setIniciarOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Iniciar Processo</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-75">Estágio em andamento</p>
                    <h2 className="font-display text-2xl font-medium mt-1">{ativo.empresa}</h2>
                    <p className="text-sm opacity-85 mt-1">{ativo.curso} · Processo #{ativo.id}</p>
                  </div>
                  <StatusBadge status={ativo.status} />
                </div>
              </div>
              <div className="p-6">
                <Timeline processo={ativo} />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold">Contrato</h3>
                  <p className="text-xs text-muted-foreground">Termo de Compromisso de Estágio</p>
                </div>
                {ativo.contrato && <StatusBadge status={ativo.contrato.status} />}
              </div>
              {ativo.contrato && (
                <Link
                  to="/dashboard/aluno/contrato/$processoId"
                  params={{ processoId: ativo.id }}
                  className="group flex items-center gap-3 rounded-md border bg-card-alt/40 p-3 hover:bg-accent/40 hover:border-primary/40 transition"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ativo.contrato.nome_arquivo}</p>
                    <p className="text-xs text-muted-foreground">Enviado em {ativo.contrato.data_envio} · clique para ver detalhes</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </Link>
              )}
              {ativo.contrato?.status === "Reprovado" && ativo.contrato.observacoes && (
                <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Reprovado</p>
                  <p className="text-foreground/80 mt-1">{ativo.contrato.observacoes}</p>
                  <Button size="sm" className="mt-3" onClick={() => setIniciarOpen(true)}>Reenviar contrato</Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold">Relatórios de Atividades</h3>
                  <p className="text-xs text-muted-foreground">Entrega obrigatória a cada 6 meses</p>
                </div>
                {ativo.status === "Em Andamento" && (
                  <Dialog open={relatorioOpen} onOpenChange={setRelatorioOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Adicionar Relatório</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Enviar relatório de atividades</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-2">
                        <div>
                          <Label htmlFor="titulo">Título do relatório</Label>
                          <Input id="titulo" value={tituloRelat} onChange={(e) => setTituloRelat(e.target.value)} placeholder="Ex: Relatório Bimestral 2" />
                        </div>
                        <DocumentDropzone onFile={setArquivoRelat} />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setRelatorioOpen(false)}>Cancelar</Button>
                        <Button onClick={() => {
                          if (!tituloRelat || !arquivoRelat) { toast.error("Preencha o título e anexe o relatório."); return; }
                          enviarRelatorio(ativo.id, tituloRelat, arquivoRelat.name);
                          toast.success("Relatório enviado para análise.");
                          setRelatorioOpen(false); setTituloRelat(""); setArquivoRelat(null);
                        }}><Send className="h-4 w-4 mr-2" /> Enviar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {ativo.relatorios.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum relatório enviado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {ativo.relatorios.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-md border p-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{r.titulo}</p>
                        <p className="text-xs text-muted-foreground">Enviado em {r.data_envio}{r.atraso && " · com atraso"}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-display font-semibold mb-4">Histórico</h3>
              <ul className="space-y-3">
                {ativo.historico.slice().reverse().map((h, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <div className="flex h-2 w-2 mt-1.5 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="font-medium">{h.evento}</p>
                      <p className="text-xs text-muted-foreground">{h.data}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            {meus.length > 1 && (
              <div className="text-center">
                <Link to="/dashboard/aluno" className="text-xs text-muted-foreground">
                  Você tem {meus.length} processos no histórico.
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Timeline({ processo }: { processo: ReturnType<typeof useAppStore.getState>["processos"][number] }) {
  const steps = [
    { key: "criado", label: "Processo iniciado", done: true },
    { key: "contrato", label: "Contrato enviado", done: !!processo.contrato },
    { key: "validacao", label: "Validação da Secretaria", done: processo.contrato?.status === "Aprovado" || processo.contrato?.status === "Reprovado", error: processo.contrato?.status === "Reprovado" },
    { key: "andamento", label: "Estágio em andamento", done: processo.status === "Em Andamento" || processo.status === "Aprovado" },
    { key: "relatorios", label: "Relatórios entregues", done: processo.relatorios.some((r) => r.status === "Aprovado") },
    { key: "concluido", label: "Estágio concluído", done: processo.status === "Aprovado" },
  ];

  return (
    <div>
      <ol className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {steps.map((s, i) => (
          <li key={s.key} className="flex md:flex-col items-start md:items-center gap-2 text-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
              s.error ? "bg-destructive text-destructive-foreground"
              : s.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {s.error ? <AlertTriangle className="h-4 w-4" /> : s.done ? <CheckCircle2 className="h-4 w-4" /> : i === steps.findIndex(x => !x.done) ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            </div>
            <span className={`text-xs ${s.done ? "font-medium text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
