import { NextRequest, NextResponse } from 'next/server'
import { buscarEmentaCamara, listarProposicoesCamara } from '@/lib/server/camara'
import { processosDoAno } from '@/lib/server/senado'
import { ProposicaoCamara } from '@/types/camara'
import { ResultadoMonitoramento } from '@/types/monitoramento'

// Proposições da Câmara que batem com QUALQUER palavra-chave do tema, de
// duas fontes somadas:
// 1. a ementa dos PLs na tabela camara_pl_situacao (job diário);
// 2. o parâmetro `keywords` da API, uma palavra por vez (só acha o que a
//    Câmara já indexou). Sem data a API só olha 30 dias de tramitação, e um
//    intervalo de datas maior que 3 meses dá erro 400; por isso consultamos
//    por ano (o corrente e o anterior).
// No Senado, /processo não busca por palavra: carregamos os PLs dos dois
// anos (mesma varredura em cache dos indicadores) e procuramos na ementa.

const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const POR_PALAVRA = 20
const MAX_PALAVRAS = 15

export async function GET(req: NextRequest) {
  const palavras = [...new Set(req.nextUrl.searchParams.getAll('kw').map(k => k.trim()).filter(Boolean))].slice(0, MAX_PALAVRAS)
  if (!palavras.length) return NextResponse.json({ dados: [] })

  const anoAtual = new Date().getFullYear()
  const anos = [anoAtual, anoAtual - 1]

  const resultados = await Promise.allSettled(palavras.flatMap(kw => anos.map(ano =>
    listarProposicoesCamara(new URLSearchParams({
      keywords: kw,
      ano: String(ano),
      itens: String(POR_PALAVRA),
      ordem: 'DESC',
      ordenarPor: 'id',
    })).then(r => ({ kw, dados: r.dados ?? [] }))
  )))

  const porId = new Map<number, { bill: ProposicaoCamara; palavras: string[] }>()

  const naEmenta = await buscarEmentaCamara(palavras, `${anoAtual - 1}-01-01`).catch(() => [])
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

  const senado = await Promise.allSettled(anos.map(ano => processosDoAno('PL', ano)))
  const doSenado: ResultadoMonitoramento[] = senado
    .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    .map(processo => {
      const ementa = semAcento(processo.ementa ?? '')
      return { casa: 'senado' as const, processo, palavras: palavras.filter(p => ementa.includes(semAcento(p))) }
    })
    .filter(r => r.palavras.length)

  const data = (r: ResultadoMonitoramento) => (r.casa === 'camara' ? r.bill.dataApresentacao : r.processo.dataApresentacao) ?? ''
  const dados: ResultadoMonitoramento[] = [
    ...[...porId.values()].map(v => ({ casa: 'camara' as const, ...v })),
    ...doSenado,
  ].sort((a, b) => data(b).localeCompare(data(a)))

  const falhas = [...resultados, ...senado].filter(r => r.status === 'rejected').length
  return NextResponse.json({ dados, falhas })
}
