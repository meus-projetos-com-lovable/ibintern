export type ProcessoStatus = "Pendente" | "Em Andamento" | "Aprovado" | "Reprovado";

export interface Contrato {
  id: string;
  nome_arquivo: string;
  data_envio: string;
  data_inicio?: string;
  nome_empresa?: string;
  apolice_seguro?: string;
  status: ProcessoStatus;
  observacoes?: string;
}

export interface Relatorio {
  id: string;
  titulo: string;
  corpo?: string;
  data_envio: string;
  status: ProcessoStatus;
  atraso?: boolean;
}

export interface Processo {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  matricula: string;
  curso: string;
  empresa: string;
  status: ProcessoStatus;
  criado_em: string;
  contrato?: Contrato;
  relatorios: Relatorio[];
  historico: { data: string; evento: string }[];
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  curso: string;
  email: string;
}

export const MOCK_ALUNOS: Aluno[] = [
  { id: "a1", nome: "Bernardo Lima", matricula: "202300123", cpf: "111.222.333-44", curso: "Engenharia de Software", email: "bernardo@al.ibmec.edu.br" },
  { id: "a2", nome: "Caio Souza", matricula: "202300456", cpf: "222.333.444-55", curso: "Ciência da Computação", email: "caio@al.ibmec.edu.br" },
  { id: "a3", nome: "Daniel Castro", matricula: "202300789", cpf: "333.444.555-66", curso: "Engenharia de Software", email: "daniel@al.ibmec.edu.br" },
  { id: "a4", nome: "Lucas Andrade", matricula: "202300999", cpf: "444.555.666-77", curso: "Sistemas de Informação", email: "lucas@al.ibmec.edu.br" },
];

export const MOCK_PROCESSOS: Processo[] = [
  {
    id: "p1",
    aluno_id: "a1",
    aluno_nome: "Bernardo Lima",
    matricula: "202300123",
    curso: "Engenharia de Software",
    empresa: "Petrobras",
    status: "Pendente",
    criado_em: "2025-05-20",
    contrato: {
      id: "c1",
      nome_arquivo: "TCE_Bernardo_Petrobras.pdf",
      data_envio: "2025-05-21",
      data_inicio: "2025-06-01",
      nome_empresa: "Petrobras S.A.",
      apolice_seguro: "AP-2025-991",
      status: "Pendente",
    },
    relatorios: [],
    historico: [
      { data: "2025-05-20", evento: "Processo iniciado" },
      { data: "2025-05-21", evento: "Contrato enviado para análise" },
    ],
  },
  {
    id: "p2",
    aluno_id: "a2",
    aluno_nome: "Caio Souza",
    matricula: "202300456",
    curso: "Ciência da Computação",
    empresa: "Itaú Unibanco",
    status: "Em Andamento",
    criado_em: "2025-03-10",
    contrato: {
      id: "c2",
      nome_arquivo: "TCE_Caio_Itau.pdf",
      data_envio: "2025-03-11",
      data_inicio: "2025-03-20",
      nome_empresa: "Itaú Unibanco",
      apolice_seguro: "AP-2025-118",
      status: "Aprovado",
    },
    relatorios: [
      { id: "r1", titulo: "Relatório Bimestral 1", data_envio: "2025-05-15", status: "Aprovado" },
    ],
    historico: [
      { data: "2025-03-10", evento: "Processo iniciado" },
      { data: "2025-03-15", evento: "Contrato aprovado pela Secretaria" },
      { data: "2025-05-15", evento: "Relatório bimestral enviado" },
    ],
  },
  {
    id: "p3",
    aluno_id: "a3",
    aluno_nome: "Daniel Castro",
    matricula: "202300789",
    curso: "Engenharia de Software",
    empresa: "Vale",
    status: "Pendente",
    criado_em: "2025-06-01",
    contrato: {
      id: "c3",
      nome_arquivo: "TCE_Daniel_Vale.pdf",
      data_envio: "2025-06-02",
      data_inicio: "2025-06-15",
      nome_empresa: "Vale S.A.",
      apolice_seguro: "AP-2025-552",
      status: "Pendente",
    },
    relatorios: [],
    historico: [
      { data: "2025-06-01", evento: "Processo iniciado" },
      { data: "2025-06-02", evento: "Contrato enviado para análise" },
    ],
  },
  {
    id: "p4",
    aluno_id: "a4",
    aluno_nome: "Lucas Andrade",
    matricula: "202300999",
    curso: "Sistemas de Informação",
    empresa: "Banco do Brasil",
    status: "Reprovado",
    criado_em: "2025-04-05",
    contrato: {
      id: "c4",
      nome_arquivo: "TCE_Lucas_BB.pdf",
      data_envio: "2025-04-06",
      nome_empresa: "Banco do Brasil",
      status: "Reprovado",
      observacoes: "Falta apólice de seguro e carimbo da empresa.",
    },
    relatorios: [],
    historico: [
      { data: "2025-04-05", evento: "Processo iniciado" },
      { data: "2025-04-06", evento: "Contrato enviado" },
      { data: "2025-04-08", evento: "Reprovado: documentação incompleta" },
    ],
  },
];
