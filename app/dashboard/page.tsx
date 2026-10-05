import Link from 'next/link'
import { connection } from 'next/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { BillCard } from '@/components/proposicoes/BillCard'
import { SenadoCard } from '@/components/proposicoes/SenadoCard'
import { DashboardCharts } from '@/components/dashboard/Charts'
import { diagnosticoCamara, listarSituacaoCamara } from '@/lib/server/camara'
import { processosDoAno } from '@/lib/server/senado'
import { indicadoresDoAno, IndicadoresCasa, INDICADORES_VAZIOS, porMesDoAno } from '@/lib/server/indicadores'

const PRIMEIRO_ANO = 2023 // a tabela da Câmara é carregada a partir deste ano

function anosDisponiveis() {
  const atual = new Date().getFullYear()
  return Array.from({ length: atual - PRIMEIRO_ANO + 1 }, (_, i) => atual - i)
}

// Chama as funções de dados direto, sem passar por HTTP: buscar a própria
// API pela URL do deploy falha quando a Vercel protege essa URL.
async function fetchDashboardData(year: number) {
  await connection() // renderiza a cada request, como o antigo cache: 'no-store'

  const [camaraRes, senadoRes, indicadores, meses, diag] = await Promise.allSettled([
    listarSituacaoCamara({ ano: year }, 1, 10),
    processosDoAno('PL', year),
    indicadoresDoAno(year),
    porMesDoAno(year),
    diagnosticoCamara(year),
  ])

  const bills = camaraRes.status === 'fulfilled' ? camaraRes.value.dados : []
  const senadoData = senadoRes.status === 'fulfilled' ? senadoRes.value.slice(0, 6) : []
  const kpis = indicadores.status === 'fulfilled' ? indicadores.value : { camara: INDICADORES_VAZIOS, senado: INDICADORES_VAZIOS }
  const porMes = meses.status === 'fulfilled' ? meses.value : { camara: null, senado: null }

  const avisoCamara = diag.status === 'fulfilled' ? diag.value : 'erro inesperado ao consultar a tabela'

  return { bills, senadoData, kpis, porMes, avisoCamara }
}

const fmt = (n: number | null) => (n === null ? '—' : n.toLocaleString('pt-BR'))
const pct = (n: number | null, total: number | null) =>
  n === null || !total ? undefined : `${Math.round((n / total) * 100)}% do total`

function KpisCasa({ casa, fonte, year, k, cor }: { casa: string; fonte: 'camara' | 'senado'; year: number; k: IndicadoresCasa; cor: 'teal' | 'violet' }) {
  const lista = (status?: string) =>
    `/proposicoes/${fonte}/PL?${new URLSearchParams({ ano: String(year), ...(status ? { status } : {}) })}`
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">{casa}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label={`PLs de ${year}`} value={fmt(k.total)} emoji="📋" sub="apresentados no ano" color={cor} href={lista()} />
        <StatCard label="Em tramitação" value={fmt(k.tramitando)} emoji="⏳" sub={pct(k.tramitando, k.total)} color="amber" href={lista('tramitando')} />
        <StatCard label="Aprovados ou viraram lei" value={fmt(k.aprovados)} emoji="✅" sub={pct(k.aprovados, k.total)} color="green" href={lista('aprovados')} />
        <StatCard label="Vetados" value={fmt(k.vetados)} emoji="🚫" sub={pct(k.vetados, k.total)} color="red" href={lista('vetados')} />
        <StatCard label="Não aprovados" value={fmt(k['nao-aprovados'])} emoji="🗄️" sub={pct(k['nao-aprovados'], k.total) ?? 'arquivados, rejeitados ou retirados'} color="gray" href={lista('nao-aprovados')} />
      </div>
    </div>
  )
}

function SeletorAno({ ano }: { ano: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">Ano:</span>
      {anosDisponiveis().map(a => (
        <Link key={a} href={`/dashboard?ano=${a}`} aria-current={a === ano ? 'page' : undefined}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${a === ano ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {a}
        </Link>
      ))}
    </div>
  )
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams
  const atual = new Date().getFullYear()
  const pedido = parseInt(sp.ano ?? '')
  const year = anosDisponiveis().includes(pedido) ? pedido : atual
  const { bills, senadoData, kpis, porMes, avisoCamara } = await fetchDashboardData(year)
  const mesesVisiveis = year === atual ? new Date().getMonth() + 1 : 12

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Projetos de lei apresentados em {year} na Câmara e no Senado</p>
        </div>
        <SeletorAno ano={year} />
      </div>

      {/* KPIs por Casa */}
      <KpisCasa casa="Câmara dos Deputados" fonte="camara" year={year} k={kpis.camara} cor="teal" />
      {avisoCamara && (
        <p className="-mt-3 text-xs text-slate-500">⚠️ Dados da Câmara indisponíveis: {avisoCamara}.</p>
      )}
      <KpisCasa casa="Senado Federal" fonte="senado" year={year} k={kpis.senado} cor="violet" />

      {/* Gráficos */}
      <DashboardCharts ano={year} mesesVisiveis={mesesVisiveis} kpis={kpis} porMes={porMes} />

      {/* Jornada */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Jornada de uma Proposição até virar Lei</h3>
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
              {i > 0 && <div className={`absolute left-0 top-4 right-1/2 h-0.5 ${s.done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 mb-1.5
                ${s.done ? 'bg-emerald-400 text-white' : s.active ? 'bg-indigo-500 text-white ring-4 ring-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                {s.done ? '✓' : s.n}
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-0.5">{s.title}</p>
              <p className="text-[10px] text-slate-400 leading-tight px-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Últimas – Câmara */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">PLs mais recentes de {year} – Câmara</h3>
          <Link href={`/proposicoes/camara/PL?ano=${year}`} className="text-xs text-indigo-600 hover:underline font-medium">Ver todas →</Link>
        </div>
        <div className="space-y-2">
          {bills.slice(0, 10).map(b => <BillCard key={b.id} bill={b} />)}
        </div>
      </div>

      {/* Últimas – Senado */}
      {senadoData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">PLs mais recentes de {year} – Senado</h3>
            <Link href={`/proposicoes/senado/PL?ano=${year}`} className="text-xs text-violet-600 hover:underline font-medium">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {senadoData.slice(0, 6).map(p => <SenadoCard key={p.id} processo={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
