'use client'
import { ProposicaoCamara } from '@/types/camara'
import { StatusBadge, UrgencyBadge } from '@/components/ui/StatusBadge'
import { useDrawer } from '@/components/detalhe/DrawerProvider'
import { formatDate, truncate } from '@/lib/utils'

interface Props {
  bill: ProposicaoCamara
  isSaved?: boolean
  onToggleSave?: (bill: ProposicaoCamara) => void
}

export function BillCard({ bill, isSaved, onToggleSave }: Props) {
  const { open } = useDrawer()
  const sit = bill.statusProposicao?.descricaoSituacao
  const orgao = bill.statusProposicao?.siglaOrgao

  return (
    <div
      onClick={() => open(bill.id, 'camara')}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
          <div>{bill.siglaTipo}</div>
          <div className="text-xs font-normal">{bill.numero}/{bill.ano}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <StatusBadge situacao={sit} />
            <UrgencyBadge regime={bill.regime} />
            {orgao && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{orgao}</span>}
          </div>
          <p className="text-sm text-gray-800 leading-snug">{truncate(bill.ementa, 200)}</p>
          <p className="text-xs text-gray-400 mt-2">📅 {formatDate(bill.dataApresentacao)}</p>
        </div>
        {onToggleSave && (
          <button
            onClick={e => { e.stopPropagation(); onToggleSave(bill) }}
            className={`shrink-0 p-1.5 rounded-lg transition-colors ${isSaved ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-gray-50'}`}
            title={isSaved ? 'Remover dos favoritos' : 'Salvar'}
          >
            <svg width="16" height="16" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
