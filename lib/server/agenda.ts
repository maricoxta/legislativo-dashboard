import { CAMARA_API, SENADO_API } from '@/lib/config'
import { EventoCamara } from '@/types/camara'

// Evento da agenda já normalizado: Câmara e Senado no mesmo formato.
export interface EventoAgenda {
  casa: 'camara' | 'senado'
  data: string // AAAA-MM-DD
  hora: string // HH:mm ou ''
  tipo: string
  orgao: string
  descricao: string
  local: string
  url?: string
}

const REVALIDATE = { next: { revalidate: 600 } }
const JSON_HEADERS = { headers: { Accept: 'application/json' } }

// A API do Senado (XML convertido) devolve objeto quando há um único item.
function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

const compacta = (d: string) => d.replaceAll('-', '')

async function getJSON(url: string) {
  const res = await fetch(url, { ...JSON_HEADERS, ...REVALIDATE })
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`)
  return res.json()
}

async function agendaCamara(inicio: string, fim: string): Promise<EventoAgenda[]> {
  const d = await getJSON(`${CAMARA_API}/eventos?dataInicio=${inicio}&dataFim=${fim}&itens=100&ordem=ASC&ordenarPor=dataHoraInicio`)
  return asArray<EventoCamara>(d.dados).map(e => ({
    casa: 'camara',
    data: (e.dataHoraInicio ?? '').slice(0, 10),
    hora: (e.dataHoraInicio ?? '').slice(11, 16),
    tipo: e.descricaoTipo ?? 'Evento',
    orgao: (e.orgaos ?? []).map(o => o.sigla ?? o.apelido).filter(Boolean).join(', '),
    descricao: e.descricao ?? '',
    local: e.localCamara?.nome ?? '',
    url: e.urlRegistro,
  }))
}

interface ReuniaoSenado {
  codigo?: string
  titulo?: string
  dataInicio?: string
  local?: string
  situacao?: string
  colegiadoCriador?: { sigla?: string }
  tipo?: { descricao?: string }
  partes?: { descricaoTipo?: string; nome?: string } | { descricaoTipo?: string; nome?: string }[]
}

// Reuniões de comissão (inclui audiências públicas). Consultamos semana a semana
// para manter cada resposta pequena.
async function agendaComissoesSenado(inicio: string, fim: string): Promise<EventoAgenda[]> {
  const janelas: [string, string][] = []
  for (let d = new Date(`${inicio}T00:00:00Z`); d <= new Date(`${fim}T00:00:00Z`); d = new Date(d.getTime() + 7 * 864e5)) {
    const ate = new Date(Math.min(d.getTime() + 6 * 864e5, new Date(`${fim}T00:00:00Z`).getTime()))
    janelas.push([d.toISOString().slice(0, 10), ate.toISOString().slice(0, 10)])
  }
  const lotes = await Promise.all(janelas.map(([a, b]) =>
    getJSON(`${SENADO_API}/comissao/agenda/${compacta(a)}/${compacta(b)}.json`)
      .then(j => asArray<ReuniaoSenado>(j?.AgendaReuniao?.reunioes?.reuniao))
      .catch(() => [] as ReuniaoSenado[])
  ))
  return lotes.flat().map(r => {
    const partes = asArray(r.partes).map(p => p.descricaoTipo ?? p.nome).filter(Boolean)
    return {
      casa: 'senado',
      data: (r.dataInicio ?? '').slice(0, 10),
      hora: (r.dataInicio ?? '').slice(11, 16),
      tipo: partes.join(' + ') || r.tipo?.descricao || 'Reunião',
      orgao: r.colegiadoCriador?.sigla ?? '',
      descricao: [r.titulo, r.situacao && r.situacao !== 'Agendada' ? `(${r.situacao})` : ''].filter(Boolean).join(' '),
      local: r.local ?? '',
      url: r.codigo ? `https://legis.senado.leg.br/comissoes/reuniao?reuniao=${r.codigo}` : undefined,
    } satisfies EventoAgenda
  })
}

interface SessaoPlenario {
  Data?: string
  Hora?: string
  TipoSessao?: string
  LocalSessao?: string
  CodigoSessao?: string
  Casa?: string
  SituacaoSessao?: string
}

// Sessões do Plenário (Senado e Congresso), consultadas mês a mês.
async function agendaPlenarioSenado(inicio: string, fim: string): Promise<EventoAgenda[]> {
  const meses = [...new Set([inicio.slice(0, 7), fim.slice(0, 7)])]
  const lotes = await Promise.all(meses.map(m =>
    getJSON(`${SENADO_API}/plenario/agenda/mes/${compacta(m)}01.json`)
      .then(j => asArray<SessaoPlenario>(j?.AgendaPlenario?.Sessoes?.Sessao))
      .catch(() => [] as SessaoPlenario[])
  ))
  return lotes.flat()
    .filter(s => s.Data && s.Data >= inicio && s.Data <= fim)
    .map(s => ({
      casa: 'senado',
      data: s.Data ?? '',
      hora: s.Hora ?? '',
      tipo: 'Sessão Plenária',
      orgao: s.Casa === 'CN' ? 'Congresso' : 'Plenário',
      descricao: [(s.TipoSessao ?? '').trim(), s.SituacaoSessao && s.SituacaoSessao !== 'Agendada' ? `(${s.SituacaoSessao})` : ''].filter(Boolean).join(' '),
      local: s.LocalSessao ?? '',
    }) satisfies EventoAgenda)
}

// Agenda consolidada das duas Casas. Uma fonte fora do ar não derruba as outras.
export async function agendaLegislativa(inicio: string, fim: string): Promise<EventoAgenda[]> {
  const fontes = await Promise.allSettled([
    agendaCamara(inicio, fim),
    agendaComissoesSenado(inicio, fim),
    agendaPlenarioSenado(inicio, fim),
  ])
  return fontes
    .flatMap(f => (f.status === 'fulfilled' ? f.value : []))
    .filter(e => e.data)
    .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`))
}
