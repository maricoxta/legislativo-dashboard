import { NextRequest, NextResponse } from 'next/server'
import { listarProposicoesCamara } from '@/lib/server/camara'

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(await listarProposicoesCamara(req.nextUrl.searchParams))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
