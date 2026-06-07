interface Props {
  label: string
  value: number | string
  emoji: string
  sub?: string
  color?: 'blue' | 'amber' | 'green' | 'indigo' | 'teal' | 'purple'
}

const COLORS = {
  blue:   { text: 'text-blue-600',   bg: 'bg-blue-50' },
  amber:  { text: 'text-amber-600',  bg: 'bg-amber-50' },
  green:  { text: 'text-green-600',  bg: 'bg-green-50' },
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50' },
  teal:   { text: 'text-teal-600',   bg: 'bg-teal-50' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-50' },
}

export function StatCard({ label, value, emoji, sub, color = 'blue' }: Props) {
  const c = COLORS[color]
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
          <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <span className={`text-xl ${c.bg} w-10 h-10 rounded-lg flex items-center justify-center`}>{emoji}</span>
      </div>
    </div>
  )
}
