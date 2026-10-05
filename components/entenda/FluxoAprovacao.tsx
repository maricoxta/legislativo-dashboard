'use client'
import { useEffect, useState } from 'react'
import { Etapa, FLUXOS, Fluxo } from '@/lib/processo-legislativo'
import { CORES } from './cores'

const LUGAR: Record<NonNullable<Etapa['onde']>, { nome: string; cls: string }> = {
  autor: { nome: 'Autor', cls: 'bg-gray-100 text-gray-700' },
  camara: { nome: 'Câmara', cls: 'bg-green-100 text-green-800' },
  senado: { nome: 'Senado', cls: 'bg-purple-100 text-purple-800' },
  congresso: { nome: 'Congresso (as duas Casas)', cls: 'bg-indigo-100 text-indigo-800' },
  presidencia: { nome: 'Presidência', cls: 'bg-yellow-100 text-yellow-800' },
}

const TOM = {
  bom: 'bg-green-50 border-green-200',
  medio: 'bg-amber-50 border-amber-200',
  ruim: 'bg-gray-50 border-gray-200',
}

const INTERVALO_MS = 3500

export function FluxoAprovacao() {
  const [fluxoId, setFluxoId] = useState<Fluxo['id']>('pl')
  const [passo, setPasso] = useState(0)
  const [tocando, setTocando] = useState(false)
  const [curioso, setCurioso] = useState(false)

  const fluxo = FLUXOS.find(f => f.id === fluxoId)!
  const cor = CORES[fluxo.cor]
  const total = fluxo.etapas.length
  const fim = passo === total // passo extra: "como pode terminar"
  const etapa = fim ? null : fluxo.etapas[passo]

  // Modo animação: avança sozinho e para no final.
  useEffect(() => {
    if (!tocando || passo >= total) return
    const t = setTimeout(() => {
      setPasso(p => p + 1)
      if (passo + 1 >= total) setTocando(false)
    }, INTERVALO_MS)
    return () => clearTimeout(t)
  }, [tocando, passo, total])

  function trocar(id: Fluxo['id']) {
    setFluxoId(id)
    setPasso(0)
    setTocando(false)
    setCurioso(false)
  }

  function irPara(n: number) {
    setPasso(Math.max(0, Math.min(total, n)))
    setTocando(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FLUXOS.map(f => (
          <button key={f.id} onClick={() => trocar(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${f.id === fluxoId ? `${CORES[f.cor].bgForte} text-white shadow` : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.emoji} {f.sigla}: {f.nome}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-600">{fluxo.resumo}</p>

      {/* Trilha de etapas */}
      <div className="overflow-x-auto pb-2">
        <ol className="flex items-start min-w-max">
          {[...fluxo.etapas, null].map((e, i) => {
            const feito = i < passo
            const atual = i === passo
            return (
              <li key={i} className="flex items-start">
                <button onClick={() => irPara(i)} className="flex flex-col items-center w-24 group">
                  <span className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all duration-300
                    ${atual ? `${cor.bgForte} border-transparent scale-110 shadow-lg animate-[pulsar_1.6s_ease-in-out_infinite]` : feito ? `${cor.bg} ${cor.borda}` : 'bg-white border-gray-200 grayscale opacity-60 group-hover:opacity-100'}`}>
                    {e ? e.emoji : '🏁'}
                  </span>
                  <span className={`mt-2 text-[11px] text-center leading-tight ${atual ? `font-bold ${cor.texto}` : 'text-gray-500'}`}>
                    {e ? e.titulo : 'Como termina'}
                  </span>
                </button>
                {i < total && (
                  <span className="mt-7 h-1 w-6 rounded-full bg-gray-200 overflow-hidden">
                    <span className={`block h-full ${cor.bgForte} transition-all duration-500`} style={{ width: feito ? '100%' : '0%' }} />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Etapa atual */}
      {etapa ? (
        <div key={`${fluxoId}-${passo}`} className={`rounded-2xl border p-5 animate-[aparecer_.35s_ease-out] ${cor.bg} ${cor.borda}`}>
          <div className="flex items-start gap-4">
            <span className="text-5xl animate-[flutuar_3s_ease-in-out_infinite]">{etapa.emoji}</span>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Passo {passo + 1} de {total}</span>
                {etapa.onde && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LUGAR[etapa.onde].cls}`}>📍 {LUGAR[etapa.onde].nome}</span>}
              </div>
              <h3 className={`text-xl font-extrabold ${cor.texto}`}>{etapa.titulo}</h3>
              <p className="text-base text-gray-800">{etapa.texto}</p>
              {etapa.curiosos && (
                curioso
                  ? <p className="text-sm text-gray-700 bg-white/80 rounded-xl p-3 border border-gray-100">🤓 {etapa.curiosos}</p>
                  : <button onClick={() => setCurioso(true)} className={`text-sm font-medium ${cor.texto} hover:underline`}>🤓 Quero saber mais</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div key={`${fluxoId}-fim`} className="space-y-3 animate-[aparecer_.35s_ease-out]">
          <h3 className="text-lg font-extrabold text-gray-800">🏁 Como pode terminar</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {fluxo.desfechos.map(d => (
              <div key={d.titulo} className={`rounded-2xl border p-4 ${TOM[d.tom]}`}>
                <p className="text-3xl">{d.emoji}</p>
                <p className="font-bold text-gray-800 mt-1">{d.titulo}</p>
                <p className="text-sm text-gray-600">{d.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => irPara(passo - 1)} disabled={passo === 0}
          className="px-4 py-2 rounded-full text-sm border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40">← Voltar</button>
        <button onClick={() => irPara(passo + 1)} disabled={fim}
          className={`px-4 py-2 rounded-full text-sm text-white ${cor.bgForte} hover:opacity-90 disabled:opacity-40`}>Próximo passo →</button>
        <button onClick={() => { if (fim) setPasso(0); setTocando(t => !t) }}
          className="px-4 py-2 rounded-full text-sm border border-gray-200 bg-white hover:bg-gray-50">
          {tocando ? '⏸ Pausar' : '▶ Ver tudo sozinho'}
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={curioso} onChange={e => setCurioso(e.target.checked)} className="accent-indigo-600" />
          Mostrar detalhes para curiosos
        </label>
      </div>
    </div>
  )
}
