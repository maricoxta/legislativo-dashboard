import { QUORUNS } from '@/lib/processo-legislativo'

// Barrinha com a parte da Casa que precisa dizer "sim".
function Barra({ fracao, cor }: { fracao: number; cor: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.round(fracao * 100)}%` }} />
    </div>
  )
}

const COR_BARRA = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500']

export function QuantosVotos() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-gray-800 space-y-1">
        <p>🏛️🏛️ <strong>Toda lei federal precisa ganhar nas duas Casas:</strong> primeiro em uma (quase sempre a Câmara) e depois na outra (o Senado), que revisa.</p>
        <p>🔢 O que muda de um tipo de proposta para outro é <strong>quantos votos &quot;sim&quot;</strong> ela precisa em cada Casa. A regra é a mesma na Câmara e no Senado; só os números mudam, porque a Câmara tem 513 deputados e o Senado tem 81 senadores.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {QUORUNS.map((q, i) => (
          <div key={q.nome} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{q.emoji}</span>
              <div>
                <p className="font-extrabold text-gray-900">{q.nome}</p>
                <p className="text-xs text-gray-500">{i === 0 ? 'o mais fácil' : i === QUORUNS.length - 1 ? 'o mais difícil' : `nível ${i + 1} de ${QUORUNS.length}`}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{q.explicacao}</p>
            <Barra fracao={q.fracao} cor={COR_BARRA[i % COR_BARRA.length]} />
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-green-50 p-2">
                <dt className="font-semibold text-green-800">Na Câmara</dt>
                <dd className="text-gray-700">{q.camara}</dd>
              </div>
              <div className="rounded-lg bg-purple-50 p-2">
                <dt className="font-semibold text-purple-800">No Senado</dt>
                <dd className="text-gray-700">{q.senado}</dd>
              </div>
            </dl>
            <div>
              <p className="text-xs font-semibold text-gray-500">Usado para:</p>
              <ul className="text-sm text-gray-700 list-disc pl-5">
                {q.usadoEm.map(u => <li key={u}>{u}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
