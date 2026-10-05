import { NextRequest, NextResponse } from 'next/server'
import { buscaAvancada } from '@/lib/server/busca'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const texto = (k: string) => sp.get(k)?.trim() || undefined
  try {
    return NextResponse.json(await buscaAvancada({
      q: texto('q'),
      numero: texto('numero'),
      tipo: texto('tipo'),
      ano: texto('ano'),
      codTema: texto('codTema'),
      partido: texto('partido'),
      uf: texto('uf'),
      camara: sp.get('camara') !== '0',
      senado: sp.get('senado') !== '0',
    }))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
