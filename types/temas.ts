// Linha da tabela pl_temas (job jobs/classificacao_tematica.py).
export interface PlTema {
  casa: 'camara' | 'senado'
  id: number
  ano: number
  identificacao: string | null
  ementa: string | null
  data_apresentacao: string | null
  temas: string[]
  tema_principal: string
  probabilidades: Record<string, number> | null // só quando origem = 'modelo'
  origem: 'oficial' | 'modelo'
  modelo: string | null
}

export interface ContagemTema {
  tema: string
  camara: number
  senado: number
  total: number
  peloModelo: number // quantos receberam o tema pelo modelo, não pela indexação oficial
}

interface MetricasMetodo {
  precisao_micro: number
  recall_micro: number
  f1_micro: number
  f1_macro: number
  cobertura: number
  acerto_tema_principal?: number
}

export interface AvaliacaoClassificacao {
  executado_em: string
  modelo: string
  anos_treino: string
  ano_validacao: number
  ano_teste: number
  parametros: { C: number; limiar: number; temas: number; pls_treino: number; pls_validacao: number; pls_teste: number }
  metricas: { m1_palavras_chave: MetricasMetodo; m2_tfidf_logreg: MetricasMetodo }
  por_tema: { tema: string; pls_teste: number; f1_m1: number; f1_m2: number }[]
}
