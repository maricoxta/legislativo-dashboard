import { getCached, setCache } from '@/lib/cache'
import { CAMARA_API } from '@/lib/config'
import { ProposicaoCamara } from '@/types/camara'

export interface ListaCamara {
  dados: ProposicaoCamara[]
  links?: { rel: string; href: string }[]
}

// Usado pela rota /api/camara/proposicoes e direto pelas páginas do servidor.
export async function listarProposicoesCamara(params: URLSearchParams): Promise<ListaCamara> {
  const qs = params.toString()
  const cacheKey = `camara:proposicoes:${qs}`

  const cached = await getCached<ListaCamara>(cacheKey)
  if (cached) return cached

  const res = await fetch(`${CAMARA_API}/proposicoes?${qs}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ListaCamara = await res.json()
  await setCache(cacheKey, data, 30)
  return data
}

const CACHE_HORA = { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }

async function getJSON(url: string) {
  const res = await fetch(url, CACHE_HORA)
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`)
  return res.json()
}

// Executa as tarefas com no máximo `n` requisições ao mesmo tempo.
async function emLotes<T, R>(itens: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < itens.length; i += n) out.push(...(await Promise.all(itens.slice(i, i + n).map(fn))))
  return out
}

// A API não traz contagens prontas. Pedimos 1 item por página: o número da
// última página (links.last) é o total de registros do filtro.
export async function contarCamara(siglaTipo: string, ano: number, codSituacao?: number): Promise<number> {
  const qs = new URLSearchParams({ siglaTipo, ano: String(ano), itens: '1' })
  if (codSituacao !== undefined) qs.set('codSituacao', String(codSituacao))
  const d = await getJSON(`${CAMARA_API}/proposicoes?${qs}`)
  const last = (d.links ?? []).find((l: { rel: string }) => l.rel === 'last')
  if (!last) return (d.dados ?? []).length
  return Number(new URL(last.href).searchParams.get('pagina')) || 0
}

// Soma as contagens de cada código de situação, um código por requisição.
// Se algum código devolver o total do ano, a API ignorou o filtro: preferimos
// não mostrar número a mostrar um número errado.
export async function contarCamaraPorCodigos(siglaTipo: string, ano: number, codigos: number[], total: number): Promise<number> {
  const parciais = await emLotes(codigos, 6, c => contarCamara(siglaTipo, ano, c))
  if (total > 10 && parciais.some(n => n >= total)) throw new Error('A API da Câmara ignorou o filtro codSituacao')
  return parciais.reduce((a, b) => a + b, 0)
}

export async function codigosSituacaoCamara(): Promise<number[]> {
  const ref = await getJSON(`${CAMARA_API}/referencias/proposicoes/codSituacao`)
  return (ref.dados ?? []).map((s: { cod: string | number }) => Number(s.cod)).filter((n: number) => !isNaN(n))
}

// Lista as proposições do ano em um conjunto de situações: até 100 por código
// (as mais recentes), juntas e ordenadas da mais nova para a mais antiga.
export async function listarCamaraPorCodigos(siglaTipo: string, ano: number, codigos: number[]): Promise<ProposicaoCamara[]> {
  const lotes = await emLotes(codigos, 6, async c => {
    const qs = new URLSearchParams({ siglaTipo, ano: String(ano), codSituacao: String(c), itens: '100', ordem: 'DESC', ordenarPor: 'id' })
    const d = await getJSON(`${CAMARA_API}/proposicoes?${qs}`)
    return (d.dados ?? []) as ProposicaoCamara[]
  })
  const vistos = new Map<number, ProposicaoCamara>()
  for (const p of lotes.flat()) vistos.set(p.id, p)
  return [...vistos.values()].sort((a, b) => b.id - a.id)
}
