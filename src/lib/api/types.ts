// ─────────────────────────────────────────────────────────────────────
// Types aligned with PBE_26.1_8002_III Django backend
// ─────────────────────────────────────────────────────────────────────

// ── Backend enum values (lowercase, matching Django TextChoices) ─────

export type StatusProcesso = "aberto" | "pendente" | "em_andamento" | "reprovado" | "concluido" | "cancelado";
export type StatusContrato = "pendente" | "analise_sec" | "aprovado" | "reprovado";
export type StatusRelatorio = "aguardando_validacao" | "pendente" | "analise_coord" | "aprovado" | "reprovado";
export type Veredito = "aprovado" | "reprovado";
export type Unidade = "barra" | "botafogo";

// ── Display labels for UI ───────────────────────────────────────────

export const STATUS_PROCESSO_LABEL: Record<StatusProcesso, string> = {
  aberto: "Aberto",
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  reprovado: "Reprovado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_CONTRATO_LABEL: Record<StatusContrato, string> = {
  pendente: "Pendente",
  analise_sec: "Análise Secretaria",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

export const STATUS_RELATORIO_LABEL: Record<StatusRelatorio, string> = {
  aguardando_validacao: "Aguardando Validação",
  pendente: "Pendente",
  analise_coord: "Análise Coordenação",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

// ── Domain models (matching serializer output) ──────────────────────

export interface NestedProcesso {
  id: number;
  nome_empresa: string;
  status: StatusProcesso;
}

export interface Aluno {
  nome: string;
  email: string;
  matricula: string;
  cpf: string;
  is_ativo: boolean;
  unidade: Unidade;
  periodo: number;
  curso: number;
  aceite_lgpd: boolean;
  processos: NestedProcesso[];
}

export interface UserMe {
  id: number;
  nome: string;
  email: string;
  matricula: string;
  role: "ALUNO" | "SECRETARIA" | "COORDENADOR";
}

export interface NestedAluno {
  nome: string;
  matricula: string;
}

export interface NestedCoordenacao {
  nome: string;
  matricula: string;
  area: string;
  unidade: Unidade;
}

export interface NestedSecretaria {
  nome: string;
  matricula: string;
  unidade: Unidade;
}

export interface NestedHistoricoAvaliacao {
  id: number;
  observacoes: string;
  data_avaliacao: string;
  veredito: Veredito;
  avaliador_nome: string;
  justificativa?: string;
}

export interface NestedContrato {
  id: number;
  nome_empresa: string | null;
  cnpj_empresa?: string | null;
  data_upload: string;
  data_inicio?: string | null;
  data_termino?: string | null;
  status: StatusContrato;
  conflito_grade: boolean;
  apolice_seguro?: string | null;
  plano_atividade?: boolean;
  assinatura_aluno?: boolean;
  assinatura_empresa?: boolean;
  assinatura_faculdade?: boolean;
  historico: NestedHistoricoAvaliacao[];
}

export interface NestedRelatorio {
  id: number;
  data_upload: string;
  status: StatusRelatorio;
  fora_do_prazo: boolean;
  titulo: string | null;
  corpo: string | null;
  historico: NestedHistoricoAvaliacao[];
}

export interface HorarioSlot {
  id?: number;
  dia: string;
  turno: string;
}

// ProcessoSerializer output (list view)
export interface Processo {
  id: number;
  nome_empresa: string;
  status: StatusProcesso;
  matricula_aluno: string;
  matricula_secretaria: string;
  matricula_coordenacao: string;
}

// ProcessoDetailSerializer output (detail view)
export interface ProcessoDetail {
  id: number;
  nome_empresa: string;
  status: StatusProcesso;
  aluno: NestedAluno;
  secretaria: NestedSecretaria;
  coordenacao: NestedCoordenacao;
  contrato: NestedContrato[];
  relatorio: NestedRelatorio[];
}

export interface Contrato {
  id: number;
  arquivo: string;
  status: StatusContrato;
  conflito_grade: boolean;
}

export interface Relatorio {
  processo_id: number;
  arquivo: string;
  data_upload: string;
  status: StatusRelatorio;
  fora_do_prazo: boolean;
}

export interface HistoricoAvaliacaoContrato {
  observacoes: string;
  data_avaliacao: string;
  veredito: Veredito;
  avaliador: number;
  contrato_id: number;
  justificativa?: string;
}

export interface HistoricoAvaliacaoRelatorio {
  observacoes: string;
  data_avaliacao: string;
  veredito: Veredito;
  avaliador: number;
  relatorio_id: number;
  justificativa?: string;
}

// ── Auth ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string; // matrícula
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface PrimeiroAcessoRequest {
  username: string;
  old_password: string;
  new_password: string;
}

// ── Paginated response from DRF ─────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── API error ───────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

// ── Aluno empty search response ─────────────────────────────────────

export interface AlunoEmptyResponse {
  mensagem: string;
  sugestao: string;
  resultados: [];
}

// ── Meu Histórico (timeline de avaliações do staff) ─────────────────

export interface MeuHistoricoItem {
  id_historico: number;
  tipo_documento: "Contrato" | "Relatório";
  documento_id: number;
  nome_aluno: string;
  nome_empresa: string;
  data_avaliacao: string;
  veredito: Veredito;
  observacoes: string;
  justificativa: string;
}

