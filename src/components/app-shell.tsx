import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, Inbox, Users, LogOut, PanelLeft, PanelLeftOpen } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: Array<"aluno" | "secretaria" | "coordenador"> }

const NAV: NavItem[] = [
  { to: "/dashboard/aluno", label: "Meu Estágio", icon: LayoutDashboard, roles: ["aluno"] },
  { to: "/inbox/avaliador", label: "Avaliação de Contratos", icon: Inbox, roles: ["secretaria"] },
  { to: "/inbox/coordenador", label: "Fila de Pendências", icon: Inbox, roles: ["coordenador"] },
  { to: "/alunos", label: "Gestão de Alunos", icon: Users, roles: ["secretaria", "coordenador"] },
];

export function AppShell({ children }: { children?: ReactNode }) {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className={`hidden md:flex shrink-0 flex-col border-r bg-sidebar transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
        <div className={`flex border-b transition-all duration-300 ${collapsed ? "items-center justify-center h-[73px] px-0" : "h-[73px] items-center justify-between pl-6 pr-2"}`}>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              title="Expandir menu"
              className="group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
            >
              {/* Ícone "i" — visível por padrão, some no hover */}
              <img
                src="/logo-barra-colapsada.png"
                alt="IbIntern Icon"
                className="h-7 w-7 object-contain transition-opacity duration-200 group-hover:opacity-0"
              />
              {/* PanelLeft — aparece no hover, sobreposto */}
              <PanelLeftOpen className="absolute h-5 w-5 text-foreground/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </button>
          ) : (
            <>
              <img src="/logo.png" alt="IbIntern Logo" className="h-10 object-contain animate-in fade-in duration-200" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                title="Recolher menu"
              >
                <PanelLeft className="h-5 w-5 text-foreground/85" />
              </Button>
            </>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((it) => {
            const active = pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                title={collapsed ? it.label : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{it.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4 flex flex-col gap-2">
          <Link
            to="/perfil"
            title={collapsed ? (user.nome ?? user.username) : undefined}
            className={`flex items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {(user.nome ?? user.username).slice(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{user.nome ?? user.username}</p>
                <p className="text-xs text-muted-foreground leading-tight capitalize truncate">{user.role}</p>
              </div>
            )}
          </Link>
          <Button
            variant="outline"
            size="sm"
            className={`w-full justify-start gap-2 ${collapsed ? "justify-center px-0" : ""}`}
            onClick={() => { logout(); navigate({ to: "/" }); }}
            title={collapsed ? "Sair" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden relative flex items-center justify-center border-b bg-card h-16 px-4">
          <img src="/logo.png" alt="IbIntern Logo" className="h-12 object-contain" />
          <Button variant="ghost" size="sm" className="absolute right-4" onClick={() => { logout(); navigate({ to: "/" }); }}>Sair</Button>
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

const STATUS_LABELS: Record<string, string> = {
  // Processo
  aberto: "Aberto",
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  reprovado: "Reprovado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  // Contrato
  analise_sec: "Análise Secretaria",
  aprovado: "Aprovado",
  // Relatório
  aguardando_validacao: "Aguardando Validação",
  analise_coord: "Análise Coordenação",
};

const STATUS_STYLES: Record<string, string> = {
  pendente: "bg-card-alt text-foreground/70 border-border",
  aberto: "bg-card-alt text-foreground/70 border-border",
  aguardando_validacao: "bg-card-alt text-foreground/70 border-border",
  em_andamento: "bg-primary/10 text-primary border-primary/20",
  analise_sec: "bg-primary/10 text-primary border-primary/20",
  analise_coord: "bg-primary/10 text-primary border-primary/20",
  aprovado: "bg-success text-success-foreground border-success/30",
  concluido: "bg-success text-success-foreground border-success/30",
  reprovado: "bg-destructive/10 text-destructive border-destructive/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const style = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
