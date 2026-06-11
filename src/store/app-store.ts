import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Aluno, Processo, ProcessoStatus } from "@/lib/mock-data";

export type Role = "aluno" | "secretaria" | "coordenador";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
  unidade: string;
  matricula: string;
}

export interface AvaliacaoLog {
  id: string;
  data: string;
  avaliador_id: string;
  avaliador_nome: string;
  avaliador_role: Role;
  processo_id: string;
  aluno_nome: string;
  tipo: "Contrato" | "Relatório";
  alvo: string;
  veredito: ProcessoStatus;
  justificativa?: string;
}

interface AppState {
  user: AuthUser | null;
  alunos: Aluno[];
  processos: Processo[];
  avaliacoes: AvaliacaoLog[];
  login: (role: Role) => Promise<void>;
  logout: () => void;
  syncData: () => Promise<void>;
  addAluno: (a: Omit<Aluno, "id">) => Promise<{ ok: boolean; error?: string }>;
  iniciarProcesso: (alunoId: string, empresa: string, file: File) => Promise<void>;
  avaliarContrato: (processoId: string, veredito: ProcessoStatus, justificativa?: string) => Promise<void>;
  enviarRelatorio: (processoId: string, titulo: string, file: File, atraso?: boolean) => Promise<void>;
  avaliarRelatorio: (processoId: string, relatorioId: string, veredito: ProcessoStatus, justificativa?: string) => Promise<void>;
}

