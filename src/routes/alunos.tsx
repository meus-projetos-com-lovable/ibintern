import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, UserPlus, MoreVertical, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { alunos as alunosApi, processos as processosApi } from "@/lib/api/endpoints";
import type { Aluno, NestedProcesso } from "@/lib/api/types";
import { STATUS_PROCESSO_LABEL } from "@/lib/api/types";
import { RoadmapTimeline } from "@/components/roadmap-timeline";

export const Route = createFileRoute("/alunos")({
  head: () => ({
    meta: [
      { title: "Gestão de Alunos — Ibmec Estágios" },
      { name: "description", content: "Cadastre e gerencie alunos elegíveis para iniciar processos de estágio." },
    ],
  }),
  component: AlunosPage,
});

// Validação CPF (algoritmo Receita Federal)
function validaCPF(cpf: string): boolean {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let d1 = (s * 10) % 11; if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  let d2 = (s * 10) % 11; if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10]);
}

const schema = z.object({
  nome: z.string().min(3, "Nome obrigatório"),
  matricula: z.string().min(4, "Matrícula obrigatória"),
  cpf: z.string().refine(validaCPF, "CPF inválido"),
  curso: z.coerce.number().min(1, "Curso obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha obrigatória (mín. 6 caracteres)"),
  unidade: z.string().min(1, "Unidade obrigatória"),
  periodo: z.coerce.number().min(1).max(10),
});
type FormData = z.infer<typeof schema>;

