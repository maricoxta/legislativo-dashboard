import { NextRequest, NextResponse } from 'next/server'
import { buscarEmentaCamara, listarProposicoesCamara } from '@/lib/server/camara'
import { ProposicaoCamara } from '@/types/camara'

// Proposições da Câmara que batem com QUALQUER palavra-chave do tema, de
// duas fontes somadas:
// 1. a ementa dos PLs na tabela camara_pl_situacao (job diário);
// 2. o parâmetro `keywords` da API, uma palavra por vez (só acha o que a
//    Câmara já indexou). Sem data a API só olha 30 dias de tramitação, por
//    isso pedimos o que foi apresentado nos últimos 12 meses.
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

  const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const naEmenta = await buscarEmentaCamara(palavras, iso(umAnoAtras)).catch(() => [])
  for (const bill of naEmenta) {
    const ementa = semAcento(bill.ementa)
    porId.set(bill.id, { bill, palavras: palavras.filter(p => ementa.includes(semAcento(p))) })
  }

  for (const r of resultados) {
    if (r.status !== 'fulfilled') continue
    for (const bill of r.value.dados) {
      const item = porId.get(bill.id) ?? { bill, palavras: [] }
      if (!item.palavras.includes(r.value.kw)) item.palavras.push(r.value.kw)
      porId.set(bill.id, item)
    }
  }

  const dados = [...porId.values()].sort((a, b) => b.bill.id - a.bill.id)
  const falhas = resultados.filter(r => r.status === 'rejected').length
  return NextResponse.json({ dados, falhas })
}
