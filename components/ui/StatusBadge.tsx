import { getStatusClass, getUrgencyClass } from '@/lib/config'

const CLASS_MAP: Record<string, string> = {
  'status-tramitando': 'bg-blue-100 text-blue-700',
  'status-aprovado':   'bg-green-100 text-green-700',
  'status-lei':        'bg-green-900 text-green-300',
  'status-arquivado':  'bg-gray-100 text-gray-500',
  'status-vetado':     'bg-amber-100 text-amber-700',
  'status-prejudicado':'bg-red-100 text-red-700',
  'urgency-urgente':   'bg-red-100 text-red-700',
  'urgency-prioridade':'bg-violet-100 text-violet-700',
}

export function StatusBadge({ situacao }: { situacao?: string }) {
  const cls = CLASS_MAP[getStatusClass(situacao)] ?? CLASS_MAP['status-tramitando']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {situacao ?? 'Em tramitação'}
    </span>
  )
}

export function UrgencyBadge({ regime }: { regime?: string }) {
  const key = getUrgencyClass(regime)
  if (!key) return null
  const cls = CLASS_MAP[key] ?? ''
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      ⚡ {regime}
    </span>
  )
}
