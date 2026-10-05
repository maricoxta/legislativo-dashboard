import { getStatusClass, getUrgencyClass } from '@/lib/config'

const CLASS_MAP: Record<string, string> = {
  'status-tramitando': 'bg-indigo-100 text-indigo-700',
  'status-aprovado':   'bg-emerald-100 text-emerald-700',
  'status-lei':        'bg-emerald-900 text-emerald-300',
  'status-arquivado':  'bg-slate-100 text-slate-500',
  'status-vetado':     'bg-amber-100 text-amber-700',
  'status-prejudicado':'bg-rose-100 text-rose-700',
  'urgency-urgente':   'bg-rose-100 text-rose-700',
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
