import { MapaMental } from '@/components/entenda/MapaMental'
import { FluxoAprovacao } from '@/components/entenda/FluxoAprovacao'

export const metadata = { title: 'Entenda o processo legislativo – Legislativo BR' }

export default function EntendaPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-6 shadow">
        <p className="text-3xl">🏛️✨</p>
        <h1 className="text-2xl font-extrabold mt-1">Como nascem as leis do Brasil?</h1>
        <p className="text-sm text-indigo-50 mt-1 max-w-2xl">
          Deputados e senadores trabalham como uma grande turma que decide as regras do país.
          Aqui você descobre, de um jeito bem simples, quem pode pedir uma regra nova e o caminho que ela percorre até virar lei.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">🧠 Mapa das ideias</h2>
          <p className="text-sm text-gray-500">Clique em cada bolinha para descobrir quem pode propor, como propor e por onde começa.</p>
        </div>
        <MapaMental />
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">🚀 A viagem de uma proposta</h2>
          <p className="text-sm text-gray-500">Escolha um tipo e siga o caminho passo a passo, ou aperte &quot;Ver tudo sozinho&quot;.</p>
        </div>
        <FluxoAprovacao />
      </section>

      <p className="text-xs text-gray-400">
        Baseado na Constituição Federal (arts. 59 a 69) e nos regimentos da Câmara e do Senado. Os textos são simplificados; os números exatos estão em &quot;Quero saber mais&quot;.
      </p>
    </div>
  )
}