function AlunosPage() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: alunosData, isLoading } = useQuery({
    queryKey: ["alunos"],
    queryFn: () => alunosApi.listar(),
    enabled: !!user,
  });

  const alunosList: Aluno[] = alunosData?.results ?? [];

  const criarAluno = useMutation({
    mutationFn: alunosApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Aluno cadastrado com sucesso.");
      setOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  const [detalhesAluno, setDetalhesAluno] = useState<Aluno | null>(null);
  const [processosAluno, setProcessosAluno] = useState<NestedProcesso[]>([]);
  const [openProcessos, setOpenProcessos] = useState(false);

  const [selectedProcessoId, setSelectedProcessoId] = useState<number | null>(null);

  const { data: processoDetalhe, isLoading: loadingDetalhe } = useQuery({
    queryKey: ["processos", "detalhe", selectedProcessoId],
    queryFn: () => processosApi.detalhe(selectedProcessoId!),
    enabled: selectedProcessoId !== null,
  });

  const allEvaluations = [
    ...(processoDetalhe?.contrato ?? [])
      .flatMap((c) => {
        const evals = (c.historico ?? []).map((h) => ({
          id: h.id,
          type: "contrato" as const,
          title: `Contrato: ${c.nome_empresa ?? processoDetalhe?.nome_empresa ?? ""}`,
          data_avaliacao: h.data_avaliacao,
          veredito: h.veredito,
          avaliador_nome: h.avaliador_nome,
          observacoes: h.observacoes,
          justificativa: h.justificativa,
        }));
        evals.push({
          id: -c.id,
          type: "contrato" as const,
          title: `Contrato: ${c.nome_empresa ?? processoDetalhe?.nome_empresa ?? ""}`,
          data_avaliacao: c.data_upload ? new Date(c.data_upload).toISOString() : new Date().toISOString(),
          veredito: "sob_analise" as any,
          avaliador_nome: "Secretaria",
          observacoes: (c.status === "pendente" || c.status === "analise_sec")
            ? "O contrato foi enviado e está aguardando validação manual da Secretaria."
            : "O contrato foi enviado para análise.",
          justificativa: "",
        });
        if (c.status === "aprovado") {
          const approvalEval = c.historico?.find((h) => h.veredito === "aprovado");
          const baseDate = approvalEval?.data_avaliacao ?? (c.data_upload ? new Date(c.data_upload).toISOString() : new Date().toISOString());
          const emAndamentoDate = new Date(new Date(baseDate).getTime() + 1000).toISOString();
          evals.push({
            id: 100000 + c.id,
            type: "contrato" as const,
            title: "Em Andamento",
            data_avaliacao: emAndamentoDate,
            veredito: "aprovado" as any,
            avaliador_nome: approvalEval?.avaliador_nome ?? "Secretaria",
            observacoes: "O contrato foi homologado. O estágio agora está em andamento.",
            justificativa: "",
          });
        }
        return evals;
      }),
    ...(processoDetalhe?.relatorio ?? [])
      .flatMap((r, idx) => {
        const evals = (r.historico ?? []).map((h) => ({
          id: h.id,
          type: "relatorio" as const,
          title: `Relatório: ${r.titulo ?? `Relatório ${idx + 1}`}`,
          data_avaliacao: h.data_avaliacao,
          veredito: h.veredito,
          avaliador_nome: h.avaliador_nome,
          observacoes: h.observacoes,
          justificativa: h.justificativa,
        }));
        const isPending = r.status === "aguardando_validacao" || r.status === "pendente" || r.status === "analise_coord";
        evals.push({
          id: -r.id,
          type: "relatorio" as const,
          title: isPending ? "Análise Pendente de Relatório" : `Relatório Enviado: ${r.titulo ?? `Relatório ${idx + 1}`}`,
          data_avaliacao: r.data_upload ? new Date(r.data_upload).toISOString() : new Date().toISOString(),
          veredito: "sob_analise" as any,
          avaliador_nome: "Coordenação",
          observacoes: isPending
            ? "O relatório foi enviado e está aguardando validação da Coordenação."
            : "O relatório foi enviado para análise.",
          justificativa: "",
        });
        return evals;
      }),
  ].sort((a, b) => new Date(b.data_avaliacao).getTime() - new Date(a.data_avaliacao).getTime());

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", matricula: "", cpf: "", curso: 1, email: "", senha: "", unidade: "barra", periodo: 1 },
  });

  const filtrados = alunosList.filter((a) =>
    busca === "" || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.matricula.includes(busca)
  );

  function onSubmit(data: FormData) {
    criarAluno.mutate(data);
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <PageHeader
          title="Gestão de Alunos"
          description="Alunos cadastrados podem iniciar processos de estágio na plataforma."
          action={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Aluno</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar novo aluno</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                  <FieldRow label="Nome completo" error={form.formState.errors.nome?.message}>
                    <Input {...form.register("nome")} />
                  </FieldRow>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldRow label="Matrícula" error={form.formState.errors.matricula?.message}>
                      <Input {...form.register("matricula")} />
                    </FieldRow>
                    <FieldRow label="CPF" error={form.formState.errors.cpf?.message}>
                      <Input {...form.register("cpf")} placeholder="000.000.000-00" />
                    </FieldRow>
                  </div>
                  <FieldRow label="E-mail" error={form.formState.errors.email?.message}>
                    <Input type="email" {...form.register("email")} />
                  </FieldRow>
                  <FieldRow label="Senha inicial" error={form.formState.errors.senha?.message}>
                    <Input type="password" {...form.register("senha")} />
                  </FieldRow>
                  <div className="grid grid-cols-3 gap-3">
                    <FieldRow label="Curso (ID)" error={form.formState.errors.curso?.message}>
                      <Input type="number" {...form.register("curso")} />
                    </FieldRow>
                    <FieldRow label="Período" error={form.formState.errors.periodo?.message}>
                      <Input type="number" min={1} max={10} {...form.register("periodo")} />
                    </FieldRow>
                    <FieldRow label="Unidade" error={form.formState.errors.unidade?.message}>
                      <select {...form.register("unidade")} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                        <option value="barra">Barra</option>
                        <option value="botafogo">Botafogo</option>
                      </select>
                    </FieldRow>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={criarAluno.isPending}>
                      {criarAluno.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Salvar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou matrícula..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-16 px-4">
              <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Nenhum aluno encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Ajuste a busca ou cadastre um novo aluno.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Matrícula</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    <th className="px-4 py-3 font-medium">Processos</th>
                    <th className="px-4 py-3 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((a) => (
                    <tr key={a.matricula} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{a.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.matricula}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.processos?.length ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetalhesAluno(a)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver detalhes do aluno
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const procs = a.processos ?? [];
                                if (procs.length === 0) {
                                  toast.error("Este aluno não possui processos de estágio.");
                                } else if (procs.length === 1) {
                                  setSelectedProcessoId(procs[0].id);
                                } else {
                                  setProcessosAluno(procs);
                                  setOpenProcessos(true);
                                }
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" /> Detalhes do Processo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Dialog: Detalhes do Aluno */}
      <Dialog open={!!detalhesAluno} onOpenChange={() => setDetalhesAluno(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Aluno</DialogTitle>
          </DialogHeader>
          {detalhesAluno && (
            <div className="space-y-3 text-sm py-2">
              <DetailRow label="Nome" value={detalhesAluno.nome} />
              <DetailRow label="Matrícula" value={detalhesAluno.matricula} />
              <DetailRow label="CPF" value={detalhesAluno.cpf} />
              <DetailRow label="E-mail" value={detalhesAluno.email} />
              <DetailRow label="Unidade" value={detalhesAluno.unidade} />
              <DetailRow label="Período" value={String(detalhesAluno.periodo)} />
              <DetailRow label="Ativo" value={detalhesAluno.is_ativo ? "Sim" : "Não"} />
              <DetailRow label="Aceite LGPD" value={detalhesAluno.aceite_lgpd ? "Sim" : "Não"} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Processos do Aluno */}
      <Dialog open={openProcessos} onOpenChange={setOpenProcessos}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Processos do Aluno</DialogTitle>
          </DialogHeader>
          {processosAluno.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhum processo encontrado para este aluno.</p>
          ) : (
            <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
              {processosAluno.map((p) => (
                <Card key={p.id} className="p-4 border">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{p.nome_empresa}</p>
                      <span className="text-xs rounded-full border px-2 py-0.5 bg-muted text-muted-foreground mt-1 inline-block">
                        {STATUS_PROCESSO_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProcessoId(p.id);
                        setOpenProcessos(false);
                      }}
                    >
                      Detalhes do Processo
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes do Processo */}
      <Dialog open={selectedProcessoId !== null} onOpenChange={(open) => { if (!open) setSelectedProcessoId(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalhes do Processo de Estágio</DialogTitle>
          </DialogHeader>
          
          {loadingDetalhe ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : processoDetalhe ? (
            <div className="space-y-6 overflow-y-auto pr-1 text-sm py-2">
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Empresa" value={processoDetalhe.nome_empresa} />
                <DetailRow label="Status" value={STATUS_PROCESSO_LABEL[processoDetalhe.status] ?? processoDetalhe.status} />
                <DetailRow label="Aluno" value={processoDetalhe.aluno.nome} />
                <DetailRow label="Matrícula" value={processoDetalhe.aluno.matricula} />
                <DetailRow label="Secretaria" value={processoDetalhe.secretaria.nome} />
                <DetailRow label="Coordenação" value={processoDetalhe.coordenacao.nome} />
              </div>

              {/* Histórico Geral do Processo (Roadmap) */}
              <div className="border-t pt-4">
                <h4 className="font-display font-semibold text-sm mb-3">Histórico de Avaliações Geral</h4>
                <RoadmapTimeline items={allEvaluations} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Erro ao carregar detalhes do processo.</p>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-dashed pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FieldRow({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}