// Tipos da API de Processos do Senado (/dadosabertos/processo).
// Substituem os tipos da família /materia, depreciada pelo Senado
// (DataDesativacaoCompleta: 2026-02-01).

// Item de GET /processo (listagem)
export interface ProcessoSenado {
  id: number
  codigoMateria?: number
  identificacao?: string // ex.: "PL 1/2025"
  ementa?: string
  dataApresentacao?: string // AAAA-MM-DD
  autoria?: string
  situacaoAtual?: string
  dataSituacaoAtual?: string
  tramitando?: string // "Sim" | "Não"
  objetivo?: string // "Iniciadora" | "Revisora"
  tipoDocumento?: string
  urlDocumento?: string
  normaGerada?: string // ex.: "Lei nº 15.172 de 22/07/2025"
  siglaTipoDeliberacao?: string // ex.: "APROVADA_NO_PLENARIO"
}

export interface ColegiadoSenado {
  codigo?: number
  casa?: string
  sigla?: string
  nome?: string
}

// autuacoes[].informesLegislativos[] de GET /processo/{id}
export interface InformeLegislativoSenado {
  id?: number
  data?: string // "AAAA-MM-DD HH:mm:ss"
  descricao?: string
  colegiado?: ColegiadoSenado
  enteAdministrativo?: ColegiadoSenado
  siglaSituacaoIniciada?: string
}

// autuacoes[].situacoes[] de GET /processo/{id}
export interface SituacaoSenado {
  sigla?: string
  descricao?: string
  inicio?: string
  fim?: string | null
  colegiado?: ColegiadoSenado
}

export interface AutorSenado {
  autor?: string
  descricaoTipo?: string
  ente?: string
}

// GET /processo/{id} (somente os campos usados pelo app)
export interface ProcessoDetalhadoSenado {
  id: number
  codigoMateria?: number
  identificacao?: string
  sigla?: string
  numero?: string
  ano?: number
  descricaoSigla?: string
  objetivo?: string
  tramitando?: string
  situacaoAtual?: string
  conteudo?: { ementa?: string; tipo?: string }
  documento?: { dataApresentacao?: string; tipo?: string; url?: string; resumoAutoria?: string; indexacao?: string }
  autoriaIniciativa?: AutorSenado[]
  deliberacao?: { data?: string; tipoDeliberacao?: string; destino?: string }
  normaGerada?: { descricao?: string }
  autuacoes?: { situacoes?: SituacaoSenado[]; informesLegislativos?: InformeLegislativoSenado[] }[]
}

// Item de GET /processo/relatoria?idProcesso=
export interface RelatoriaSenado {
  nomeParlamentar?: string
  siglaPartidoParlamentar?: string
  ufParlamentar?: string
  descricaoTipoRelator?: string
  siglaColegiado?: string
  dataDesignacao?: string
  dataDestituicao?: string | null
  descricaoTipoEncerramento?: string
}

// Item de GET /votacao?idProcesso=
export interface VotacaoSenado {
  dataSessao?: string
  descricaoVotacao?: string
  resultadoVotacao?: string // "A" = aprovada (demais códigos: ver a API)
}

// Resposta de /api/senado/[id], já normalizada pela rota
export interface DetalheSenado {
  processo: ProcessoDetalhadoSenado | null
  tramitacao: InformeLegislativoSenado[]
  situacaoAtual: string | null
  relatorias: RelatoriaSenado[]
  votacoes: VotacaoSenado[]
}
