import Link from 'next/link'

interface Props {
  label: string
  value: number | string
  emoji: string
  sub?: string
  color?: 'amber' | 'green' | 'indigo' | 'teal' | 'violet' | 'red' | 'gray'
  href?: string // quando presente, o card vira link para a lista
}

const COLORS = {
  amber:  { text: 'text-amber-600',  bg: 'bg-amber-50' },
  green:  { text: 'text-emerald-600',  bg: 'bg-emerald-50' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50' },
  teal:   { text: 'text-teal-600',   bg: 'bg-teal-50' },
  violet: { text: 'text-violet-600', bg: 'bg-violet-50' },
  red:    { text: 'text-rose-600',    bg: 'bg-rose-50' },
  gray:   { text: 'text-slate-600',   bg: 'bg-slate-100' },
}

export function StatCard({ label, value, emoji, sub, color = 'indigo', href }: Props) {
  const c = COLORS[color]
  const card = (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full ${href ? 'hover:border-slate-300 hover:shadow transition' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
          <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          {href && <p className={`text-xs ${c.text} mt-2 font-medium`}>Ver lista →</p>}
        </div>
        <span className={`text-xl ${c.bg} w-10 h-10 rounded-lg flex items-center justify-center`}>{emoji}</span>
      </div>
    </div>
  )
  return href ? <Link href={href} className="block h-full">{card}</Link> : card
}
