import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'
import { CAMARA_API } from '@/lib/config'

async function fetchJSON(url: string) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cacheKey = `camara:proposicao:${id}`

  const cached = await getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const [prop, tramitacoes, autores, relatores, votacoes] = await Promise.all([
      fetchJSON(`${CAMARA_API}/proposicoes/${id}`),
      fetchJSON(`${CAMARA_API}/proposicoes/${id}/tramitacoes?ordem=DESC`).then(d => d.dados ?? []).catch(() => []),
      fetchJSON(`${CAMARA_API}/proposicoes/${id}/autores`).then(d => d.dados ?? []).catch(() => []),
      fetchJSON(`${CAMARA_API}/proposicoes/${id}/relatores`).then(d => d.dados ?? []).catch(() => []),
      fetchJSON(`${CAMARA_API}/proposicoes/${id}/votacoes`).then(d => d.dados ?? []).catch(() => []),
    ])
    const data = { ...prop.dados, tramitacoes, autores, relatores, votacoes }
    await setCache(cacheKey, data, 60)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
