import { EventoCamara } from '@/types/camara'

export default async function AgendaPage() {
  const today = new Date().toISOString().slice(0, 10)
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  let eventos: EventoCamara[] = []
  try {
    const evRes = await fetch(
      `https://dadosabertos.camara.leg.br/api/v2/eventos?dataInicio=${today}&dataFim=${endDate}&itens=60&ordem=ASC&ordenarPor=dataHoraInicio`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 600 } }
    )
    if (evRes.ok) { const d = await evRes.json(); eventos = d.dados ?? [] }
  } catch {}

  const grouped: Record<string, EventoCamara[]> = {}
  eventos.forEach(e => {
    const d = (e.dataHoraInicio ?? '').slice(0, 10) || 'sem-data'
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Agenda Legislativa</h1>
        <p className="text-sm text-gray-500">Câmara dos Deputados — próximos 30 dias</p>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">Nenhum evento encontrado para os próximos 30 dias.</p>
      )}

      <div className="space-y-6">
        {Object.keys(grouped).sort().map(date => {
          const d = new Date(`${date}T12:00:00`)
          return (
            <div key={date} className="flex items-start gap-4">
              <div className="w-16 shrink-0 text-center bg-blue-600 text-white rounded-xl p-2.5">
                <p className="text-xs font-bold uppercase opacity-80">{d.toLocaleDateString('pt-BR', { month: 'short' })}</p>
                <p className="text-2xl font-bold leading-none">{d.getDate()}</p>
                <p className="text-xs opacity-80 capitalize">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
              </div>
              <div className="flex-1 space-y-2">
                {grouped[date].map((e, i) => {
                  const tipo = e.descricaoTipo ?? 'Evento'
                  const isA = tipo.toLowerCase().includes('audiência')
                  const isR = tipo.toLowerCase().includes('reunião')
                  const badgeCls = isA ? 'bg-blue-50 text-blue-600' : isR ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                  const orgaos = (e.orgaos ?? []).map(o => o.sigla ?? o.apelido).filter(Boolean).join(', ')
                  const dt = e.dataHoraInicio ? new Date(e.dataHoraInicio) : null
                  const hora = dt ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
                  return (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3 hover:shadow-sm transition-shadow">
                      <div className="shrink-0 w-12 text-center">
                        {hora ? <><p className="text-xs font-bold text-gray-700">{hora}</p><p className="text-xs text-gray-400">h</p></> : <p className="text-xs text-gray-400">—</p>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeCls}`}>{tipo}</span>
                          {orgaos && <span className="text-xs text-gray-400">{orgaos}</span>}
                        </div>
                        <p className="text-sm text-gray-800 leading-snug">{e.descricao ?? '—'}</p>
                        {e.localCamara?.nome && <p className="text-xs text-gray-400 mt-0.5">📍 {e.localCamara.nome}</p>}
                      </div>
                      {e.urlRegistro && (
                        <a href={e.urlRegistro} target="_blank" className="text-xs text-blue-600 hover:underline shrink-0">Ver</a>
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
