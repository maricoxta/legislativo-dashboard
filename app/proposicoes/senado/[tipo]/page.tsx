import { SenadoCard } from '@/components/proposicoes/SenadoCard'
import { ProcessoSenado } from '@/types/senado'
import { TIPO_SIGLAS } from '@/lib/config'
import { listarProcessosSenado, processosDoAno } from '@/lib/server/senado'
import { STATUS_PL, isStatusPL, statusSenado } from '@/lib/situacoes'

const POR_PAGINA = 20

interface Props {
  params: Promise<{ tipo: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function SenadoListPage({ params, searchParams }: Props) {
  const { tipo } = await params
  const sp = await searchParams
  const page = parseInt(sp.pagina ?? '1') || 1
  // Com ?ano= (links do dashboard) carregamos o ano inteiro para poder
  // contar, filtrar por ?status= e paginar. Sem ano, só os mais recentes.
  const status = isStatusPL(sp.status) ? sp.status : null
  const ano = Number(sp.ano) || undefined
  let processos: ProcessoSenado[] = []
  let total = 0
  let totalPages = 1
  let erro = false
  try {
    if (ano) {
      const doAno = await processosDoAno(tipo, ano)
      const filtrados = status ? doAno.filter(p => statusSenado(p)[status]) : doAno
      total = filtrados.length
      totalPages = Math.max(1, Math.ceil(total / POR_PAGINA))
      processos = filtrados.slice((page - 1) * POR_PAGINA, page * POR_PAGINA)
    } else {
      processos = await listarProcessosSenado({ sigla: tipo, limite: POR_PAGINA })
      total = processos.length
    }
  } catch { erro = true }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{TIPO_SIGLAS[tipo] ?? tipo}</h1>
        <p className="text-sm text-slate-500">Senado Federal{ano ? ` · apresentados em ${ano}` : ''}</p>
        {status && (
          <p className="text-sm text-slate-700 mt-1">
            <strong>{STATUS_PL[status].titulo}</strong>: {STATUS_PL[status].descricao}.{' '}
            <a href={`?${new URLSearchParams({ ano: String(ano ?? '') })}`} className="text-violet-600 hover:underline">Ver todos</a>
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        {(['PL', 'PEC', 'MPV'] as const).map(t => (
          <a key={t} href={`/proposicoes/senado/${t}`}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${t === tipo ? 'bg-violet-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {t}
          </a>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500"><strong className="text-slate-800">{total.toLocaleString('pt-BR')}</strong> processos · pág. {page}/{totalPages}</p>
        <div className="flex gap-2">
          {page > 1 && (
            <a href={`?${new URLSearchParams({ ...sp, pagina: String(page - 1) })}`}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">← Anterior</a>
          )}
          {page < totalPages && (
            <a href={`?${new URLSearchParams({ ...sp, pagina: String(page + 1) })}`}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50">Próxima →</a>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {processos.length
          ? processos.map(p => <SenadoCard key={p.id} processo={p} />)
          : <p className="text-center text-slate-400 py-12 text-sm">{erro ? 'A API do Senado não respondeu. Tente de novo em instantes.' : 'Nenhuma matéria encontrada.'}</p>}
      </div>
    </div>
  )
}
