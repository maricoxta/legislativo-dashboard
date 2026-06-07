export interface ProposicaoCamara {
  id: number
  siglaTipo: string
  numero: number
  ano: number
  ementa: string
  ementaDetalhada?: string
  descricaoTipo?: string
  dataApresentacao?: string
  regime?: string
  apreciacao?: string
  ambito?: string
  keywords?: string
  urlInteiroTeor?: string
  statusProposicao?: {
    descricaoSituacao: string
    siglaOrgao?: string
    descricaoTramitacao?: string
    dataHora?: string
  }
}

export interface TramitacaoCamara {
  dataHora?: string
  siglaOrgao?: string
  descricaoTramitacao?: string
  descricaoSituacao?: string
  despacho?: string
}

export interface AutorCamara {
  tipo?: string
  nome?: string
  sigla?: string
  siglaPartido?: string
  siglaUf?: string
  uri?: string
}

export interface RelatorCamara {
  nome?: string
  siglaOrgao?: string
  dataDesignacao?: string
}

export interface VotacaoCamara {
  data?: string
  aprovacao?: string
  descricao?: string
  aprovacaoInicial?: {
    votosSim: number
    votosNao: number
  }
}

export interface EventoCamara {
  id?: number
  dataHoraInicio?: string
  dataHoraFim?: string
  descricaoTipo?: string
  descricao?: string
  situacao?: string
  localCamara?: { nome?: string }
  orgaos?: { sigla?: string; apelido?: string }[]
  urlRegistro?: string
}

export interface ProposicaoDetalhe extends ProposicaoCamara {
  tramitacoes?: TramitacaoCamara[]
  autores?: AutorCamara[]
  relatores?: RelatorCamara[]
  votacoes?: VotacaoCamara[]
}
