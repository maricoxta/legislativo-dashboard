import Link from 'next/link'
import { connection } from 'next/server'
import { TemaCard } from '@/components/temas/TemaCard'
import { anosDisponiveis, SeletorAno } from '@/components/temas/SeletorAno'
import { listarPorTema } from '@/lib/server/temas'
import { PlTema } from '@/types/temas'

const POR_PAGINA = 20
const CASAS = [
  { id: null, nome: 'As duas Casas' },
  { id: 'camara', nome: 'Câmara' },
  { id: 'senado', nome: 'Senado' },
] as const

interface Props {
  params: Promise<{ tema: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function TemaPage({ params, searchParams }: Props) {
  await connection()
  const bruto = (await params).tema
  let tema = bruto
  try {
    tema = decodeURIComponent(bruto)
  } catch {}
  const sp = await searchParams
  const pedido = parseInt(sp.ano ?? '')
  const ano = anosDisponiveis().includes(pedido) ? pedido : new Date().getFullYear()
  const casa = sp.casa === 'camara' || sp.casa === 'senado' ? sp.casa : null
  const page = parseInt(sp.pagina ?? '1') || 1

  let dados: PlTema[] = []
  let total = 0
  let erro = false
  try {
    ;({ dados, total } = await listarPorTema(tema, ano, casa, page, POR_PAGINA))
  } catch { erro = true }
  const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA))
  const link = (mudar: Record<string, string | null>) => {
    const qs = new URLSearchParams({ ano: String(ano), ...(casa ? { casa } : {}) })
    for (const [k, v] of Object.entries(mudar)) {
      if (v === null) qs.delete(k)
      else qs.set(k, v)
    }
    return `/temas/${encodeURIComponent(tema)}?${qs}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/temas?ano=${ano}`} className="text-xs text-indigo-600 hover:underline">← Todos os temas</Link>
          <h1 className="text-xl font-bold text-slate-900">{tema}</h1>
          <p className="text-sm text-slate-500">Projetos de lei apresentados em {ano} com este tema</p>
        </div>
        <SeletorAno ano={ano} href={a => link({ ano: String(a), pagina: null })} />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        {CASAS.map(c => (
          <a key={c.nome} href={link({ casa: c.id, pagina: null })}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${c.id === casa ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {c.nome}
          </a>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500"><strong className="text-slate-800">{total.toLocaleString('pt-BR')}</strong> projetos · pág. {page}/{totalPages}</p>
        <div className="flex gap-2">
          {total > 0 && (
            <a href={`/temas/${encodeURIComponent(tema)}/csv?${new URLSearchParams({ ano: String(ano), ...(casa ? { casa } : {}) })}`}
              className="px-3 py-1.5 text-xs border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50">
              Baixar CSV
            </a>
          )}
          {page > 1 && <a href={link({ pagina: String(page - 1) })} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">← Anterior</a>}
          {page < totalPages && <a href={link({ pagina: String(page + 1) })} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">Próxima →</a>}
        </div>
      </div>

      <div className="space-y-3">
        {dados.length
          ? dados.map(pl => <TemaCard key={`${pl.casa}-${pl.id}`} pl={pl} ano={ano} />)
          : <p className="text-center text-slate-400 py-12 text-sm">{erro ? 'Não foi possível ler os temas agora. Tente de novo em instantes.' : 'Nenhum projeto com este tema no ano.'}</p>}
      </div>
    </div>
  )
}
