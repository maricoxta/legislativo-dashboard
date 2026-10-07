import { anosDisponiveis } from '@/components/temas/SeletorAno'
import { todosPorTema } from '@/lib/server/temas'

// CSV com os PLs de um tema no ano, no formato que o Excel em português abre
// direto: separador ";" e BOM para manter os acentos.
const COLUNAS = ['Casa', 'Identificação', 'Data de apresentação', 'Ementa', 'Temas', 'Tema principal', 'Origem do tema', 'Probabilidade do tema']

function celula(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(request: Request, ctx: { params: Promise<{ tema: string }> }) {
  const bruto = (await ctx.params).tema
  let tema = bruto
  try {
    tema = decodeURIComponent(bruto)
  } catch {}
  const sp = new URL(request.url).searchParams
  const pedido = parseInt(sp.get('ano') ?? '')
  const ano = anosDisponiveis().includes(pedido) ? pedido : new Date().getFullYear()
  const casa = sp.get('casa') === 'camara' || sp.get('casa') === 'senado' ? (sp.get('casa') as 'camara' | 'senado') : null

  let pls
  try {
    pls = await todosPorTema(tema, ano, casa)
  } catch {
    return new Response('Não foi possível ler os temas agora. Tente de novo em instantes.', { status: 503 })
  }

  const linhas = pls.map(pl => [
    pl.casa === 'camara' ? 'Câmara' : 'Senado',
    pl.identificacao,
    pl.data_apresentacao?.split('-').reverse().join('/'),
    pl.ementa,
    pl.temas.join(' | '),
    pl.tema_principal,
    pl.origem === 'oficial' ? 'Oficial (Câmara)' : 'Previsto pelo modelo',
    pl.probabilidades?.[tema] != null ? String(pl.probabilidades[tema]).replace('.', ',') : '',
  ].map(celula).join(';'))
  const corpo = '﻿' + [COLUNAS.join(';'), ...linhas].join('\r\n') + '\r\n'

  const nome = `pls-${tema.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}-${ano}${casa ? `-${casa}` : ''}.csv`
  return new Response(corpo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nome}"`,
    },
  })
}
