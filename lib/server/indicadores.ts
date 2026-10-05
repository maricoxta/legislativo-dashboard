import { CAMARA_API, SENADO_API } from '@/lib/config'
import { ProcessoSenado } from '@/types/senado'

// Indicadores de PLs do ano, por Casa. null = fonte indisponível no momento.
export interface IndicadoresCasa {
  total: number | null
  tramitando: number | null
  aprovadosOuLei: number | null
}

const CACHE = { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }

async function getJSON(url: string) {
  const res = await fetch(url, CACHE)
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`)
  return res.json()
}

// ---------- Câmara ----------
// A API não traz contagens prontas. Pedimos 1 item por página: o número da
// última página (links.last) é o total de registros do filtro.
async function contarCamara(ano: number, extra: Record<string, string> = {}): Promise<number> {
  const qs = new URLSearchParams({ siglaTipo: 'PL', ano: String(ano), itens: '1', ...extra })
  const d = await getJSON(`${CAMARA_API}/proposicoes?${qs}`)
  const last = (d.links ?? []).find((l: { rel: string }) => l.rel === 'last')
  if (!last) return (d.dados ?? []).length
  return Number(new URL(last.href).searchParams.get('pagina')) || 0
}

// Situações (codSituacao) agrupadas pela descrição oficial, lida em tempo de execução.
const RE_APROVADO_OU_LEI = /norma jur|aguardando san|aguardando promulga|remetida ao senado/i
const RE_ENCERRADA = /arquivad|norma jur|retirad|devolvid|prejudicad|vetad/i

async function indicadoresCamara(ano: number): Promise<IndicadoresCasa> {
  const ref = await getJSON(`${CAMARA_API}/referencias/proposicoes/codSituacao`)
  const situacoes: { cod: string | number; nome?: string; descricao?: string }[] = ref.dados ?? []
  const codigos = (re: RegExp) =>
    situacoes.filter(s => re.test(`${s.nome ?? ''} ${s.descricao ?? ''}`)).map(s => String(s.cod)).join(',')

  const codAprovado = codigos(RE_APROVADO_OU_LEI)
  const codEncerrada = codigos(RE_ENCERRADA)

  const [total, aprovadosOuLei, encerradas] = await Promise.all([
    contarCamara(ano),
    codAprovado ? contarCamara(ano, { codSituacao: codAprovado }) : Promise.resolve(null),
    codEncerrada ? contarCamara(ano, { codSituacao: codEncerrada }) : Promise.resolve(null),
  ])
  return {
    total,
    tramitando: encerradas === null ? null : Math.max(total - encerradas, 0),
    aprovadosOuLei,
  }
}

// ---------- Senado ----------
// /processo não pagina. Percorremos o ano em janelas de 7 dias; se uma janela
// vier com 100 itens ou mais (possível teto da API), ela é dividida ao meio.
const DIA = 864e5
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

async function processosNaJanela(inicio: number, fim: number): Promise<ProcessoSenado[]> {
  const qs = new URLSearchParams({ sigla: 'PL', dataInicioApresentacao: iso(inicio), dataFimApresentacao: iso(fim) })
  const lote = await getJSON(`${SENADO_API}/processo?${qs}`)
  const itens: ProcessoSenado[] = Array.isArray(lote) ? lote : []
  if (itens.length >= 100 && fim > inicio) {
    const meio = inicio + Math.floor((fim - inicio) / DIA / 2) * DIA
    const [a, b] = await Promise.all([processosNaJanela(inicio, meio), processosNaJanela(meio + DIA, fim)])
    return [...a, ...b]
  }
  return itens
}

async function indicadoresSenado(ano: number): Promise<IndicadoresCasa> {
  const inicioAno = Date.UTC(ano, 0, 1)
  const fimAno = Math.min(Date.UTC(ano, 11, 31), Date.now())
  const janelas: [number, number][] = []
  for (let t = inicioAno; t <= fimAno; t += 7 * DIA) janelas.push([t, Math.min(t + 6 * DIA, fimAno)])

  // No máximo 5 requisições simultâneas (a API recusa mais de 10 por segundo).
  const vistos = new Map<number, ProcessoSenado>()
  for (let i = 0; i < janelas.length; i += 5) {
    const lotes = await Promise.all(janelas.slice(i, i + 5).map(([a, b]) => processosNaJanela(a, b)))
    for (const p of lotes.flat()) vistos.set(p.id, p)
  }

  const todos = [...vistos.values()]
  return {
    total: todos.length,
    tramitando: todos.filter(p => p.tramitando === 'Sim').length,
    aprovadosOuLei: todos.filter(p => p.normaGerada || /APROVAD/.test(p.siglaTipoDeliberacao ?? '')).length,
  }
}

const VAZIO: IndicadoresCasa = { total: null, tramitando: null, aprovadosOuLei: null }

export async function indicadoresDoAno(ano: number) {
  const [camara, senado] = await Promise.allSettled([indicadoresCamara(ano), indicadoresSenado(ano)])
  return {
    camara: camara.status === 'fulfilled' ? camara.value : VAZIO,
    senado: senado.status === 'fulfilled' ? senado.value : VAZIO,
  }
}
