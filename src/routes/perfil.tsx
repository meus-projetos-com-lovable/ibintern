import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { AppShell, PageHeader, StatusBadge } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Building2,
  IdCard,
  GraduationCap,
  Accessibility,
  ShieldCheck,
  KeyRound,
  FileText,
  ClipboardList,
  CalendarClock,
  BookOpen,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — Ibmec Estágios" },
      { name: "description", content: "Visualize e gerencie suas informações pessoais, acadêmicas e institucionais." },
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
  const processos = useAppStore((s) => s.processos);
  const avaliacoes = useAppStore((s) => s.avaliacoes);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  if (!user) return null;

  const roleLabel = user.role === "aluno" ? "Aluno" : user.role === "secretaria" ? "Secretaria" : "Coordenador";
  const meusProcessos = processos.filter((p) => p.aluno_id === user.id);
  const minhasAvaliacoes = avaliacoes.filter((a) => a.avaliador_id === user.id);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <PageHeader
          title="Meu Perfil"
          description="Dados pessoais, acadêmicos e configurações da sua conta."
        />

        {/* Header card */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-primary/5 via-card to-card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-display font-semibold shadow-md">
              {user.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-display text-xl font-semibold">{user.nome}</h2>
                <Badge variant="secondary">{roleLabel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.unidade}</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {user.role === "aluno" && <PerfilAluno user={user} processosCount={meusProcessos.length} />}
          {user.role === "secretaria" && <PerfilSecretaria avaliacoesCount={minhasAvaliacoes.length} />}
          {user.role === "coordenador" && <PerfilCoordenador avaliacoesCount={minhasAvaliacoes.length} />}
        </div>
      </div>
    </AppShell>
  );
}

function PerfilAluno({ user, processosCount }: { user: { nome: string; email: string; unidade: string }; processosCount: number }) {
  // Mock additional academic data
  const dados = {
    matricula: "202300123",
    cpf: "111.222.333-44",
    is_pcd: false,
    curso: "Engenharia de Software",
    periodo: "7º",
    is_ativo: true,
    grade: "Matutino — Seg/Qua/Sex (08:00–12:00)",
    aceite_lgpd: true,
    precisa_redefinir_senha: false,
  };
  return (
    <>
      <SectionCard title="Informações Pessoais">
        <InfoRow icon={User} label="Nome Completo" value={user.nome} />
        <InfoRow icon={IdCard} label="Matrícula" value={dados.matricula} />
        <InfoRow icon={IdCard} label="CPF" value={dados.cpf} />
        <InfoRow icon={Mail} label="E-mail Institucional" value={user.email} />
        <InfoRow icon={Building2} label="Unidade / Campus" value={user.unidade} />
        <InfoRow
          icon={Accessibility}
          label="PCD"
          value={dados.is_pcd ? <Badge variant="secondary">Sim</Badge> : <span className="text-muted-foreground">Não</span>}
        />
      </SectionCard>

      <SectionCard title="Informações Acadêmicas">
        <InfoRow icon={GraduationCap} label="Curso Atual" value={dados.curso} />
        <InfoRow icon={BookOpen} label="Período" value={dados.periodo} />
        <InfoRow
          icon={ShieldCheck}
          label="Status"
          value={<StatusBadge status={dados.is_ativo ? "Aprovado" : "Reprovado"} />}
        />
        <InfoRow icon={CalendarClock} label="Grade Horária" value={dados.grade} />
      </SectionCard>

      <SectionCard title="Status da Conta">
        <InfoRow
          icon={ShieldCheck}
          label="Aceite LGPD / Termos de Uso"
          value={dados.aceite_lgpd ? <Badge className="bg-success text-success-foreground">Aceito</Badge> : <Badge variant="destructive">Pendente</Badge>}
        />
        <InfoRow
          icon={KeyRound}
          label="Redefinição de Senha"
          value={dados.precisa_redefinir_senha ? <Badge variant="destructive">Necessária</Badge> : <span className="text-muted-foreground">Não necessária</span>}
        />
      </SectionCard>

      <SectionCard title="Ações Rápidas">
        <div className="pt-1 grid gap-2">
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/dashboard/aluno"><FileText className="h-4 w-4" /> Meus Processos de Estágio ({processosCount})</a>
          </Button>
          <Button variant="outline" className="justify-start gap-2">
            <CalendarClock className="h-4 w-4" /> Visualizar Grade Horária
          </Button>
          <Button variant="outline" className="justify-start gap-2">
            <KeyRound className="h-4 w-4" /> Atualizar Senha / Aceite LGPD
          </Button>
        </div>
      </SectionCard>
    </>
  );
}

