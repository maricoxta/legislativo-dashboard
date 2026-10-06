'use client'
import Link from 'next/link'
import { useDrawer } from '@/components/detalhe/DrawerProvider'
import { formatDate, truncate } from '@/lib/utils'
import { PlTema } from '@/types/temas'

const pct = (p: number) => `${Math.round(p * 100)}%`

// Card de um PL na lista de um tema. Mostra de onde veio cada tema: a
// indexação oficial da Câmara ou a previsão do modelo, com a probabilidade.
export function TemaCard({ pl, ano }: { pl: PlTema; ano: number }) {
  const { open } = useDrawer()
  const camara = pl.casa === 'camara'
  const [sigla, numAno] = (pl.identificacao ?? '').split(' ')
  return (
    <div
      onClick={() => open(pl.id, pl.casa)}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 text-sm font-bold px-3 py-1.5 rounded-lg text-center min-w-[80px] ${camara ? 'text-teal-700 bg-teal-50' : 'text-violet-700 bg-violet-50'}`}>
          <div>{sigla || 'PL'}</div>
          <div className="text-xs font-normal">{numAno ?? '—'}</div>
          <div className="text-[10px] font-medium mt-0.5">{camara ? 'Câmara' : 'Senado'}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 leading-snug">{truncate(pl.ementa, 220)}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {pl.temas.map(t => (
              <Link key={t} href={`/temas/${encodeURIComponent(t)}?ano=${ano}`} onClick={e => e.stopPropagation()}
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full hover:bg-indigo-100">
                {t}{pl.probabilidades?.[t] !== undefined && <span className="text-indigo-400"> · {pct(pl.probabilidades[t])}</span>}
              </Link>
            ))}
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${pl.origem === 'oficial' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
              title={pl.origem === 'oficial' ? 'Tema atribuído pela indexação oficial da Câmara' : 'Tema previsto pelo modelo de classificação; a porcentagem é a probabilidade estimada'}>
              {pl.origem === 'oficial' ? 'tema oficial da Câmara' : 'tema previsto pelo modelo'}
            </span>
          </div>
          {/* Data sem horário: meio-dia evita voltar um dia no fuso de Brasília. */}
          <p className="text-xs text-slate-400 mt-2">📅 {formatDate(pl.data_apresentacao ? `${pl.data_apresentacao}T12:00:00` : null)}</p>
        </div>
      </div>
    </div>
  )
}
