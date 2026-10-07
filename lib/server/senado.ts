import { getCached, setCache } from '@/lib/cache'
import { SENADO_API } from '@/lib/config'
import { ProcessoSenado } from '@/types/senado'

// A API /processo não pagina e devolve os itens em ordem crescente de data.
// Para trazer os mais recentes primeiro, consultamos janelas de 30 dias
// de trás para frente até juntar `limite` itens ou chegar a 1º de janeiro.
const JANELA_DIAS = 30
const MAX_JANELAS = 13

const iso = (d: Date) => d.toISOString().slice(0, 10)

export interface FiltroSenado {
  sigla?: string
  numero?: string
  termo?: string
  autor?: string
  ano?: number
  limite?: number
}

// Com o nome do autor, o resultado é pequeno e a API aceita a consulta sem
// datas: uma chamada traz todos os anos (ou só o ano escolhido).
async function processosPorAutor(f: FiltroSenado, limite: number): Promise<ProcessoSenado[]> {
  const qs = new URLSearchParams({ autor: f.autor ?? '' })
  if (f.ano) qs.set('ano', String(f.ano))
  if (f.sigla) qs.set('sigla', f.sigla)
  if (f.numero) qs.set('numero', f.numero)
  if (f.termo) qs.set('termo', f.termo)

  const res = await fetch(`${SENADO_API}/processo?${qs}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const lote: ProcessoSenado[] = await res.json()
  return (Array.isArray(lote) ? lote : [])
    .sort((a, b) => (b.dataApresentacao ?? '').localeCompare(a.dataApresentacao ?? ''))
    .slice(0, limite)
}

// Usado pela rota /api/senado/processos e direto pelas páginas do servidor.
export async function listarProcessosSenado(f: FiltroSenado): Promise<ProcessoSenado[]> {
  const sigla = f.sigla ?? ''
  const numero = f.numero ?? ''
  const termo = f.termo ?? ''
  const autor = f.autor ?? ''
  const ano = f.ano || new Date().getFullYear()
  const limite = Math.min(f.limite || 20, 100)

  const cacheKey = `senado:processos:${sigla}:${numero}:${termo}:${autor}:${f.ano ?? ''}:${ano}:${limite}`
  const cached = await getCached<ProcessoSenado[]>(cacheKey)
  if (cached) return cached

  if (autor) {
    try {
      const processos = await processosPorAutor(f, limite)
      await setCache(cacheKey, processos, 30)
      return processos
    } catch {
      // Se a API exigir datas, segue pelas janelas abaixo, filtrando pelo autor.
    }
  }

  const inicioAno = new Date(Date.UTC(ano, 0, 1))
  const hoje = new Date()
  let fim = ano === hoje.getUTCFullYear() ? hoje : new Date(Date.UTC(ano, 11, 31))

  const vistos = new Map<number, ProcessoSenado>()
  for (let i = 0; i < MAX_JANELAS && fim >= inicioAno && vistos.size < limite; i++) {
    const inicio = new Date(Math.max(fim.getTime() - (JANELA_DIAS - 1) * 864e5, inicioAno.getTime()))
    const qs = new URLSearchParams({
      dataInicioApresentacao: iso(inicio),
      dataFimApresentacao: iso(fim),
    })
    if (sigla) qs.set('sigla', sigla)
    if (numero) qs.set('numero', numero)
    if (termo) qs.set('termo', termo)
    if (autor) qs.set('autor', autor)

    const res = await fetch(`${SENADO_API}/processo?${qs}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const lote: ProcessoSenado[] = await res.json()
    for (const p of Array.isArray(lote) ? lote : []) vistos.set(p.id, p)

    fim = new Date(inicio.getTime() - 864e5)
  }

  const processos = [...vistos.values()]
    .sort((a, b) => (b.dataApresentacao ?? '').localeCompare(a.dataApresentacao ?? ''))
    .slice(0, limite)

  await setCache(cacheKey, processos, 30)
  return processos
}

// Todos os processos de um tipo apresentados no ano. /processo não pagina:
// percorremos o ano em janelas de 7 dias e dividimos ao meio a janela que
// vier com 100 itens ou mais (possível teto da API).
const DIA = 864e5
const isoT = (t: number) => new Date(t).toISOString().slice(0, 10)
const CACHE_ANO = { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }

async function processosNaJanela(sigla: string, inicio: number, fim: number): Promise<ProcessoSenado[]> {
  const qs = new URLSearchParams({ sigla, dataInicioApresentacao: isoT(inicio), dataFimApresentacao: isoT(fim) })
  const res = await fetch(`${SENADO_API}/processo?${qs}`, CACHE_ANO)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const lote = await res.json()
  const itens: ProcessoSenado[] = Array.isArray(lote) ? lote : []
  if (itens.length >= 100 && fim > inicio) {
    const meio = inicio + Math.floor((fim - inicio) / DIA / 2) * DIA
    const [a, b] = await Promise.all([processosNaJanela(sigla, inicio, meio), processosNaJanela(sigla, meio + DIA, fim)])
    return [...a, ...b]
  }
  return itens
}

export async function processosDoAno(sigla: string, ano: number): Promise<ProcessoSenado[]> {
  const inicioAno = Date.UTC(ano, 0, 1)
  const fimAno = Math.min(Date.UTC(ano, 11, 31), Date.now())
  const janelas: [number, number][] = []
  for (let t = inicioAno; t <= fimAno; t += 7 * DIA) janelas.push([t, Math.min(t + 6 * DIA, fimAno)])

  // No máximo 5 requisições simultâneas (a API recusa mais de 10 por segundo).
  const vistos = new Map<number, ProcessoSenado>()
  for (let i = 0; i < janelas.length; i += 5) {
    const lotes = await Promise.all(janelas.slice(i, i + 5).map(([a, b]) => processosNaJanela(sigla, a, b)))
    for (const p of lotes.flat()) vistos.set(p.id, p)
  }
  return [...vistos.values()].sort((a, b) => (b.dataApresentacao ?? '').localeCompare(a.dataApresentacao ?? ''))
}
