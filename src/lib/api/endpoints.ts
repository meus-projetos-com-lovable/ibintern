import { apiFetch, apiUpload, apiDownloadUrl } from "./client";
import type {
  Aluno,
  Contrato,
  HistoricoAvaliacaoContrato,
  HistoricoAvaliacaoRelatorio,
  HorarioSlot,
  LoginRequest,
  LoginResponse,
  MeuHistoricoItem,
  PaginatedResponse,
  PrimeiroAcessoRequest,
  Processo,
  ProcessoDetail,
  Relatorio,
  StatusContrato,
  UserMe,
  Veredito,
} from "./types";

// ── Auth ─────────────────────────────────────────────────────────────
// POST /auth/login/         → { access, refresh }
// POST /auth/primeiro-acesso/ → { message }
// POST /auth/logout/        → 204
// POST /auth/token/refresh/ → { access, refresh }

export const auth = {
  login: (data: LoginRequest) =>
    apiFetch<LoginResponse>("/auth/login/", { method: "POST", body: data }),

  primeiroAcesso: (data: PrimeiroAcessoRequest) =>
    apiFetch<{ message: string }>("/auth/primeiro-acesso/", { method: "POST", body: data }),

  logout: (refresh: string) =>
    apiFetch<void>("/auth/logout/", { method: "POST", body: { refresh } }),

  refreshToken: (refresh: string) =>
    apiFetch<{ access: string; refresh?: string }>("/auth/token/refresh/", {
      method: "POST",
      body: { refresh },
    }),

  me: () => apiFetch<UserMe>("/auth/me/"),
};

// ── Alunos ───────────────────────────────────────────────────────────
// GET    /aluno/?matricula=&cpf=&nome=&page=  → PaginatedResponse<Aluno>
// POST   /aluno/                               → { message }
// PATCH  /aluno/?matricula_aluno=              → { message }

export const alunos = {
  listar: (params?: { matricula?: string; cpf?: string; nome?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.matricula) searchParams.set("matricula", params.matricula);
    if (params?.cpf) searchParams.set("cpf", params.cpf);
    if (params?.nome) searchParams.set("nome", params.nome);
    if (params?.page) searchParams.set("page", String(params.page));
    const qs = searchParams.toString();
    return apiFetch<PaginatedResponse<Aluno>>(`/aluno/${qs ? `?${qs}` : ""}`);
  },

  criar: (data: {
    nome: string;
    email: string;
    matricula: string;
    senha: string;
    cpf: string;
    unidade: string;
    periodo: number;
    curso: number;
  }) => apiFetch<{ message: string }>("/aluno/", { method: "POST", body: data }),

  atualizar: (matricula: string, data: Partial<Aluno>) =>
    apiFetch<{ message: string }>(`/aluno/?matricula_aluno=${matricula}`, {
      method: "PATCH",
      body: data,
    }),
};

// ── Processos ────────────────────────────────────────────────────────
// GET    /processo/?matricula_aluno=&status=&nome_empresa=&page= → PaginatedResponse<Processo>
// POST   /processo/                                                → { criado: ... }
// PATCH  /processo/?processo_id=                                   → { message }
// GET    /processo/<id>/                                           → ProcessoDetail

export const processos = {
  listar: (params?: {
    matricula_aluno?: string;
    status?: string;
    nome_empresa?: string;
    page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.matricula_aluno) searchParams.set("matricula_aluno", params.matricula_aluno);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.nome_empresa) searchParams.set("nome_empresa", params.nome_empresa);
    if (params?.page) searchParams.set("page", String(params.page));
    const qs = searchParams.toString();
    return apiFetch<PaginatedResponse<Processo>>(`/processo/${qs ? `?${qs}` : ""}`);
  },

  detalhe: (id: number) => apiFetch<ProcessoDetail>(`/processo/${id}/`),

  criar: (data: {
    nome_empresa: string;
    matricula_aluno?: string;
    matricula_secretaria: string;
    matricula_coordenacao: string;
  }) => apiFetch<{ criado: string }>("/processo/", { method: "POST", body: data }),

  atualizar: (processoId: number, data: Partial<Processo>) =>
    apiFetch<{ message: string }>(`/processo/?processo_id=${processoId}`, {
      method: "PATCH",
      body: data,
    }),
};

