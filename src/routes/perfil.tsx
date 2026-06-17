import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Building2,
  IdCard,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  FileText,
  ClipboardList,
  Loader2,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { auth, alunoGrade } from "@/lib/api/endpoints";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LABEL_DIAS: Record<string, string> = {
  segunda: "Segunda-Feira",
  terca: "Terça-Feira",
  quarta: "Quarta-Feira",
  quinta: "Quinta-Feira",
  sexta: "Sexta-Feira",
  sabado: "Sábado",
};

const LABEL_TURNOS: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

const diasSemana = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — Ibmec Estágios" },
      { name: "description", content: "Visualize suas informações de conta na plataforma." },
    ],
  }),
  component: PerfilPage,
});

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="font-display text-base font-semibold mb-3">{title}</h2>
      <div className="divide-y divide-border/60">{children}</div>
    </Card>
  );
}

function PerfilPage() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalGrade, setModalGrade] = useState<Record<string, string[]>>({
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
    sabado: [],
  });

  // Fetch fresh user data from /auth/me/
  const { data: meData, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => auth.me(),
    enabled: !!user,
  });

  // Fetch student grade
  const { data: gradeData, isLoading: gradeLoading } = useQuery({
    queryKey: ["aluno", "grade"],
    queryFn: () => alunoGrade.obter(),
    enabled: !!user && user.role === "aluno",
  });

  const updateGrade = useMutation({
    mutationFn: (slots: { dia: string; turno: string }[]) => alunoGrade.atualizar(slots),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aluno", "grade"] });
      toast.success("Grade horária salva com sucesso!");
      setModalOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar grade horária.");
    }
  });

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  if (!user) return null;

  const nome = meData?.nome ?? user.nome ?? user.username;
  const email = meData?.email ?? user.email;
  const matricula = meData?.matricula ?? user.username;
  const role = user.role;
  const roleLabel = role === "aluno" ? "Aluno" : role === "secretaria" ? "Secretaria" : "Coordenador";

  const openDialog = () => {
    const initial: Record<string, string[]> = {
      segunda: [],
      terca: [],
      quarta: [],
      quinta: [],
      sexta: [],
      sabado: [],
    };
    if (gradeData) {
      gradeData.forEach((slot) => {
        if (initial[slot.dia]) {
          initial[slot.dia].push(slot.turno);
        }
      });
    }
    setModalGrade(initial);
    setModalOpen(true);
  };

  const handleSave = () => {
    const slots: { dia: string; turno: string }[] = [];
    Object.entries(modalGrade).forEach(([dia, turnos]) => {
      const unique = Array.from(new Set(turnos.filter((t) => t !== "")));
      unique.forEach((turno) => {
        slots.push({ dia, turno });
      });
    });
    updateGrade.mutate(slots);
  };

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <PageHeader
          title="Meu Perfil"
          description="Informações da sua conta na plataforma."
        />

        {/* Header card */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 via-card to-card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-display font-semibold shadow-md">
              {nome.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-display text-xl font-semibold">{nome}</h2>
                <Badge variant="secondary">{roleLabel}</Badge>
              </div>
              {email && <p className="text-sm text-muted-foreground">{email}</p>}
            </div>
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <SectionCard title="Informações da Conta">
            <InfoRow icon={IdCard} label="Matrícula" value={matricula} />
            <InfoRow icon={User} label="Nome" value={nome} />
            {email && <InfoRow icon={Mail} label="E-mail" value={email} />}
            <InfoRow icon={GraduationCap} label="Papel" value={roleLabel} />
          </SectionCard>

          <SectionCard title="Ações Rápidas">
            <div className="pt-1 grid gap-2">
              {role === "aluno" && (
                <Button variant="outline" className="justify-start gap-2" asChild>
                  <a href="/dashboard/aluno"><FileText className="h-4 w-4" /> Meus Processos de Estágio</a>
                </Button>
              )}
              {role === "secretaria" && (
                <>
                  <Button variant="outline" className="justify-start gap-2" asChild>
                    <a href="/inbox/avaliador"><ClipboardList className="h-4 w-4" /> Caixa de Entrada de Contratos</a>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" asChild>
                    <a href="/alunos"><User className="h-4 w-4" /> Gestão de Alunos</a>
                  </Button>
                </>
              )}
              {role === "coordenador" && (
                <Button variant="outline" className="justify-start gap-2" asChild>
                  <a href="/inbox/coordenador"><ClipboardList className="h-4 w-4" /> Avaliar Relatórios</a>
                </Button>
              )}
              <Button
                variant="outline"
                className="justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
              >
                <KeyRound className="h-4 w-4" /> Sair da conta
              </Button>
            </div>
          </SectionCard>
        </div>

        {role === "aluno" && (
          <Card className="mt-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> Grade Horária de Aulas
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Informe seus horários de aula para que a secretaria verifique compatibilidade com seu estágio.
                </p>
              </div>
              <Button onClick={openDialog} className="shrink-0 gap-2">
                <Clock className="h-4 w-4" /> Configurar Grade
              </Button>
            </div>

            {gradeLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {diasSemana.map((dia) => {
                  const slots = gradeData?.filter((s) => s.dia === dia) || [];
                  return (
                    <Card key={dia} className="p-4 bg-muted/30 border border-border/50 flex flex-col justify-between min-h-[120px]">
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2">{LABEL_DIAS[dia]}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {slots.length > 0 ? (
                            slots.map((s) => (
                              <Badge key={s.id || s.turno} variant="secondary" className="bg-primary/10 text-primary border-none hover:bg-primary/10 capitalize">
                                {LABEL_TURNOS[s.turno]}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sem aulas</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Configurar Grade Horária</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure os turnos em que você tem aulas para cada dia da semana. Clique no botão <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs border">+</kbd> ao lado do primeiro turno de um dia para adicionar um segundo ou terceiro turno.
              </p>
            </DialogHeader>

            <div className="py-6 space-y-6">
              {diasSemana.map((dia) => {
                const turnos = modalGrade[dia] || [];
                return (
                  <div key={dia} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start pb-4 border-b border-border/40 last:border-0 last:pb-0">
                    <div className="sm:pt-2">
                      <span className="text-sm font-semibold text-foreground">{LABEL_DIAS[dia]}</span>
                    </div>
                    <div className="sm:col-span-3 space-y-2.5">
                      {turnos.length === 0 ? (
                        <div className="flex items-center justify-between py-1 bg-muted/10 rounded-md px-3 border border-dashed border-border/60">
                          <span className="text-xs text-muted-foreground italic">Sem aulas</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
                            onClick={() => {
                              setModalGrade({
                                ...modalGrade,
                                [dia]: [""],
                              });
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar Turno
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {turnos.map((turno, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Select
                                value={turno}
                                onValueChange={(val) => {
                                  const updated = [...turnos];
                                  updated[idx] = val;
                                  setModalGrade({
                                    ...modalGrade,
                                    [dia]: updated,
                                  });
                                }}
                              >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                  <SelectValue placeholder="Selecione o turno" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manha">Manhã</SelectItem>
                                  <SelectItem value="tarde">Tarde</SelectItem>
                                  <SelectItem value="noite">Noite</SelectItem>
                                </SelectContent>
                              </Select>

                              {idx === 0 && turnos.length < 3 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 shrink-0 text-primary hover:text-primary"
                                  onClick={() => {
                                    setModalGrade({
                                      ...modalGrade,
                                      [dia]: [...turnos, ""],
                                    });
                                  }}
                                  title="Adicionar outro turno neste dia"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const updated = turnos.filter((_, i) => i !== idx);
                                  setModalGrade({
                                    ...modalGrade,
                                    [dia]: updated,
                                  });
                                }}
                                title="Remover este turno"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={updateGrade.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateGrade.isPending}
                className="gap-2"
              >
                {updateGrade.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
