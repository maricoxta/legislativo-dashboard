import { agendaLegislativa, EventoAgenda } from '@/lib/server/agenda'

export const revalidate = 600

export default async function AgendaPage() {
  const today = new Date().toISOString().slice(0, 10)
  const future = new Date(today)
  future.setDate(future.getDate() + 30)
  const endDate = future.toISOString().slice(0, 10)

  const eventos = await agendaLegislativa(today, endDate)

  const grouped: Record<string, EventoAgenda[]> = {}
  eventos.forEach(e => {
    const d = e.data
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Agenda Legislativa</h1>
        <p className="text-sm text-slate-500">Câmara dos Deputados e Senado Federal — próximos 30 dias</p>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-center text-slate-400 py-12 text-sm">Nenhum evento encontrado para os próximos 30 dias.</p>
      )}

      <div className="space-y-6">
        {Object.keys(grouped).sort().map(date => {
          const d = new Date(`${date}T12:00:00`)
          return (
            <div key={date} className="flex items-start gap-4">
              <div className="w-16 shrink-0 text-center bg-indigo-600 text-white rounded-xl p-2.5">
                <p className="text-xs font-bold uppercase opacity-80">{d.toLocaleDateString('pt-BR', { month: 'short' })}</p>
                <p className="text-2xl font-bold leading-none">{d.getDate()}</p>
                <p className="text-xs opacity-80 capitalize">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
              </div>
              <div className="flex-1 space-y-2">
                {grouped[date].map((e, i) => {
                  const tipo = e.tipo
                  const isA = tipo.toLowerCase().includes('audiência')
                  const isR = tipo.toLowerCase().includes('reunião')
                  const badgeCls = isA ? 'bg-indigo-50 text-indigo-600' : isR ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-600'
                  const casaCls = e.casa === 'camara' ? 'bg-teal-50 text-teal-700' : 'bg-violet-50 text-violet-700'
                  return (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
                      <div className="shrink-0 w-12 text-center">
                        {e.hora ? <><p className="text-xs font-bold text-slate-700">{e.hora}</p><p className="text-xs text-slate-400">h</p></> : <p className="text-xs text-slate-400">—</p>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${casaCls}`}>{e.casa === 'camara' ? 'Câmara' : 'Senado'}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeCls}`}>{tipo}</span>
                          {e.orgao && <span className="text-xs text-slate-400">{e.orgao}</span>}
                        </div>
                        {e.url
                          ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-800 leading-snug hover:text-indigo-600 hover:underline">{e.descricao || e.tipo}</a>
                          : <p className="text-sm text-slate-800 leading-snug">{e.descricao || '—'}</p>}
                        {e.local && <p className="text-xs text-slate-400 mt-0.5">📍 {e.local}</p>}
                        {(e.finalidade || e.observacoes || e.requerimentos) && (
                          <dl className="mt-2 space-y-1.5 text-xs text-slate-600">
                            {e.finalidade && (
                              <div><dt className="font-semibold text-slate-700">Finalidade</dt><dd>{e.finalidade}</dd></div>
                            )}
                            {e.observacoes && (
                              <div><dt className="font-semibold text-slate-700">Observações</dt><dd>{e.observacoes}</dd></div>
                            )}
                            {e.requerimentos && (
                              <div>
                                <dt className="font-semibold text-slate-700">Requerimento(s) relacionado(s)</dt>
                                {e.requerimentos.map(r => <dd key={r}>{r}</dd>)}
                              </div>
                            )}
                          </dl>
                        )}
                      </div>
                      {e.url && (
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline shrink-0">Ver no site ↗</a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
