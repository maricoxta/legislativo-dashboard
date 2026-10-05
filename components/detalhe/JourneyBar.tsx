const STEPS = [
  { label: 'Apresentação', icon: '📋' },
  { label: 'Comissões', icon: '🏛️' },
  { label: 'Plenário', icon: '🗳️' },
  { label: 'Casa Revisora', icon: '⇄' },
  { label: 'Sanção/Veto', icon: '✍️' },
  { label: 'Publicação', icon: '📜' },
]

// Sinais de cada etapa. Antes a barra procurava pedaços de palavra soltos
// no histórico inteiro ("lei" casava com "leitura", "senado" com qualquer
// andamento do Senado) e marcava "Publicação" em projeto recém-apresentado.
// Agora só valem frases claras.
// Sem \b depois de letra acentuada: no JavaScript "ã" não conta como letra.
// "Leitura em Plenário" não conta como etapa de Plenário: no Senado todo
// projeto é lido em Plenário logo ao ser apresentado.
const SINAIS: RegExp[] = [
  /^$/, // apresentação: ponto de partida
  /\bcomiss(ão|ões|ao|oes)|\brelator|\bparecer\b|\bdistribu[ií]d/,
  /\bvota[çc][ãa]o|\baprovad[oa] (pelo|no|em) plen|\bpronta para (a )?pauta|\bordem do dia\b|\binclu[ií]d[oa] (em|na) pauta/,
  /\bcasa revisora\b|\bremetid[oa] à c[âa]mara|\bremessa à c[âa]mara|\b(enviad|remetid)[oa] ao senado\b/,
  /\bsancionad|\bsanç[ãa]o|\bvetad[oa]|\bveto (total|parcial)\b/,
  /\btransformad[oa] (em|na) (lei|norma)|\bnorma jur[ií]dica gerada|\blei ordin[áa]ria n|\blei complementar n/,
]

function etapa(texto: string) {
  let i = 0
  SINAIS.forEach((r, k) => { if (k > 0 && r.test(texto)) i = k })
  return i
}

export function JourneyBar({ situacao, history }: { situacao?: string; history?: string }) {
  const doHistorico = etapa((history ?? '').toLowerCase())
  const daSituacao = etapa((situacao ?? '').toLowerCase())
  // "Aguardando despacho/distribuição" = ainda não foi para as comissões.
  const aguardandoInicio = /aguardando (despacho|distribui)/i.test(situacao ?? '')
  const activeIdx = aguardandoInicio ? 0 : Math.max(daSituacao, doHistorico)

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
