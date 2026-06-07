export const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
export const SENADO_API = 'https://legis.senado.leg.br/dadosabertos';

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
];

export const TIPO_SIGLAS = {
  PL:  'Projeto de Lei',
  PEC: 'Emenda Constitucional',
  MPV: 'Medida Provisória',
  PLN: 'Projeto de Lei do Congresso',
  PDL: 'Projeto de Decreto Legislativo',
  PLV: 'Projeto de Lei de Conversão',
  MSC: 'Mensagem',
  REQ: 'Requerimento',
};

export const STATUS_CLASSES = {
  'Em tramitação': 'status-tramitando',
  'Aprovado': 'status-aprovado',
  'Aprovada': 'status-aprovado',
  'Transformado em norma jurídica': 'status-lei',
  'Lei': 'status-lei',
  'Arquivado': 'status-arquivado',
  'Arquivada': 'status-arquivado',
  'Vetado': 'status-vetado',
  'Vetada': 'status-vetado',
  'Prejudicado': 'status-prejudicado',
  'Prejudicada': 'status-prejudicado',
  'Retirado pelo Autor': 'status-arquivado',
};

export function getStatusClass(situacao) {
  if (!situacao) return 'status-tramitando';
  for (const [key, cls] of Object.entries(STATUS_CLASSES)) {
    if (situacao.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  if (situacao.toLowerCase().includes('lei')) return 'status-lei';
  if (situacao.toLowerCase().includes('aprovad')) return 'status-aprovado';
  if (situacao.toLowerCase().includes('arquivad')) return 'status-arquivado';
  if (situacao.toLowerCase().includes('vetad')) return 'status-vetado';
  if (situacao.toLowerCase().includes('prejudicad')) return 'status-prejudicado';
  return 'status-tramitando';
}

export function getUrgencyClass(regime) {
  if (!regime) return 'urgency-normal';
  const r = regime.toLowerCase();
  if (r.includes('urgência')) return 'urgency-urgente';
  if (r.includes('regime de urgência')) return 'urgency-regime-urgencia';
  if (r.includes('prioridade')) return 'urgency-prioridade';
  return 'urgency-normal';
}
