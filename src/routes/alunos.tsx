import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Plus, Search, UserPlus, MoreVertical, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import type { Processo } from "@/lib/mock-data";

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
  curso: z.string().min(2, "Curso obrigatório"),
  email: z.string().email("E-mail inválido"),
});
type FormData = z.infer<typeof schema>;

function AlunosPage() {
  const alunos = useAppStore((s) => s.alunos);
  const addAluno = useAppStore((s) => s.addAluno);
  const processos = useAppStore((s) => s.processos);

  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");

  const [detalhesAluno, setDetalhesAluno] = useState<typeof alunos[number] | null>(null);
  const [processosAluno, setProcessosAluno] = useState<Processo[]>([]);
  const [openProcessos, setOpenProcessos] = useState(false);

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nome: "", matricula: "", cpf: "", curso: "", email: "" } });

  const filtrados = useMemo(
    () => alunos.filter((a) =>
      busca === "" || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.matricula.includes(busca)
    ),
    [alunos, busca]
  );

  function onSubmit(data: FormData) {
    const r = addAluno(data);
    if (!r.ok) { toast.error(r.error!); return; }
    toast.success("Aluno cadastrado com sucesso.");
    setOpen(false);
    form.reset();
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
                  <FieldRow label="Curso" error={form.formState.errors.curso?.message}>
                    <Input {...form.register("curso")} />
                  </FieldRow>
                  <FieldRow label="E-mail" error={form.formState.errors.email?.message}>
                    <Input type="email" {...form.register("email")} />
                  </FieldRow>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
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

          {filtrados.length === 0 ? (
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
                    <th className="px-4 py-3 font-medium">Curso</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    <th className="px-4 py-3 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((a) => {
                    const procs = processos.filter((p) => p.aluno_id === a.id);
                    return (
                      <tr key={a.id} className="border-t hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{a.nome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.matricula}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.curso}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
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
                              <DropdownMenuItem onClick={() => { setProcessosAluno(procs); setOpenProcessos(true); }}>
                                <FileText className="mr-2 h-4 w-4" /> Ver processo do aluno
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
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
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{detalhesAluno.nome}</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">Matrícula</span>
                <span className="font-medium">{detalhesAluno.matricula}</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">CPF</span>
                <span className="font-medium">{detalhesAluno.cpf}</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">Curso</span>
                <span className="font-medium">{detalhesAluno.curso}</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-muted-foreground">E-mail</span>
                <span className="font-medium">{detalhesAluno.email}</span>
              </div>
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
                      <p className="font-medium text-sm">{p.empresa}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.matricula} · {p.curso}</p>
                    </div>
                    <span className={`text-xs rounded-full border px-2 py-0.5 ${
                      p.status === "Aprovado" ? "bg-success/10 text-success border-success/30" :
                      p.status === "Reprovado" ? "bg-destructive/10 text-destructive border-destructive/30" :
                      p.status === "Em Andamento" ? "bg-primary/10 text-primary border-primary/30" :
                      "bg-muted text-muted-foreground border-border"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Criado em {p.criado_em}</p>
                  {p.contrato && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Contrato: <span className="font-medium">{p.contrato.nome_arquivo}</span> — {p.contrato.status}
                    </p>
                  )}
                  {p.relatorios.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Relatórios: {p.relatorios.length} enviado(s)
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
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