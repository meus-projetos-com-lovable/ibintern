import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, Inbox, Users, LogOut, GraduationCap } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: Array<"aluno" | "secretaria" | "coordenador"> }

const NAV: NavItem[] = [
  { to: "/dashboard/aluno", label: "Meu Estágio", icon: LayoutDashboard, roles: ["aluno"] },
  { to: "/inbox/avaliador", label: "Avaliação de Contratos", icon: Inbox, roles: ["secretaria"] },
  { to: "/inbox/coordenador", label: "Fila de Pendências", icon: Inbox, roles: ["coordenador"] },
  { to: "/alunos", label: "Gestão de Alunos", icon: Users, roles: ["secretaria"] },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm leading-tight">Ibmec</p>
            <p className="text-xs text-muted-foreground leading-tight">Gestão de Estágios</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((it) => {
            const active = pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <Link
            to="/perfil"
            className="mb-3 -mx-2 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {user.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight truncate">{user.nome}</p>
              <p className="text-xs text-muted-foreground leading-tight capitalize truncate">{user.role} · {user.unidade}</p>
            </div>
          </Link>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => { logout(); navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-sm">Ibmec Estágios</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate({ to: "/" }); }}>Sair</Button>
        </header>
        <main className="flex-1 min-w-0">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pendente: "bg-card-alt text-foreground/70 border-border",
    "Em Andamento": "bg-primary/10 text-primary border-primary/20",
    Aprovado: "bg-success text-success-foreground border-success/30",
    Reprovado: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
