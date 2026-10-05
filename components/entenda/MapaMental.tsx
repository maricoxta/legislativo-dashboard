'use client'
import { useState } from 'react'
import { CONCEITOS, Conceito, ItemExplicado, PROPOSICAO } from '@/lib/processo-legislativo'
import { CORES } from './cores'

// Posição de cada ramo em volta do centro (em % da área do mapa).
const POSICOES: Record<Conceito['id'], { x: number; y: number }> = {
  pl: { x: 18, y: 22 },
  plp: { x: 82, y: 22 },
  pec: { x: 18, y: 78 },
  mpv: { x: 82, y: 78 },
}

type Aba = 'quem' | 'como' | 'onde'
const ABAS: { id: Aba; titulo: string; emoji: string }[] = [
  { id: 'quem', titulo: 'Quem pode propor?', emoji: '🙋' },
  { id: 'como', titulo: 'Como propor?', emoji: '🛠️' },
  { id: 'onde', titulo: 'Por onde começa?', emoji: '🧭' },
]

function Itens({ itens }: { itens: ItemExplicado[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {itens.map(i => (
        <li key={i.titulo} className="flex gap-3 bg-white rounded-xl border border-slate-100 p-3 shadow-sm animate-[aparecer_.35s_ease-out]">
          <span className="text-2xl leading-none">{i.icone}</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{i.titulo}</p>
            <p className="text-sm text-slate-600 leading-snug">{i.texto}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function MapaMental() {
  const [selecionado, setSelecionado] = useState<Conceito['id'] | null>(null)
  const [aba, setAba] = useState<Aba>('quem')
  const conceito = CONCEITOS.find(c => c.id === selecionado) ?? null

  function escolher(id: Conceito['id'] | null) {
    setSelecionado(id)
    setAba('quem')
  }

  return (
    <div className="space-y-5">
      {/* Mapa (telas médias e grandes) */}
      <div className="relative hidden md:block h-[380px] rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50 border border-indigo-100 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" aria-hidden>
          {CONCEITOS.map(c => {
            const p = POSICOES[c.id]
            const ativo = selecionado === c.id
            return (
              <line key={c.id} x1="50%" y1="50%" x2={`${p.x}%`} y2={`${p.y}%`}
                stroke={CORES[c.cor].linha} strokeWidth={ativo ? 4 : 2.5} strokeLinecap="round"
                strokeDasharray="8 8" className="animate-[fluir_1.2s_linear_infinite]"
                opacity={selecionado && !ativo ? 0.25 : 0.8} />
            )
          })}
        </svg>

        <button onClick={() => escolher(null)}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-indigo-600 text-white shadow-xl flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105 ${selecionado === null ? 'ring-8 ring-indigo-200' : ''}`}>
          <span className="text-4xl animate-[flutuar_3s_ease-in-out_infinite]">{PROPOSICAO.emoji}</span>
          <span className="font-bold">{PROPOSICAO.nome}</span>
          <span className="text-[11px] opacity-80">o que é?</span>
        </button>

        {CONCEITOS.map((c, i) => {
          const p = POSICOES[c.id]
          const cor = CORES[c.cor]
          const ativo = selecionado === c.id
          return (
            <button key={c.id} onClick={() => escolher(c.id)}
              style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${i * 0.4}s` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-44 rounded-2xl border-2 bg-white px-3 py-3 text-left shadow-md transition-all hover:-translate-y-[55%] hover:shadow-lg ${cor.borda} ${ativo ? `ring-4 ${cor.anel} scale-105` : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-3xl animate-[flutuar_3s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.4}s` }}>{c.emoji}</span>
                <div>
                  <p className={`text-lg font-extrabold leading-none ${cor.texto}`}>{c.sigla}</p>
                  <p className="text-xs text-slate-600 leading-tight">{c.nome}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Lista (celular) */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        <button onClick={() => escolher(null)}
          className={`col-span-2 rounded-2xl bg-indigo-600 text-white p-4 flex items-center gap-3 ${selecionado === null ? 'ring-4 ring-indigo-200' : ''}`}>
          <span className="text-3xl">{PROPOSICAO.emoji}</span>
          <span className="font-bold">{PROPOSICAO.nome}: o que é?</span>
        </button>
        {CONCEITOS.map(c => {
          const cor = CORES[c.cor]
          return (
            <button key={c.id} onClick={() => escolher(c.id)}
              className={`rounded-2xl border-2 bg-white p-3 text-left ${cor.borda} ${selecionado === c.id ? `ring-4 ${cor.anel}` : ''}`}>
              <span className="text-2xl">{c.emoji}</span>
              <p className={`font-extrabold ${cor.texto}`}>{c.sigla}</p>
              <p className="text-xs text-slate-600">{c.nome}</p>
            </button>
          )
        })}
      </div>

      {/* Explicação do item escolhido */}
      {conceito === null ? (
        <div key="proposicao" className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5 space-y-2 animate-[aparecer_.35s_ease-out]">
          <p className="text-base text-slate-800"><strong>{PROPOSICAO.nome}</strong>: {PROPOSICAO.ideia}</p>
          <p className="text-sm text-slate-700">🏫 {PROPOSICAO.analogia}</p>
          <p className="text-sm text-indigo-700 font-medium">👆 {PROPOSICAO.tipos}</p>
        </div>
      ) : (
        <div key={conceito.id} className={`rounded-2xl border p-5 space-y-4 animate-[aparecer_.35s_ease-out] ${CORES[conceito.cor].bg} ${CORES[conceito.cor].borda}`}>
          <div>
            <h3 className={`text-lg font-extrabold ${CORES[conceito.cor].texto}`}>{conceito.emoji} {conceito.sigla}: {conceito.nome}</h3>
            <p className="text-base text-slate-800 mt-1">{conceito.ideia}</p>
            <p className="text-sm text-slate-700 mt-1">🏫 {conceito.analogia}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${aba === a.id ? `${CORES[conceito.cor].bgForte} text-white shadow` : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                {a.emoji} {a.titulo}
              </button>
            ))}
          </div>

          <div key={aba}>
            <Itens itens={aba === 'quem' ? conceito.quem : aba === 'como' ? conceito.como : conceito.ondeComeca} />
          </div>

          {conceito.atencao && (
            <p className="text-sm text-slate-700 bg-white/70 rounded-xl p-3 border border-slate-100">⚠️ {conceito.atencao}</p>
          )}
        </div>
      )}
    </div>
  )
}
