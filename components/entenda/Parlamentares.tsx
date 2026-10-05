'use client'
import { useState } from 'react'
import { DIFERENCAS, ItemExplicado, PARLAMENTARES } from '@/lib/processo-legislativo'
import { CORES } from './cores'

type Id = (typeof PARLAMENTARES)[number]['id'] | 'diferenca'

const PERGUNTAS: { id: Id; pergunta: string; emoji: string }[] = [
  ...PARLAMENTARES.filter(p => p.id !== 'senador').map(p => ({ id: p.id, pergunta: p.pergunta, emoji: p.emoji })),
  { id: 'diferenca', pergunta: 'Qual a diferença entre deputado federal e estadual/distrital?', emoji: '🤔' },
  ...PARLAMENTARES.filter(p => p.id === 'senador').map(p => ({ id: p.id, pergunta: p.pergunta, emoji: p.emoji })),
]

function Lista({ titulo, itens }: { titulo: string; itens: ItemExplicado[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-gray-800">{titulo}</h4>
      <ul className="grid gap-2 sm:grid-cols-2">
        {itens.map(i => (
          <li key={i.titulo} className="flex gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <span className="text-2xl leading-none">{i.icone}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{i.titulo}</p>
              <p className="text-sm text-gray-600 leading-snug">{i.texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Parlamentares() {
  const [aberto, setAberto] = useState<Id>('federal')
  const parlamentar = PARLAMENTARES.find(p => p.id === aberto)

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {PERGUNTAS.map(p => (
          <button key={p.id} onClick={() => setAberto(p.id)}
            className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left text-sm font-semibold transition-all
              ${aberto === p.id ? 'border-indigo-400 bg-indigo-50 text-indigo-800 shadow' : 'border-gray-100 bg-white text-gray-700 hover:border-indigo-200'}`}>
            <span className="text-2xl">{p.emoji}</span>
            {p.pergunta}
          </button>
        ))}
      </div>

      {parlamentar ? (
        <div key={parlamentar.id} className={`rounded-2xl border p-5 space-y-4 animate-[aparecer_.35s_ease-out] ${CORES[parlamentar.cor].bg} ${CORES[parlamentar.cor].borda}`}>
          <div>
            <h3 className={`text-lg font-extrabold ${CORES[parlamentar.cor].texto}`}>{parlamentar.pergunta}</h3>
            <p className="text-base text-gray-800 mt-1">{parlamentar.resumo}</p>
          </div>
          <dl className="grid gap-2 sm:grid-cols-3">
            {parlamentar.numeros.map(n => (
              <div key={n.rotulo} className="rounded-xl bg-white/80 border border-gray-100 p-3">
                <dt className="text-xs font-semibold text-gray-500">{n.rotulo}</dt>
                <dd className="text-sm text-gray-800">{n.valor}</dd>
              </div>
            ))}
          </dl>
          <Lista titulo="O que faz" itens={parlamentar.fazem} />
          <Lista titulo="Ferramentas e poderes" itens={parlamentar.ferramentas} />
        </div>
      ) : (
        <div key="diferenca" className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3 animate-[aparecer_.35s_ease-out]">
          <p className="text-base text-gray-800">
            🧩 Os dois fazem o <strong>mesmo tipo de trabalho</strong> (criar leis, fiscalizar e decidir o orçamento). A diferença é o <strong>tamanho do lugar</strong> que cada um cuida: o federal cuida do Brasil, o estadual cuida de um estado e o distrital cuida do Distrito Federal.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-xl overflow-hidden">
              <thead>
                <tr className="text-left">
                  <th className="p-3"></th>
                  <th className="p-3 text-blue-700">🟢 Deputado federal</th>
                  <th className="p-3 text-amber-700">🟠 Deputado estadual / distrital</th>
                </tr>
              </thead>
              <tbody>
                {DIFERENCAS.map(d => (
                  <tr key={d.aspecto} className="border-t border-gray-100">
                    <td className="p-3 font-semibold text-gray-700">{d.aspecto}</td>
                    <td className="p-3 text-gray-700">{d.federal}</td>
                    <td className="p-3 text-gray-700">{d.estadual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600">💡 Uma diferença de &quot;ferramenta&quot;: só o deputado federal e o senador podem indicar emendas no Orçamento da União. O estadual indica emendas no orçamento do estado.</p>
        </div>
      )}
    </div>
  )
}
