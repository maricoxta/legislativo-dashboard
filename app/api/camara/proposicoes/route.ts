import { NextRequest, NextResponse } from 'next/server'
import { listarPorAutorCamara, listarProposicoesCamara } from '@/lib/server/camara'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  try {
    if (sp.get('autor')) return NextResponse.json(await listarPorAutorCamara(sp))
    return NextResponse.json(await listarProposicoesCamara(sp))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
