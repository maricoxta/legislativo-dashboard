import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'
import { SENADO_API } from '@/lib/config'
import { DetalheSenado, ProcessoDetalhadoSenado, RelatoriaSenado, VotacaoSenado } from '@/types/senado'

async function fetchJSON(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : [])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cacheKey = `senado:processo:${id}`

  const cached = await getCached<DetalheSenado>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const [processo, relatorias, votacoes] = await Promise.all([
      fetchJSON(`${SENADO_API}/processo/${id}`) as Promise<ProcessoDetalhadoSenado>,
      fetchJSON(`${SENADO_API}/processo/relatoria?idProcesso=${id}`).then(asArray<RelatoriaSenado>).catch(() => []),
      fetchJSON(`${SENADO_API}/votacao?idProcesso=${id}`).then(asArray<VotacaoSenado>).catch(() => []),
    ])

    // A tramitação vem embutida no detalhe: um histórico por autuação.
    const autuacoes = processo?.autuacoes ?? []
    const tramitacao = autuacoes
      .flatMap(a => a.informesLegislativos ?? [])
      .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))

    // Situação atual: a que não tem data de fim (ou a mais recente).
    const situacoes = autuacoes.flatMap(a => a.situacoes ?? [])
    const vigente = situacoes.find(s => !s.fim)
      ?? [...situacoes].sort((a, b) => (b.inicio ?? '').localeCompare(a.inicio ?? ''))[0]

    const data: DetalheSenado = {
      processo,
      tramitacao,
      situacaoAtual: vigente?.descricao ?? processo?.situacaoAtual ?? null,
      relatorias,
      votacoes,
    }
    await setCache(cacheKey, data, 60)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
