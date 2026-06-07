export interface MateriaSenado {
  Codigo: number
  Sigla?: string
  Numero?: string
  Ano?: string
  Ementa?: string
  DescricaoObjectivo?: string
  Data?: string
  Autor?: string
  DescricaoIdentificacao?: string
  SiglaComissao?: string
}

export interface MateriaDetalhadaSenado {
  IdentificacaoMateria?: {
    SiglaTipoMateria?: string
    NumeroMateria?: string
    AnoMateria?: string
    DescricaoTipoMateria?: string
  }
  EmentaMateria?: string
  ExplicacaoEmentaMateria?: string
  DataApresentacao?: string
  SituacaoAtual?: { DescricaoSituacao?: string }
  Regime?: { DescricaoRegime?: string }
}

export interface TramitacaoSenado {
  DataSituacao?: string
  DescricaoSituacao?: string
  SiglaLocalSituacao?: string
  NomeLocalSituacao?: string
}

export interface RelatorSenado {
  DescricaoRelator?: string
  NomeRelator?: string
  SiglaComissaoRelatoria?: string
  DataDesignacaoRelator?: string
  DescricaoVotacaoRelatorio?: string
}

export interface ComissaoSenado {
  IdentificacaoComissao?: {
    SiglaComissao?: string
    NomeComissao?: string
  }
  DescricaoParecerComissao?: string
}

export interface VotacaoSenado {
  DataSessaoVotacao?: string
  DescricaoResultado?: string
}

export interface TextoSenado {
  UrlTexto?: string
  DescricaoTipoTexto?: string
}