function mapStatus(s: string): ProcessoStatus {
  const norm = String(s).toUpperCase();
  if (norm === "ABERTO" || norm === "PENDENTE" || norm === "AGUARDANDO_VALIDACAO") return "Pendente";
  if (norm === "EM_ANDAMENTO" || norm === "EM ANDAMENTO") return "Em Andamento";
  if (norm === "CONCLUIDO" || norm === "APROVADO") return "Aprovado";
  if (norm === "CANCELADO" || norm === "REPROVADO") return "Reprovado";
  return "Pendente";
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      alunos: [],
      processos: [],
      avaliacoes: [],

      login: async (role) => {
        const credentials: Record<Role, { username: string; password: string }> = {
          aluno: { username: "aluno01", password: "senha123" },
          secretaria: { username: "sec01", password: "senha123" },
          coordenador: { username: "coord01", password: "senha123" },
        };
        const creds = credentials[role];
        const res = await fetch("http://localhost:8000/auth/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds),
        });
        if (!res.ok) {
          throw new Error("Erro de login");
        }
        const data = await res.json();
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);

        const meRes = await fetch("http://localhost:8000/auth/me/", {
          headers: { "Authorization": `Bearer ${data.access}` }
        });
        if (!meRes.ok) throw new Error("Erro ao carregar perfil");
        const meData = await meRes.json();
        
        const mappedRole = meData.role.toLowerCase() as Role;
        const user: AuthUser = {
          id: String(meData.id),
          nome: meData.nome,
          email: meData.email,
          role: mappedRole,
          unidade: "Ibmec RJ",
          matricula: meData.matricula,
        };

        set({ user });
        await get().syncData();
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, alunos: [], processos: [], avaliacoes: [] });
      },

      syncData: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
          get().logout();
          return;
        }

        const headers = { "Authorization": `Bearer ${token}` };

        // 1. Fetch processos
        const procRes = await fetch("http://localhost:8000/processo/", { headers });
        if (procRes.status === 401) {
          get().logout();
          return;
        }
        if (procRes.ok) {
          const procData = await procRes.json();
          const results = procData.results || procData;
          const processos = results.map((p: any) => ({
            id: String(p.id),
            aluno_id: String(p.aluno_id),
            aluno_nome: p.aluno_nome,
            matricula: p.matricula,
            curso: p.curso,
            empresa: p.nome_empresa,
            status: mapStatus(p.status),
            criado_em: p.criado_em,
            contrato: p.contrato ? {
              id: String(p.contrato.id),
              nome_arquivo: p.contrato.nome_arquivo,
              data_envio: p.contrato.data_envio,
              nome_empresa: p.contrato.nome_empresa,
              status: mapStatus(p.contrato.status),
              observacoes: p.contrato.observacoes,
              apolice_seguro: p.contrato.apolice_seguro,
              data_inicio: p.contrato.data_inicio,
            } : undefined,
            relatorios: (p.relatorios || p.relatorio || []).map((r: any) => ({
              id: String(r.id),
              titulo: r.titulo,
              corpo: r.corpo,
              data_envio: r.data_envio,
              status: mapStatus(r.status),
              atraso: r.atraso,
            })),
            historico: (p.historico || []).map((h: any) => ({
              data: h.data,
              evento: h.evento,
            })),
          }));
          set({ processos });
        }

        // 2. Fetch alunos if staff
        const u = get().user;
        if (u && (u.role === "secretaria" || u.role === "coordenador")) {
          const alunoRes = await fetch("http://localhost:8000/aluno/", { headers });
          if (alunoRes.ok) {
            const alunoData = await alunoRes.json();
            const results = alunoData.results || alunoData;
            const alunos = results.map((a: any) => ({
              id: String(a.id),
              nome: a.nome,
              matricula: a.matricula,
              cpf: a.cpf,
              curso: a.curso,
              email: a.email,
            }));
            set({ alunos });
          }
        }
      },

      addAluno: async (a) => {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:8000/aluno/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: a.nome,
            email: a.email,
            matricula: a.matricula,
            senha: "senha123",
            cpf: a.cpf.replace(/\D/g, ""),
            curso: 1,
            unidade: "Barra",
            periodo: "Manhã",
            aceite_lgpd: true,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          const errorMsg = errData.matricula?.[0] || errData.cpf?.[0] || errData.detail || "Erro ao cadastrar aluno.";
          return { ok: false, error: errorMsg };
        }
        await get().syncData();
        return { ok: true };
      },

      iniciarProcesso: async (alunoId, empresa, file) => {
        const token = localStorage.getItem("access_token");
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        };
        const procRes = await fetch("http://localhost:8000/processo/", {
          method: "POST",
          headers,
          body: JSON.stringify({
            nome_empresa: empresa,
            status: "ABERTO",
          }),
        });
        if (!procRes.ok) {
          throw new Error("Erro ao iniciar processo");
        }
        
        await get().syncData();
        const proc = get().processos.find(p => p.empresa === empresa && p.status === "Pendente");
        if (!proc) throw new Error("Processo não encontrado após criação");

        const formData = new FormData();
        formData.append("arquivo", file);
        
        const uploadRes = await fetch(`http://localhost:8000/processo/${proc.id}/contrato/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });
        if (!uploadRes.ok) {
          throw new Error("Erro ao enviar contrato");
        }

        await get().syncData();
      },

      avaliarContrato: async (processoId, veredito, justificativa) => {
        const token = localStorage.getItem("access_token");
        const proc = get().processos.find(p => p.id === processoId);
        if (!proc || !proc.contrato) return;

        const u = get().user;
        if (!u) return;

        const body = {
          contrato_id: Number(proc.contrato.id),
          veredito: veredito === "Aprovado" ? "APROVADO" : "REPROVADO",
          justificativa: justificativa || "",
          observacoes: justificativa || "",
          avaliador: Number(u.id),
        };

        const res = await fetch("http://localhost:8000/contrato/avaliar/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error("Erro ao avaliar contrato");
        }

        await get().syncData();
      },

      enviarRelatorio: async (processoId, titulo, file) => {
        const token = localStorage.getItem("access_token");
        const formData = new FormData();
        formData.append("arquivo", file);
        formData.append("titulo", titulo);
        formData.append("corpo", "Envio do relatório de estágio.");

        const res = await fetch(`http://localhost:8000/processo/${processoId}/relatorio/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });
        if (!res.ok) {
          throw new Error("Erro ao enviar relatório");
        }

        await get().syncData();
      },

      avaliarRelatorio: async (processoId, relatorioId, veredito, justificativa) => {
        const token = localStorage.getItem("access_token");
        const u = get().user;
        if (!u) return;

        const body = {
          relatorio_id: Number(relatorioId),
          veredito: veredito === "Aprovado" ? "APROVADO" : "REPROVADO",
          justificativa: justificativa || "",
          observacoes: justificativa || "",
          avaliador: Number(u.id),
        };

        const res = await fetch("http://localhost:8000/relatorio/avaliar/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error("Erro ao avaliar relatório");
        }

        await get().syncData();
      },
    }),
    { name: "ibmec-estagios-store" }
  )
);
