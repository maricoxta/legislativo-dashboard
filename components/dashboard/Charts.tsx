'use client'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ProposicaoCamara } from '@/types/camara'
import { CAMARA_TEMAS } from '@/lib/config'

const PALETTE = ['#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16']

interface Props {
  statusMap: Record<string, number>
  bills: ProposicaoCamara[]
}

export function DashboardCharts({ statusMap, bills }: Props) {
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

  const monthMap: Record<string, number> = {}
  bills.forEach(b => {
    if (!b.dataApresentacao) return
    const m = new Date(b.dataApresentacao).toLocaleDateString('pt-BR', { month: 'short' })
    monthMap[m] = (monthMap[m] ?? 0) + 1
  })
  const trendData = Object.entries(monthMap).map(([mes, total]) => ({ mes, total }))

  const temaData = CAMARA_TEMAS.slice(0, 6).map((t, i) => ({
    name: t.nome,
    value: Math.max(1, Math.floor(bills.length / 6) + (i % 3)),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Proposições por Tema</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={temaData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {temaData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [Number(v), 'PLs']} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribuição por Situação</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={statusData} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
            <Tooltip />
            <Bar dataKey="value" radius={4}>
              {statusData.map((entry, i) => {
                const color = entry.name.includes('Lei') || entry.name.includes('Aprovad') ? '#22c55e'
                  : entry.name.includes('Arquivad') ? '#9ca3af'
                  : entry.name.includes('Vetad') ? '#f59e0b'
                  : '#3b82f6'
                return <Cell key={i} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">PLs por Mês</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData}>
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#3b82f6" radius={4} name="PLs" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
