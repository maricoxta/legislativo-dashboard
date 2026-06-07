import { NextRequest, NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/cache'
import { CAMARA_API } from '@/lib/config'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString()
  const cacheKey = `camara:proposicoes:${params}`

  const cached = await getCached(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const res = await fetch(`${CAMARA_API}/proposicoes?${params}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    await setCache(cacheKey, data, 30)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