// ── Contratos ────────────────────────────────────────────────────────
// POST   /processo/<id>/contrato/           → upload contrato (multipart)
// POST   /contrato/avaliar/                 → avaliar contrato
// GET    /contrato/<id>/download/           → binary PDF
// PATCH  /processo/<id>/contrato/atualizar/ → atualizar dados extraídos
// PATCH  /processo/<id>/reprovar/           → reprovar contrato com justificativa

export const contratos = {
  upload: (processoId: number, arquivo: File) => {
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    return apiUpload<{ message: string; data: Contrato }>(
      `/processo/${processoId}/contrato/`,
      formData,
    );
  },

  avaliar: (data: {
    observacoes: string;
    veredito: Veredito;
    avaliador: number;
    contrato_id: number;
    justificativa?: string;
  }) =>
    apiFetch<{ message: string }>("/contrato/avaliar/", { method: "POST", body: data }),

  download: (contratoId: number) => apiDownloadUrl(`/contrato/${contratoId}/download/`),

  atualizar: (processoId: number, data: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/processo/${processoId}/contrato/atualizar/`, {
      method: "PATCH",
      body: data,
    }),

  reprovar: (processoId: number, justificativa: string) =>
    apiFetch<Processo>(`/processo/${processoId}/reprovar/`, {
      method: "PATCH",
      body: { justificativa },
    }),
};

// ── Relatórios ───────────────────────────────────────────────────────
// POST   /processo/<id>/relatorio/           → upload relatório (multipart)
// POST   /relatorio/avaliar/                 → avaliar relatório
// PATCH  /processo/<id>/relatorio/atualizar/ → atualizar título/corpo

export const relatorios = {
  upload: (processoId: number, arquivo: File) => {
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    return apiUpload<{ message: string }>(`/processo/${processoId}/relatorio/`, formData);
  },

  avaliar: (data: {
    observacoes: string;
    veredito: Veredito;
    avaliador: number;
    relatorio_id: number;
    justificativa?: string;
  }) =>
    apiFetch<{ message: string }>("/relatorio/avaliar/", { method: "POST", body: data }),

  atualizar: (processoId: number, data: { titulo?: string; corpo?: string }) =>
    apiFetch<Record<string, unknown>>(`/processo/${processoId}/relatorio/atualizar/`, {
      method: "PATCH",
      body: data,
    }),
};

// ── Meu Histórico ────────────────────────────────────────────────────
// GET    /meu-historico/?tipo=&veredito=  → MeuHistoricoItem[]

export const meuHistorico = {
  listar: (params?: { tipo?: string; veredito?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.tipo) searchParams.set("tipo", params.tipo);
    if (params?.veredito) searchParams.set("veredito", params.veredito);
    const qs = searchParams.toString();
    return apiFetch<MeuHistoricoItem[]>(`/meu-historico/${qs ? `?${qs}` : ""}`);
  },
};

// ── Aluno Grade ──────────────────────────────────────────────────────
// GET   /aluno/grade/    → obter grade do aluno
// PATCH /aluno/grade/    → atualizar grade do aluno
export const alunoGrade = {
  obter: () => apiFetch<HorarioSlot[]>("/aluno/grade/"),
  atualizar: (slots: { dia: string; turno: string }[]) =>
    apiFetch<HorarioSlot[]>("/aluno/grade/", {
      method: "PATCH",
      body: slots,
    }),
};

// ── Dashboard Metabase ───────────────────────────────────────────────
// GET   /dashboard/metabase/    → { iframe_url: string }
export const dashboard = {
  metabase: () => apiFetch<{ iframe_url: string }>("/dashboard/metabase/"),
};
