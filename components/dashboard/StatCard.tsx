import Link from 'next/link'

interface Props {
  label: string
  value: number | string
  emoji: string
  sub?: string
  color?: 'blue' | 'amber' | 'green' | 'indigo' | 'teal' | 'purple' | 'red' | 'gray'
  href?: string // quando presente, o card vira link para a lista
}

const COLORS = {
  blue:   { text: 'text-blue-600',   bg: 'bg-blue-50' },
  amber:  { text: 'text-amber-600',  bg: 'bg-amber-50' },
  green:  { text: 'text-green-600',  bg: 'bg-green-50' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50' },
  teal:   { text: 'text-teal-600',   bg: 'bg-teal-50' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-50' },
  red:    { text: 'text-red-600',    bg: 'bg-red-50' },
  gray:   { text: 'text-gray-600',   bg: 'bg-gray-100' },
}

export function StatCard({ label, value, emoji, sub, color = 'blue', href }: Props) {
  const c = COLORS[color]
  const card = (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full ${href ? 'hover:border-gray-300 hover:shadow transition' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
          <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          {href && <p className={`text-xs ${c.text} mt-2 font-medium`}>Ver lista →</p>}
        </div>
        <span className={`text-xl ${c.bg} w-10 h-10 rounded-lg flex items-center justify-center`}>{emoji}</span>
      </div>
    </div>
  )
  return href ? <Link href={href} className="block h-full">{card}</Link> : card
}
