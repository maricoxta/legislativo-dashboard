import Link from 'next/link'
import { connection } from 'next/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { BillCard } from '@/components/proposicoes/BillCard'
import { SenadoCard } from '@/components/proposicoes/SenadoCard'
import { DashboardCharts } from '@/components/dashboard/Charts'
import { listarProposicoesCamara } from '@/lib/server/camara'
import { listarProcessosSenado } from '@/lib/server/senado'
import { indicadoresDoAno, IndicadoresCasa } from '@/lib/server/indicadores'

// Chama as funções de dados direto, sem passar por HTTP: buscar a própria
// API pela URL do deploy falha quando a Vercel protege essa URL.
async function fetchDashboardData() {
  await connection() // renderiza a cada request, como o antigo cache: 'no-store'
  const year = new Date().getFullYear()

  const [camaraRes, senadoRes, indicadores] = await Promise.allSettled([
    listarProposicoesCamara(new URLSearchParams({ siglaTipo: 'PL', ano: String(year), itens: '30', ordem: 'DESC', ordenarPor: 'dataApresentacao' })),
    listarProcessosSenado({ sigla: 'PL', ano: year, limite: 10 }),
    indicadoresDoAno(year),
  ])

  const bills = camaraRes.status === 'fulfilled' ? (camaraRes.value.dados ?? []) : []
  const senadoData = senadoRes.status === 'fulfilled' ? senadoRes.value : []

  const vazio: IndicadoresCasa = { total: null, tramitando: null, aprovadosOuLei: null }
  const kpis = indicadores.status === 'fulfilled' ? indicadores.value : { camara: vazio, senado: vazio }

  return { bills, senadoData, year, kpis }
}

const fmt = (n: number | null) => (n === null ? '—' : n.toLocaleString('pt-BR'))
const pct = (n: number | null, total: number | null) =>
  n === null || !total ? undefined : `${Math.round((n / total) * 100)}% do total`

function KpisCasa({ casa, year, k, cor }: { casa: string; year: number; k: IndicadoresCasa; cor: 'blue' | 'purple' }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{casa}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={`PLs de ${year}`} value={fmt(k.total)} emoji="📋" sub="apresentados no ano" color={cor} />
        <StatCard label="Em tramitação" value={fmt(k.tramitando)} emoji="⏳" sub={pct(k.tramitando, k.total)} color="amber" />
        <StatCard label="Aprovados ou viraram lei" value={fmt(k.aprovadosOuLei)} emoji="✅" sub={pct(k.aprovadosOuLei, k.total)} color="green" />
      </div>
    </div>
  )
}

function categorize(sit?: string) {
  if (!sit) return 'Em tramitação'
  const s = sit.toLowerCase()
  if (s.includes('lei') || s.includes('norma jurídica')) return 'Convertido em Lei'
  if (s.includes('aprovad')) return 'Aprovado'
  if (s.includes('arquivad') || s.includes('retirad')) return 'Arquivado'
  if (s.includes('vetad')) return 'Vetado'
  return 'Em tramitação'
}

export default async function DashboardPage() {
  const { bills, senadoData, year, kpis } = await fetchDashboardData()

  const statusMap: Record<string, number> = {}
  bills.forEach(b => {
    const k = categorize(b.statusProposicao?.descricaoSituacao)
    statusMap[k] = (statusMap[k] ?? 0) + 1
  })

  return (
    <div className="space-y-6">
      {/* KPIs por Casa */}
      <KpisCasa casa="Câmara dos Deputados" year={year} k={kpis.camara} cor="blue" />
      <KpisCasa casa="Senado Federal" year={year} k={kpis.senado} cor="purple" />

      {/* Gráficos */}
      <DashboardCharts statusMap={statusMap} bills={bills} />

      {/* Jornada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Jornada de uma Proposição até virar Lei</h3>
        <div className="flex items-start overflow-x-auto pb-2">
          {[
            { n: '1', title: 'Apresentação', desc: 'Protocolo do texto', done: true },
            { n: '2', title: 'Comissões', desc: 'Análise técnica', done: true },
            { n: '3', title: 'Plenário', desc: 'Votação na Casa', active: true },
            { n: '4', title: 'Casa Revisora', desc: 'Outra Casa' },
            { n: '5', title: 'Sanção/Veto', desc: 'Presidência' },
            { n: '6', title: 'Publicação', desc: 'Conversão em Lei' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center flex-1 text-center min-w-[90px] relative">
              {i > 0 && <div className={`absolute left-0 top-4 right-1/2 h-0.5 ${s.done ? 'bg-green-400' : 'bg-gray-200'}`} />}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 mb-1.5
                ${s.done ? 'bg-green-400 text-white' : s.active ? 'bg-blue-500 text-white ring-4 ring-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                {s.done ? '✓' : s.n}
              </div>
              <p className="text-xs font-semibold text-gray-700 mb-0.5">{s.title}</p>
              <p className="text-[10px] text-gray-400 leading-tight px-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Últimas – Câmara */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Últimas Proposições – Câmara</h3>
          <Link href="/proposicoes/camara/PL" className="text-xs text-blue-600 hover:underline font-medium">Ver todas →</Link>
        </div>
        <div className="space-y-2">
          {bills.slice(0, 10).map(b => <BillCard key={b.id} bill={b} />)}
        </div>
      </div>

      {/* Últimas – Senado */}
      {senadoData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Últimas Matérias – Senado Federal</h3>
            <Link href="/proposicoes/senado/PL" className="text-xs text-purple-600 hover:underline font-medium">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {senadoData.slice(0, 6).map(p => <SenadoCard key={p.id} processo={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
