import { SenadoCard } from '@/components/proposicoes/SenadoCard'
import { ProcessoSenado } from '@/types/senado'
import { TIPO_SIGLAS } from '@/lib/config'
import { getBaseUrl } from '@/lib/utils'

interface Props {
  params: Promise<{ tipo: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function SenadoListPage({ params, searchParams }: Props) {
  const { tipo } = await params
  const sp = await searchParams
  const base = getBaseUrl()

  const qs = new URLSearchParams({
    sigla: tipo,
    ano: sp.ano ?? String(new Date().getFullYear()),
    limite: '20',
  })

  const res = await fetch(`${base}/api/senado/processos?${qs}`, { cache: 'no-store' })
  const processos: ProcessoSenado[] = res.ok ? await res.json() : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{TIPO_SIGLAS[tipo] ?? tipo}</h1>
        <p className="text-sm text-gray-500">Senado Federal</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        {(['PL', 'PEC', 'MPV'] as const).map(t => (
          <a key={t} href={`/proposicoes/senado/${t}`}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${t === tipo ? 'bg-purple-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </a>
        ))}
      </div>

      <p className="text-sm text-gray-500"><strong className="text-gray-800">{processos.length}</strong> processos carregados</p>

      <div className="space-y-3">
        {processos.length
          ? processos.map(p => <SenadoCard key={p.id} processo={p} />)
          : <p className="text-center text-gray-400 py-12 text-sm">Nenhuma matéria encontrada.</p>}
      </div>
    </div>
  )
}
