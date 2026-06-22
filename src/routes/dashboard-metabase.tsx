import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { dashboard } from "@/lib/api/endpoints";
import { ApiRequestError } from "@/lib/api/client";

export const Route = createFileRoute("/dashboard-metabase")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gestão de Estágios" },
      { name: "description", content: "Painel de indicadores e métricas da plataforma de estágios." },
    ],
  }),
  component: DashboardMetabasePage,
});

function DashboardMetabasePage() {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const res = await dashboard.metabase();
        if (!cancelled) {
          setIframeUrl(res.iframe_url);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          if (err instanceof ApiRequestError) {
            setError({ status: err.status, message: err.message });
          } else {
            setError({ status: 500, message: "Erro inesperado ao carregar o dashboard." });
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  // ── Loading state ──
  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Carregando dashboard…
          </p>
        </div>
      </AppShell>
    );
  }

  // ── Error 403 — Access denied ──
  if (error && error.status === 403) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] px-6">
          <div className="max-w-md text-center">
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)" }}
            >
              <ShieldAlert className="h-10 w-10" style={{ color: "#F59E0B" }} />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              Acesso Restrito
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {error.message || "Seu perfil não possui dashboards atribuídos."}
            </p>
            <p className="text-xs text-muted-foreground/70">
              Caso acredite que isto é um erro, entre em contato com a administração.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Other errors ──
  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              Erro ao carregar Dashboard
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error.message}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Success — render iframe ──
  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-73px)]">
        <div className="px-6 lg:px-10 pt-8 pb-4 border-b bg-card">
          <PageHeader
            title="Dashboard"
            description="Painel de indicadores e métricas da plataforma."
          />
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            id="metabase-dashboard-iframe"
            src={iframeUrl!}
            title="Dashboard Metabase"
            className="w-full h-full border-0"
            style={{ minHeight: "100%" }}
            allowFullScreen
          />
        </div>
      </div>
    </AppShell>
  );
}
