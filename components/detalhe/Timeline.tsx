import { TramitacaoCamara } from '@/types/camara'
import { InformeLegislativoSenado } from '@/types/senado'
import { formatDate, truncate } from '@/lib/utils'

export function TimelineCamara({ items }: { items: TramitacaoCamara[] }) {
  return (
    <div className="relative pl-6 border-l-2 border-slate-100 space-y-4">
      {items.map((t, i) => (
        <div key={i} className="relative">
          <div className={`absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full border-2 border-white
            ${i === 0 ? 'bg-amber-400 shadow-[0_0_0_2px_#fbbf24]' : 'bg-indigo-400'}`} />
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {t.siglaOrgao && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{t.siglaOrgao}</span>
            )}
            <span className="text-xs font-medium text-slate-700">{t.descricaoTramitacao ?? '—'}</span>
            <span className="text-xs text-slate-400 ml-auto">{formatDate(t.dataHora)}</span>
          </div>
          {t.descricaoSituacao && <p className="text-xs text-slate-500">{t.descricaoSituacao}</p>}
          {t.despacho && <p className="text-xs text-slate-400 italic mt-0.5">{truncate(t.despacho, 140)}</p>}
        </div>
      ))}
    </div>
  )
}

export function TimelineSenado({ items }: { items: InformeLegislativoSenado[] }) {
  return (
    <div className="relative pl-6 border-l-2 border-slate-100 space-y-4">
      {items.map((t, i) => (
        <div key={t.id ?? i} className="relative">
          <div className={`absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full border-2 border-white
            ${i === 0 ? 'bg-amber-400 shadow-[0_0_0_2px_#fbbf24]' : 'bg-violet-400'}`} />
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {t.colegiado?.sigla && (
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{t.colegiado.sigla}</span>
            )}
            <span className="text-xs font-medium text-slate-700">{truncate(t.descricao ?? '—', 180)}</span>
            <span className="text-xs text-slate-400 ml-auto">{formatDate(t.data?.replace(' ', 'T'))}</span>
          </div>
          {t.colegiado?.nome && <p className="text-xs text-slate-500">{t.colegiado.nome}</p>}
        </div>
      ))}
    </div>
  )
}
