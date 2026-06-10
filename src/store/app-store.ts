import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_ALUNOS, MOCK_PROCESSOS, type Aluno, type Processo, type ProcessoStatus } from "@/lib/mock-data";

export type Role = "aluno" | "secretaria";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
  unidade: string;
}

interface AppState {
  user: AuthUser | null;
  alunos: Aluno[];
  processos: Processo[];
  login: (role: Role) => void;
  logout: () => void;
  addAluno: (a: Omit<Aluno, "id">) => { ok: boolean; error?: string };
  iniciarProcesso: (alunoId: string, empresa: string, arquivo: string) => void;
  avaliarContrato: (processoId: string, veredito: ProcessoStatus, justificativa?: string) => void;
  enviarRelatorio: (processoId: string, titulo: string, arquivo: string, atraso?: boolean) => void;
  avaliarRelatorio: (processoId: string, relatorioId: string, veredito: ProcessoStatus, justificativa?: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      alunos: MOCK_ALUNOS,
      processos: MOCK_PROCESSOS,

      login: (role) => {
        const user: AuthUser =
          role === "aluno"
            ? { id: "a1", nome: "Bernardo Lima", email: "bernardo@al.ibmec.edu.br", role, unidade: "Ibmec RJ" }
            : { id: "s1", nome: "Ana Coordenadora", email: "ana.coord@ibmec.edu.br", role, unidade: "Ibmec RJ" };
        set({ user });
      },

      logout: () => set({ user: null }),

      addAluno: (a) => {
        const exists = get().alunos.some((x) => x.cpf === a.cpf || x.matricula === a.matricula);
        if (exists) return { ok: false, error: "A matrícula ou CPF informados já estão em uso por outro aluno." };
        set({ alunos: [...get().alunos, { ...a, id: `a${Date.now()}` }] });
        return { ok: true };
      },

      iniciarProcesso: (alunoId, empresa, arquivo) => {
        const aluno = get().alunos.find((x) => x.id === alunoId);
        if (!aluno) return;
        const now = new Date().toISOString().slice(0, 10);
        const proc: Processo = {
          id: `p${Date.now()}`,
          aluno_id: aluno.id,
          aluno_nome: aluno.nome,
          matricula: aluno.matricula,
          curso: aluno.curso,
          empresa,
          status: "Pendente",
          criado_em: now,
          contrato: {
            id: `c${Date.now()}`,
            nome_arquivo: arquivo,
            data_envio: now,
            nome_empresa: empresa,
            status: "Pendente",
          },
          relatorios: [],
          historico: [
            { data: now, evento: "Processo iniciado" },
            { data: now, evento: "Contrato enviado para análise" },
          ],
        };
        set({ processos: [proc, ...get().processos] });
      },

      avaliarContrato: (processoId, veredito, justificativa) => {
        const now = new Date().toISOString().slice(0, 10);
        set({
          processos: get().processos.map((p) => {
            if (p.id !== processoId || !p.contrato) return p;
            const novoStatus: ProcessoStatus = veredito === "Aprovado" ? "Em Andamento" : "Reprovado";
            return {
              ...p,
              status: novoStatus,
              contrato: { ...p.contrato, status: veredito, observacoes: justificativa },
              historico: [
                ...p.historico,
                { data: now, evento: veredito === "Aprovado" ? "Contrato aprovado pela Secretaria" : `Contrato reprovado: ${justificativa ?? "sem justificativa"}` },
              ],
            };
          }),
        });
      },

      enviarRelatorio: (processoId, titulo, arquivo, atraso) => {
        const now = new Date().toISOString().slice(0, 10);
        set({
          processos: get().processos.map((p) => {
            if (p.id !== processoId) return p;
            return {
              ...p,
              relatorios: [
                ...p.relatorios,
                { id: `r${Date.now()}`, titulo, data_envio: now, status: "Pendente", atraso },
              ],
              historico: [...p.historico, { data: now, evento: `Relatório "${titulo}" enviado (${arquivo})` }],
            };
          }),
        });
      },

      avaliarRelatorio: (processoId, relatorioId, veredito, justificativa) => {
        const now = new Date().toISOString().slice(0, 10);
        set({
          processos: get().processos.map((p) => {
            if (p.id !== processoId) return p;
            return {
              ...p,
              relatorios: p.relatorios.map((r) =>
                r.id === relatorioId ? { ...r, status: veredito } : r
              ),
              historico: [
                ...p.historico,
                { data: now, evento: `Relatório avaliado: ${veredito}${justificativa ? ` — ${justificativa}` : ""}` },
              ],
            };
          }),
        });
      },
    }),
    { name: "ibmec-estagios-store" }
  )
);