function PerfilCoordenador({ avaliacoesCount }: { avaliacoesCount: number }) {
  const dados = {
    matricula: "FUNC-0421",
    area: "Tecnologia da Informação",
    cursos: ["Engenharia de Software", "Ciência da Computação", "Sistemas de Informação"],
    aceite_lgpd: true,
    precisa_redefinir_senha: false,
  };
  return (
    <>
      <SectionCard title="Informações Pessoais">
        <InfoRow icon={IdCard} label="Matrícula" value={dados.matricula} />
        <InfoRow icon={Mail} label="E-mail Institucional" value="rafael.coord@ibmec.edu.br" />
        <InfoRow icon={Building2} label="Unidade / Campus" value="Ibmec RJ" />
      </SectionCard>

      <SectionCard title="Informações Institucionais">
        <InfoRow icon={Briefcase} label="Área sob Coordenação" value={dados.area} />
        <InfoRow
          icon={GraduationCap}
          label="Cursos Vinculados"
          value={
            <div className="flex flex-wrap gap-1.5 mt-1">
              {dados.cursos.map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
          }
        />
      </SectionCard>

      <SectionCard title="Status da Conta">
        <InfoRow
          icon={ShieldCheck}
          label="Aceite LGPD / Termos de Uso"
          value={dados.aceite_lgpd ? <Badge className="bg-success text-success-foreground">Aceito</Badge> : <Badge variant="destructive">Pendente</Badge>}
        />
        <InfoRow
          icon={KeyRound}
          label="Redefinição de Senha"
          value={dados.precisa_redefinir_senha ? <Badge variant="destructive">Necessária</Badge> : <span className="text-muted-foreground">Não necessária</span>}
        />
      </SectionCard>

      <SectionCard title="Ações Rápidas">
        <div className="pt-1 grid gap-2">
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/inbox/coordenador"><ClipboardList className="h-4 w-4" /> Processos sob Avaliação</a>
          </Button>
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/inbox/coordenador"><FileText className="h-4 w-4" /> Histórico de Avaliações ({avaliacoesCount})</a>
          </Button>
          <Button variant="outline" className="justify-start gap-2">
            <KeyRound className="h-4 w-4" /> Atualizar Senha / Aceite LGPD
          </Button>
        </div>
      </SectionCard>
    </>
  );
}

function PerfilSecretaria({ avaliacoesCount }: { avaliacoesCount: number }) {
  const dados = {
    matricula: "FUNC-0102",
    aceite_lgpd: true,
    precisa_redefinir_senha: false,
  };
  return (
    <>
      <SectionCard title="Informações Pessoais">
        <InfoRow icon={IdCard} label="Matrícula" value={dados.matricula} />
        <InfoRow icon={Mail} label="E-mail Institucional" value="ana.martins@ibmec.edu.br" />
        <InfoRow icon={Building2} label="Unidade / Campus" value="Ibmec RJ" />
      </SectionCard>

      <SectionCard title="Status da Conta">
        <InfoRow
          icon={ShieldCheck}
          label="Aceite LGPD / Termos de Uso"
          value={dados.aceite_lgpd ? <Badge className="bg-success text-success-foreground">Aceito</Badge> : <Badge variant="destructive">Pendente</Badge>}
        />
        <InfoRow
          icon={KeyRound}
          label="Redefinição de Senha"
          value={dados.precisa_redefinir_senha ? <Badge variant="destructive">Necessária</Badge> : <span className="text-muted-foreground">Não necessária</span>}
        />
      </SectionCard>

      <SectionCard title="Ações Rápidas">
        <div className="pt-1 grid gap-2">
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/inbox/avaliador"><ClipboardList className="h-4 w-4" /> Caixa de Entrada de Contratos</a>
          </Button>
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/inbox/avaliador"><FileText className="h-4 w-4" /> Histórico de Contratos Avaliados ({avaliacoesCount})</a>
          </Button>
          <Button variant="outline" className="justify-start gap-2" asChild>
            <a href="/alunos"><User className="h-4 w-4" /> Gestão de Alunos</a>
          </Button>
          <Button variant="outline" className="justify-start gap-2">
            <KeyRound className="h-4 w-4" /> Atualizar Senha / Aceite LGPD
          </Button>
        </div>
      </SectionCard>
    </>
  );
}
