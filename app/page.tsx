import { StatCard } from '@/components/dashboard/StatCard'
import { BillCard } from '@/components/proposicoes/BillCard'
import { SenadoCard } from '@/components/proposicoes/SenadoCard'
import { DashboardCharts } from '@/components/dashboard/Charts'
import { ProposicaoCamara } from '@/types/camara'
import { MateriaSenado } from '@/types/senado'
import { getBaseUrl } from '@/lib/utils'

async function fetchDashboardData() {
  const base = getBaseUrl()
  const year = new Date().getFullYear()

  const [camaraRes, senadoRes] = await Promise.allSettled([
    fetch(`${base}/api/camara/proposicoes?siglaTipo=PL&ano=${year}&itens=30&ordem=DESC&ordenarPor=dataApresentacao`, { cache: 'no-store' }),
    fetch(`${base}/api/senado/materias?codigoTipoMateria=PL&ano=${year}&qtdItens=10`, { cache: 'no-store' }),
  ])

  const camara: { dados: ProposicaoCamara[] } =
    camaraRes.status === 'fulfilled' && camaraRes.value.ok ? await camaraRes.value.json() : { dados: [] }
  const senado: MateriaSenado[] =
    senadoRes.status === 'fulfilled' && senadoRes.value.ok ? await senadoRes.value.json() : []

  return { bills: camara.dados ?? [], senadoData: senado, year }
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
  const { bills, senadoData, year } = await fetchDashboardData()

  const statusMap: Record<string, number> = {}
  bills.forEach(b => {
    const k = categorize(b.statusProposicao?.descricaoSituacao)
    statusMap[k] = (statusMap[k] ?? 0) + 1
  })

  const tramitando = statusMap['Em tramitação'] ?? 0
  const aprovados = (statusMap['Aprovado'] ?? 0) + (statusMap['Convertido em Lei'] ?? 0)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`PLs em ${year}`} value={bills.length} emoji="📋" sub="Câmara dos Deputados" color="blue" />
        <StatCard label="Em Tramitação" value={tramitando} emoji="⏳"
          sub={`${bills.length ? Math.round(tramitando / bills.length * 100) : 0}% do total`} color="amber" />
        <StatCard label="Aprovados/Lei" value={aprovados} emoji="✅" sub="incl. convertidos em lei" color="green" />
        <StatCard label="Senado – PLs" value={senadoData.length} emoji="🏛️" sub={String(year)} color="purple" />
      </div>

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
          <a href="/proposicoes/camara/PL" className="text-xs text-blue-600 hover:underline font-medium">Ver todas →</a>
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
            <a href="/proposicoes/senado/PL" className="text-xs text-purple-600 hover:underline font-medium">Ver todas →</a>
          </div>
          <div className="space-y-2">
            {senadoData.slice(0, 6).map(m => <SenadoCard key={m.Codigo} materia={m} />)}
          </div>
        </div>
      )}
    </div>
  )
}
