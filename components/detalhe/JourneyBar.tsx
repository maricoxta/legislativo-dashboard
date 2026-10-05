const STEPS = [
  { key: 'apresentad|protocolo', label: 'Apresentação', icon: '📋' },
  { key: 'comiss', label: 'Comissões', icon: '🏛️' },
  { key: 'plenário|plenario', label: 'Plenário', icon: '🗳️' },
  { key: 'senado|câmara revisora|casa revisora', label: 'Casa Revisora', icon: '⇄' },
  { key: 'sancionad|vetad', label: 'Sanção/Veto', icon: '✍️' },
  { key: 'lei|norma', label: 'Publicação', icon: '📜' },
]

export function JourneyBar({ situacao, history }: { situacao?: string; history?: string }) {
  const combined = `${situacao ?? ''} ${history ?? ''}`.toLowerCase()
  let activeIdx = 0
  STEPS.forEach((s, i) => {
    if (s.key.split('|').some(k => combined.includes(k))) activeIdx = i
  })

  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Jornada da Proposição</h4>
      <div className="flex overflow-x-auto gap-0 pb-1">
        {STEPS.map((s, i) => {
          const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'pending'
          return (
            <div key={i} className="flex flex-col items-center flex-1 text-center min-w-[72px] relative">
              {i > 0 && (
                <div className={`absolute left-0 top-4 right-1/2 h-0.5 ${state === 'done' || (i <= activeIdx) ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 mb-1.5
                ${state === 'done' ? 'bg-emerald-400 text-white' : state === 'active' ? 'bg-indigo-500 text-white ring-4 ring-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                {state === 'done' ? '✓' : s.icon}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight px-1">{s.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
