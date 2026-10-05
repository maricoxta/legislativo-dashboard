import { ProposicaoCamara } from '@/types/camara'
import { BillCard } from '@/components/proposicoes/BillCard'
import { ProposicaoFilters } from '@/components/proposicoes/Filters'
import { listarProposicoesCamara, listarSituacaoCamara, ListaCamara } from '@/lib/server/camara'
import { filtroStatusCamara } from '@/lib/server/indicadores'
import { CAMARA_TEMAS, TIPO_SIGLAS } from '@/lib/config'
import { STATUS_PL, isStatusPL } from '@/lib/situacoes'

const POR_PAGINA = 20

interface Props {
  params: Promise<{ tipo: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function CamaraListPage({ params, searchParams }: Props) {
  const { tipo } = await params
  const sp = await searchParams
  const isTema = !isNaN(Number(tipo))
  const qs = new URLSearchParams({
    itens: '20',
    ordem: 'DESC',
    ordenarPor: 'dataApresentacao',
    ...(isTema ? { codTema: tipo } : { siglaTipo: tipo }),
    ...(sp.ano ? { ano: sp.ano } : {}),
    ...(sp.keywords ? { keywords: sp.keywords } : {}),
    ...(sp.pagina ? { pagina: sp.pagina } : {}),
  })

  const page = parseInt(sp.pagina ?? '1') || 1
  // ?status= vem dos cards do dashboard: filtra pelos códigos de situação do grupo.
  const status = tipo === 'PL' && isStatusPL(sp.status) ? sp.status : null
  let bills: ProposicaoCamara[] = []
  let totalPages = 1
  let erro = false
  let totalStatus = 0

  if (status) {
    try {
      const ano = Number(sp.ano) || new Date().getFullYear()
      // Só PLs têm situação carregada (tabela camara_pl_situacao).
      const r = await listarSituacaoCamara(filtroStatusCamara(ano, status), page, POR_PAGINA)
      bills = r.dados
      totalStatus = r.total
      totalPages = Math.max(1, Math.ceil(r.total / POR_PAGINA))
    } catch { erro = true }
  } else {
    let data: ListaCamara = { dados: [] }
    try { data = await listarProposicoesCamara(qs) } catch { erro = true }
    bills = data.dados ?? []
    const lastLink = data.links?.find(l => l.rel === 'last')
    if (lastLink) {
      try { totalPages = parseInt(new URL(lastLink.href).searchParams.get('pagina') ?? '1') } catch {}
    }
  }

  const tema = isTema ? CAMARA_TEMAS.find(t => t.cod === Number(tipo)) : null
  const title = tema ? `${tema.emoji} ${tema.nome}` : (TIPO_SIGLAS[tipo] ?? tipo)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">Câmara dos Deputados{sp.ano ? ` · apresentados em ${sp.ano}` : ''}</p>
        {status && (
          <p className="text-sm text-gray-700 mt-1">
            <strong>{STATUS_PL[status].titulo}</strong>: {STATUS_PL[status].descricao}.{' '}
            <a href={`?${new URLSearchParams({ ano: sp.ano ?? '' })}`} className="text-blue-600 hover:underline">Ver todos</a>
          </p>
        )}
      </div>

      <ProposicaoFilters source="camara" tipo={isTema ? undefined : tipo} codTema={isTema ? tipo : undefined} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500"><strong className="text-gray-800">{(status ? totalStatus : bills.length).toLocaleString('pt-BR')}</strong> proposições · pág. {page}/{totalPages}</p>
        <div className="flex gap-2">
          {page > 1 && (
            <a href={`?${new URLSearchParams({ ...sp, pagina: String(page - 1) })}`}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">← Anterior</a>
          )}
          {page < totalPages && (
            <a href={`?${new URLSearchParams({ ...sp, pagina: String(page + 1) })}`}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Próxima →</a>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {bills.length
          ? bills.map(b => <BillCard key={b.id} bill={b} />)
          : <p className="text-center text-gray-400 py-12 text-sm">{erro ? 'A API da Câmara não respondeu. Tente de novo em instantes.' : 'Nenhuma proposição encontrada.'}</p>}
      </div>
    </div>
  )
}
