import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'
import { SENADO_API } from '@/lib/config'

function normalize<T>(v: T | T[] | undefined): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString()
  const cacheKey = `senado:materias:${params}`

  const cached = await getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const res = await fetch(`${SENADO_API}/materia/pesquisa/lista?${params}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const materias = normalize(json?.PesquisaBasicaMateria?.Materias?.Materia)
    await setCache(cacheKey, materias, 30)
    return NextResponse.json(materias)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
