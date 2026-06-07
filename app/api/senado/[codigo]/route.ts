import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'
import { SENADO_API } from '@/lib/config'

function normalize<T>(v: T | T[] | undefined): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

async function fetchJSON(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params
  const cacheKey = `senado:materia:${codigo}`

  const cached = await getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const [det, tram, com, rel, vot, tex] = await Promise.all([
      fetchJSON(`${SENADO_API}/materia/${codigo}`),
      fetchJSON(`${SENADO_API}/materia/${codigo}/tramitacao`).catch(() => null),
      fetchJSON(`${SENADO_API}/materia/${codigo}/comissoes`).catch(() => null),
      fetchJSON(`${SENADO_API}/materia/${codigo}/relatorias`).catch(() => null),
      fetchJSON(`${SENADO_API}/materia/${codigo}/votacoes`).catch(() => null),
      fetchJSON(`${SENADO_API}/materia/${codigo}/textos`).catch(() => null),
    ])

    const materia = det?.DetalheMateria?.Materia ?? null
    const tramitacao = normalize(tram?.MovimentacaoMateria?.Materia?.HistoricoSituacoes?.HistoricoSituacao)
    const comissoes = normalize(com?.MateriaComissoes?.Comissoes?.Comissao)
    const relatorias = normalize(rel?.RelatoriaMateria?.Materia?.Relatorias?.Relatoria)
    const votacoes = normalize(vot?.VotacaoMateria?.Votacoes?.Votacao)
    const textos = normalize(tex?.TextoMateria?.Materia?.Textos?.Texto)

    const data = { materia, tramitacao, comissoes, relatorias, votacoes, textos }
    await setCache(cacheKey, data, 60)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
