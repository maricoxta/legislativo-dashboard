import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'
import { SENADO_API } from '@/lib/config'
import { ProcessoSenado } from '@/types/senado'

// A API /processo não pagina e devolve os itens em ordem crescente de data.
// Para trazer os mais recentes primeiro, consultamos janelas de 30 dias
// de trás para frente até juntar `limite` itens ou chegar a 1º de janeiro.
const JANELA_DIAS = 30
const MAX_JANELAS = 13

const iso = (d: Date) => d.toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const sigla = sp.get('sigla') ?? ''
  const numero = sp.get('numero') ?? ''
  const termo = sp.get('termo') ?? ''
  const ano = Number(sp.get('ano')) || new Date().getFullYear()
  const limite = Math.min(Number(sp.get('limite')) || 20, 100)

  const cacheKey = `senado:processos:${sigla}:${numero}:${termo}:${ano}:${limite}`
  const cached = await getCached<ProcessoSenado[]>(cacheKey)
  if (cached) return NextResponse.json(cached)

  const inicioAno = new Date(Date.UTC(ano, 0, 1))
  const hoje = new Date()
  let fim = ano === hoje.getUTCFullYear() ? hoje : new Date(Date.UTC(ano, 11, 31))

  try {
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
    return NextResponse.json(processos)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
