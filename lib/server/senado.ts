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
  ano?: number
  limite?: number
}

// Usado pela rota /api/senado/processos e direto pelas páginas do servidor.
export async function listarProcessosSenado(f: FiltroSenado): Promise<ProcessoSenado[]> {
  const sigla = f.sigla ?? ''
  const numero = f.numero ?? ''
  const termo = f.termo ?? ''
  const ano = f.ano || new Date().getFullYear()
  const limite = Math.min(f.limite || 20, 100)

  const cacheKey = `senado:processos:${sigla}:${numero}:${termo}:${ano}:${limite}`
  const cached = await getCached<ProcessoSenado[]>(cacheKey)
  if (cached) return cached

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
