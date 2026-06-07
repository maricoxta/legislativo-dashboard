import { BillCard } from '@/components/proposicoes/BillCard'
import { ProposicaoFilters } from '@/components/proposicoes/Filters'
import { ProposicaoCamara } from '@/types/camara'
import { CAMARA_TEMAS, TIPO_SIGLAS } from '@/lib/config'

interface Props {
  params: Promise<{ tipo: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function CamaraListPage({ params, searchParams }: Props) {
  const { tipo } = await params
  const sp = await searchParams
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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

  const res = await fetch(`${base}/api/camara/proposicoes?${qs}`, { cache: 'no-store' })
  const data: { dados: ProposicaoCamara[]; links?: { rel: string; href: string }[] } = res.ok ? await res.json() : { dados: [] }
  const bills = data.dados ?? []

  const lastLink = data.links?.find(l => l.rel === 'last')
  let totalPages = 1
  if (lastLink) {
    try { totalPages = parseInt(new URL(lastLink.href).searchParams.get('pagina') ?? '1') } catch {}
  }
  const page = parseInt(sp.pagina ?? '1')

  const tema = isTema ? CAMARA_TEMAS.find(t => t.cod === Number(tipo)) : null
  const title = tema ? `${tema.emoji} ${tema.nome}` : (TIPO_SIGLAS[tipo] ?? tipo)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">Câmara dos Deputados</p>
      </div>

      <ProposicaoFilters source="camara" tipo={isTema ? undefined : tipo} codTema={isTema ? tipo : undefined} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500"><strong className="text-gray-800">{bills.length}</strong> proposições · pág. {page}/{totalPages}</p>
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
          : <p className="text-center text-gray-400 py-12 text-sm">Nenhuma proposição encontrada.</p>}
      </div>
    </div>
  )
}
