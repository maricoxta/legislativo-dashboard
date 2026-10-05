import { NextRequest, NextResponse } from 'next/server'
import { listarProcessosSenado } from '@/lib/server/senado'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  try {
    const processos = await listarProcessosSenado({
      sigla: sp.get('sigla') ?? undefined,
      numero: sp.get('numero') ?? undefined,
      termo: sp.get('termo') ?? undefined,
      ano: Number(sp.get('ano')) || undefined,
      limite: Number(sp.get('limite')) || undefined,
    })
    return NextResponse.json(processos)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
