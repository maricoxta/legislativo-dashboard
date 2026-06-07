'use client'
import { MateriaSenado } from '@/types/senado'
import { useDrawer } from '@/components/detalhe/DrawerProvider'
import { formatDate, truncate } from '@/lib/utils'

interface Props {
  materia: MateriaSenado
}

export function SenadoCard({ materia }: Props) {
  const { open } = useDrawer()
  return (
    <div
      onClick={() => open(materia.Codigo, 'senado')}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
          <div>{materia.Sigla ?? 'PL'}</div>
          <div className="text-xs font-normal">{materia.Numero ?? '—'}/{materia.Ano ?? '—'}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug mb-1">{truncate(materia.Ementa ?? '—', 200)}</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>📅 {formatDate(materia.Data)}</span>
            {materia.Autor && <span>👤 {materia.Autor}</span>}
            {materia.SiglaComissao && <span>🏛️ {materia.SiglaComissao}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
