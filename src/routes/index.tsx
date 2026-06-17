import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, User, Lock, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import type { Role } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/api/endpoints";
import { ApiRequestError } from "@/lib/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Entrar — Gestão de Estágios Ibmec" },
      { name: "description", content: "Acesse a plataforma de gestão de estágios do Ibmec para alunos e secretaria." },
    ],
  }),
  component: LoginPage,
}));



function LoginPage() {
  const user = useAppStore((s) => s.user);
  const setAuth = useAppStore((s) => s.setAuth);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Primeiro acesso state
  const [showPrimeiroAcesso, setShowPrimeiroAcesso] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      const dest =
        user.role === "aluno" ? "/dashboard/aluno" :
        user.role === "coordenador" ? "/inbox/coordenador" :
        "/inbox/avaliador";
      navigate({ to: dest });
    }
  }, [user, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Preencha matrícula e senha.");
      return;
    }

    setLoading(true);
    try {
      const res = await auth.login({ username, password });

      // Fetch real user data (role, name, email) from /auth/me/
      // We need to temporarily store tokens so the me() call is authenticated
      const { setTokens } = await import("@/lib/api/client");
      setTokens(res.access, res.refresh);

      let me: { id: number; nome: string; email: string; matricula: string; role: string };
      try {
        me = await auth.me();
      } catch {
        // Fallback if /me/ fails — use basic info from JWT
        me = { id: 0, nome: username, email: "", matricula: username, role: "ALUNO" };
      }

      const role = me.role.toLowerCase() as Role;

      const authUser = {
        id: me.id,
        username: me.matricula,
        nome: me.nome,
        email: me.email,
        role,
      };

      setAuth(authUser, res.access, res.refresh);
      toast.success("Login realizado com sucesso!");
    } catch (err: unknown) {
      if (err instanceof ApiRequestError && err.detail === "primeiro_acesso") {
        setShowPrimeiroAcesso(true);
        toast.info("Você precisa redefinir sua senha no primeiro acesso.");
      } else {
        const message = err instanceof Error ? err.message : "Erro ao fazer login.";
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loginRapido(matriculaRapida: string) {
    setLoading(true);
    try {
      const res = await auth.login({ username: matriculaRapida, password: "senha123" });

      const { setTokens } = await import("@/lib/api/client");
      setTokens(res.access, res.refresh);

      let me: { id: number; nome: string; email: string; matricula: string; role: string };
      try {
        me = await auth.me();
      } catch {
        me = { id: 0, nome: matriculaRapida, email: "", matricula: matriculaRapida, role: "ALUNO" };
      }

      const role = me.role.toLowerCase() as Role;

      const authUser = {
        id: me.id,
        username: me.matricula,
        nome: me.nome,
        email: me.email,
        role,
      };

      setAuth(authUser, res.access, res.refresh);
      toast.success("Login rápido realizado com sucesso!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login rápido.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrimeiroAcesso(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await auth.primeiroAcesso({
        username,
        old_password: password,
        new_password: newPassword,
      });
      toast.success("Senha redefinida com sucesso! Faça login com a nova senha.");
      setShowPrimeiroAcesso(false);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao redefinir senha.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="IbIntern Logo" className="h-10 object-contain brightness-0 invert" />
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
          {!showPrimeiroAcesso ? (
            <>
              <h2 className="font-display text-2xl font-semibold mb-2">Bem-vindo de volta</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Entre com sua matrícula e senha para acessar a plataforma.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username">Matrícula</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Sua matrícula"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-9"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
                  Entrar
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-muted" />
                  <span className="flex-shrink mx-4 text-muted-foreground text-xs font-medium">Acesso rápido (Ambiente de Testes)</span>
                  <div className="flex-grow border-t border-muted" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => loginRapido("aluno01")}
                    disabled={loading}
                  >
                    Aluno
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => loginRapido("sec01")}
                    disabled={loading}
                  >
                    Secretaria
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => loginRapido("coord01")}
                    disabled={loading}
                  >
                    Coordenação
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-semibold mb-2">Primeiro acesso</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Defina uma nova senha para sua conta. A senha atual é temporária.
              </p>

              <form onSubmit={handlePrimeiroAcesso} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">Nova senha</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Redefinir Senha
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowPrimeiroAcesso(false)}
                >
                  Voltar ao login
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
