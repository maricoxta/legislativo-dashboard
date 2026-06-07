export const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2'
export const SENADO_API = 'https://legis.senado.leg.br/dadosabertos'

export const CAMARA_TEMAS = [
  { cod: 46, nome: 'Administração Pública', emoji: '🏛️' },
  { cod: 40, nome: 'Educação e Cultura', emoji: '📚' },
  { cod: 47, nome: 'Saúde', emoji: '🏥' },
  { cod: 48, nome: 'Segurança Pública', emoji: '🛡️' },
  { cod: 41, nome: 'Economia e Finanças', emoji: '💰' },
  { cod: 49, nome: 'Trabalho e Emprego', emoji: '👷' },
  { cod: 50, nome: 'Meio Ambiente', emoji: '🌿' },
  { cod: 45, nome: 'Ciência e Tecnologia', emoji: '🔬' },
  { cod: 42, nome: 'Direitos Humanos', emoji: '⚖️' },
  { cod: 43, nome: 'Previdência Social', emoji: '👴' },
  { cod: 44, nome: 'Tributação e Orçamento', emoji: '📊' },
  { cod: 51, nome: 'Comunicações', emoji: '📡' },
  { cod: 52, nome: 'Transportes', emoji: '🚂' },
  { cod: 53, nome: 'Agricultura', emoji: '🌾' },
]

export const TIPO_SIGLAS: Record<string, string> = {
  PL: 'Projeto de Lei',
  PEC: 'Emenda Constitucional',
  MPV: 'Medida Provisória',
  PLN: 'Projeto de Lei do Congresso',
  PDL: 'Projeto de Decreto Legislativo',
  PLV: 'Projeto de Lei de Conversão',
  MSC: 'Mensagem',
  REQ: 'Requerimento',
}

export const PARTIDOS_BR = [
  'AVANTE','DC','MDB','NOVO','PCdoB','PDT','PL','PMN','PP','PRD',
  'PROS','PSB','PSD','PSDB','PSOL','PT','PV','PODE','REPUBLICANOS',
  'SOLIDARIEDADE','UNIÃO',
]

export const UF_LIST = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

export function getStatusClass(sit?: string): string {
  if (!sit) return 'status-tramitando'
  const s = sit.toLowerCase()
  if (s.includes('lei') || s.includes('norma jurídica')) return 'status-lei'
  if (s.includes('aprovad')) return 'status-aprovado'
  if (s.includes('arquivad') || s.includes('retirad')) return 'status-arquivado'
  if (s.includes('vetad')) return 'status-vetado'
  if (s.includes('prejudicad')) return 'status-prejudicado'
  return 'status-tramitando'
}

export function getUrgencyClass(regime?: string): string {
  if (!regime) return ''
  const r = regime.toLowerCase()
  if (r.includes('urgência')) return 'urgency-urgente'
  if (r.includes('prioridade')) return 'urgency-prioridade'
  return ''
}
