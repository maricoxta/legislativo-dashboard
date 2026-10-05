import { NextRequest, NextResponse } from 'next/server'
import { listarProposicoesCamara } from '@/lib/server/camara'
import { ProposicaoCamara } from '@/types/camara'

// Proposições da Câmara que batem com QUALQUER palavra-chave do tema.
// A API aceita uma palavra por vez em `keywords`; consultamos cada uma e
// juntamos o resultado, guardando quais palavras encontraram cada proposição.
// Sem parâmetro de data a API só olha os últimos 30 dias de tramitação, por
// isso buscamos o que foi apresentado nos últimos 12 meses.
const POR_PALAVRA = 20
const MAX_PALAVRAS = 15

export async function GET(req: NextRequest) {
  const palavras = [...new Set(req.nextUrl.searchParams.getAll('kw').map(k => k.trim()).filter(Boolean))].slice(0, MAX_PALAVRAS)
  if (!palavras.length) return NextResponse.json({ dados: [] })

  const hoje = new Date()
  const umAnoAtras = new Date(hoje.getTime() - 365 * 864e5)
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  const resultados = await Promise.allSettled(palavras.map(kw =>
    listarProposicoesCamara(new URLSearchParams({
      keywords: kw,
      dataApresentacaoInicio: iso(umAnoAtras),
      dataApresentacaoFim: iso(hoje),
      itens: String(POR_PALAVRA),
      ordem: 'DESC',
      ordenarPor: 'id',
    })).then(r => ({ kw, dados: r.dados ?? [] }))
  ))

  const porId = new Map<number, { bill: ProposicaoCamara; palavras: string[] }>()
  for (const r of resultados) {
    if (r.status !== 'fulfilled') continue
    for (const bill of r.value.dados) {
      const item = porId.get(bill.id) ?? { bill, palavras: [] }
      item.palavras.push(r.value.kw)
      porId.set(bill.id, item)
    }
  }

  const dados = [...porId.values()].sort((a, b) => b.bill.id - a.bill.id)
  const falhas = resultados.filter(r => r.status === 'rejected').length
  return NextResponse.json({ dados, falhas })
}
