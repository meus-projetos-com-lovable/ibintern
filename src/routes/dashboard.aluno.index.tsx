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
import { FileText, Plus, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { processos as processosApi, contratos as contratosApi } from "@/lib/api/endpoints";
import { STATUS_PROCESSO_LABEL, STATUS_CONTRATO_LABEL } from "@/lib/api/types";
import type { Processo, ProcessoDetail } from "@/lib/api/types";

export const Route = createFileRoute("/dashboard/aluno/")(({
  head: () => ({
    meta: [
      { title: "Painel do Aluno — Ibmec Estágios" },
      { name: "description", content: "Acompanhe a timeline do seu processo de estágio, envie contratos e relatórios." },
    ],
  }),
  component: DashboardAluno,
}));

function DashboardAluno() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();

  // Fetch all processos for the logged-in aluno
  // The backend automatically filters by aluno when the user is not staff
  const { data: processosData, isLoading } = useQuery({
    queryKey: ["processos", "meus"],
    queryFn: () => processosApi.listar(),
    enabled: !!user,
  });

  const meus = processosData?.results ?? [];

  // Fetch detail of the first (active) processo
  const primeiroProcesso = meus[0];
  const { data: ativoDetail } = useQuery({
    queryKey: ["processos", "detalhe", primeiroProcesso?.matricula_aluno],
    queryFn: () => {
      // We need the processo ID — but list view doesn't return it directly.
      // The NestedProcesso inside Aluno has ID, but ProcessoSerializer doesn't.
      // We'll use the list endpoint and need the ID from somewhere.
      // Actually, looking at ProcessoSerializer it doesn't return `id`.
      // We'll need to use ProcessoDetailAPIView which needs the ID.
      // For now, we show list data. Detail will be loaded from Aluno processos.
      return null;
    },
    enabled: false, // Disabled until we have a way to get processo ID
  });

  const [iniciarOpen, setIniciarOpen] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [secretariaMatricula, setSecretariaMatricula] = useState("");
  const [coordenacaoMatricula, setCoordenacaoMatricula] = useState("");

  const iniciarProcesso = useMutation({
    mutationFn: (data: { nome_empresa: string; matricula_secretaria: string; matricula_coordenacao: string }) =>
      processosApi.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Processo criado com sucesso.");
      setIniciarOpen(false);
      setEmpresa("");
      setArquivo(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const uploadContrato = useMutation({
    mutationFn: (data: { processoId: number; arquivo: File }) =>
      contratosApi.upload(data.processoId, data.arquivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Contrato enviado e secretaria notificada!");
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
              <Card key={`${proc.matricula_aluno}-${proc.nome_empresa}`} className="overflow-hidden">
                <div className="p-6 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider opacity-75">Estágio</p>
                      <h2 className="font-display text-2xl font-medium mt-1">{proc.nome_empresa}</h2>
                      <p className="text-sm opacity-85 mt-1">Aluno: {proc.matricula_aluno}</p>
                    </div>
                    <StatusBadge status={proc.status} />
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Secretaria</p>
                      <p className="font-medium">{proc.matricula_secretaria}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Coordenação</p>
                      <p className="font-medium">{proc.matricula_coordenacao}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium">{STATUS_PROCESSO_LABEL[proc.status] ?? proc.status}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
