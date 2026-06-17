import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { auth } from "@/lib/api/endpoints";

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

  // Fetch fresh user data from /auth/me/
  const { data: meData, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => auth.me(),
    enabled: !!user,
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
      </div>
    </AppShell>
  );
}
