import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GraduationCap, Users, ClipboardCheck } from "lucide-react";
import { useAppStore, type Role } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Gestão de Estágios Ibmec" },
      { name: "description", content: "Acesse a plataforma de gestão de estágios do Ibmec para alunos e secretaria." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const user = useAppStore((s) => s.user);
  const login = useAppStore((s) => s.login);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const dest = user.role === "aluno" ? "/dashboard/aluno" : user.role === "coordenador" ? "/inbox/coordenador" : "/inbox/avaliador";
      navigate({ to: dest });
    }
  }, [user, navigate]);

  const handleLogin = (role: Role) => {
    toast.promise(login(role), {
      loading: "Autenticando...",
      success: "Login realizado com sucesso!",
      error: (err) => `Erro no login: ${err.message || "Credenciais inválidas"}`,
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display font-semibold text-lg leading-tight">Ibmec</p>
            <p className="text-sm opacity-80 leading-tight">Gestão de Estágios</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight mb-4">
            Da entrega manual à validação em poucos cliques.
          </h1>
          <p className="text-base opacity-85 leading-relaxed">
            Envie contratos, acompanhe o status em tempo real e elimine a ansiedade
            do processo de estágio. Tudo em conformidade com a Lei 11.788/08.
          </p>
        </div>

        <p className="text-xs opacity-60">© Ibmec · Secretaria Acadêmica</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="font-display text-2xl font-semibold mb-2">Bem-vindo de volta</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Selecione seu perfil para entrar na demonstração da plataforma.
          </p>

          <div className="space-y-3">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => handleLogin("aluno")}
              onKeyDown={(e) => e.key === "Enter" && handleLogin("aluno")}
              className="cursor-pointer p-5 hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Entrar como Aluno</p>
                  <p className="text-xs text-muted-foreground">Acompanhe seu processo de estágio</p>
                </div>
              </div>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => handleLogin("secretaria")}
              onKeyDown={(e) => e.key === "Enter" && handleLogin("secretaria")}
              className="cursor-pointer p-5 hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Entrar como Secretaria</p>
                  <p className="text-xs text-muted-foreground">Gerencie todos os alunos e avalie contratos</p>
                </div>
              </div>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => handleLogin("coordenador")}
              onKeyDown={(e) => e.key === "Enter" && handleLogin("coordenador")}
              className="cursor-pointer p-5 hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Entrar como Coordenador</p>
                  <p className="text-xs text-muted-foreground">Veja apenas pendências aguardando análise</p>
                </div>
              </div>
            </Card>

          </div>

          <p className="text-xs text-muted-foreground mt-8 text-center">
            Demonstração — dados persistidos localmente no navegador.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem("ibmec-estagios-store"); location.reload(); }}>
              Resetar dados da demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
