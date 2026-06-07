import { TramitacaoCamara } from '@/types/camara'
import { TramitacaoSenado } from '@/types/senado'
import { formatDate, truncate } from '@/lib/utils'

export function TimelineCamara({ items }: { items: TramitacaoCamara[] }) {
  return (
    <div className="relative pl-6 border-l-2 border-gray-100 space-y-4">
      {items.map((t, i) => (
        <div key={i} className="relative">
          <div className={`absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full border-2 border-white
            ${i === 0 ? 'bg-amber-400 shadow-[0_0_0_2px_#fbbf24]' : 'bg-blue-400'}`} />
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {t.siglaOrgao && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{t.siglaOrgao}</span>
            )}
            <span className="text-xs font-medium text-gray-700">{t.descricaoTramitacao ?? '—'}</span>
            <span className="text-xs text-gray-400 ml-auto">{formatDate(t.dataHora)}</span>
          </div>
          {t.descricaoSituacao && <p className="text-xs text-gray-500">{t.descricaoSituacao}</p>}
          {t.despacho && <p className="text-xs text-gray-400 italic mt-0.5">{truncate(t.despacho, 140)}</p>}
        </div>
      ))}
    </div>
  )
}

export function TimelineSenado({ items }: { items: TramitacaoSenado[] }) {
  return (
    <div className="relative pl-6 border-l-2 border-gray-100 space-y-4">
      {items.map((t, i) => (
        <div key={i} className="relative">
          <div className={`absolute -left-[1.35rem] top-1 w-3 h-3 rounded-full border-2 border-white
            ${i === 0 ? 'bg-amber-400 shadow-[0_0_0_2px_#fbbf24]' : 'bg-purple-400'}`} />
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {t.SiglaLocalSituacao && (
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{t.SiglaLocalSituacao}</span>
            )}
            <span className="text-xs font-medium text-gray-700">{t.DescricaoSituacao ?? '—'}</span>
            <span className="text-xs text-gray-400 ml-auto">{formatDate(t.DataSituacao)}</span>
          </div>
          {t.NomeLocalSituacao && <p className="text-xs text-gray-500">{t.NomeLocalSituacao}</p>}
        </div>
      ))}
    </div>
  )
}
