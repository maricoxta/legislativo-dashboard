import Link from 'next/link'
import { connection } from 'next/server'
import { anosDisponiveis, SeletorAno } from '@/components/temas/SeletorAno'
import { contagemPorTema, ultimaAvaliacao } from '@/lib/server/temas'
import { AvaliacaoClassificacao, ContagemTema } from '@/types/temas'

const fmt = (n: number) => n.toLocaleString('pt-BR')
const pct = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')}%`

function ComoFunciona({ a }: { a: AvaliacaoClassificacao | null }) {
  const m2 = a?.metricas.m2_tfidf_logreg
  const m1 = a?.metricas.m1_palavras_chave
  return (
    // Fechado por padrão: quem quiser entender o método abre o "Saiba mais".
    <details className="group bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-3 text-sm text-slate-600">
      <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
        <span className="inline-block transition-transform group-open:rotate-90">▸</span>
        Saiba mais: como os temas são atribuídos
      </summary>
      <div className="space-y-2 pt-3 pb-1">
        <p>
          Quando a Câmara já indexou o projeto, o site usa os <strong>temas oficiais</strong>. Os projetos ainda sem
          indexação e todos os do Senado recebem os <strong>temas previstos por um modelo</strong> de aprendizado de máquina
          (TF-IDF + Regressão Logística) treinado com a indexação oficial da Câmara. Assim, as duas Casas ficam organizadas
          pelos mesmos temas. O modelo é treinado e aplicado de novo todo dia.
        </p>
        {a && m1 && m2 && (
          <p>
            No teste com os PLs da Câmara de {a.ano_teste} ({fmt(a.parametros.pls_teste)} projetos, treino com {a.anos_treino}),
            o modelo acertou o tema principal em <strong>{pct(m2.acerto_tema_principal ?? 0)}</strong> dos projetos, com
            F1 de <strong>{pct(m2.f1_micro)}</strong>, contra {pct(m1.f1_micro)} da busca por palavras-chave.
            <span className="text-slate-400"> Última execução: {new Date(a.executado_em).toLocaleDateString('pt-BR')}.</span>
          </p>
        )}
      </div>
    </details>
  )
}

function CardTema({ c, ano }: { c: ContagemTema; ano: number }) {
  return (
    <Link href={`/temas/${encodeURIComponent(c.tema)}?ano=${ano}`}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:border-slate-300 hover:shadow transition flex flex-col gap-2">
      <p className="text-sm font-semibold text-slate-800 leading-snug">{c.tema}</p>
      <p className="text-2xl font-bold text-indigo-600">{fmt(c.total)} <span className="text-xs font-normal text-slate-400">PLs</span></p>
      <div className="flex gap-3 text-xs">
        <span className="text-teal-700">Câmara {fmt(c.camara)}</span>
        <span className="text-violet-700">Senado {fmt(c.senado)}</span>
      </div>
      {c.peloModelo > 0 && <p className="text-[11px] text-slate-400">{fmt(c.peloModelo)} classificados pelo modelo</p>}
    </Link>
  )
}

export default async function TemasPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await connection()
  const sp = await searchParams
  const pedido = parseInt(sp.ano ?? '')
  const ano = anosDisponiveis().includes(pedido) ? pedido : new Date().getFullYear()

  const [contagem, avaliacao] = await Promise.allSettled([contagemPorTema(ano), ultimaAvaliacao()])
  const temas = contagem.status === 'fulfilled' ? contagem.value : []
  const a = avaliacao.status === 'fulfilled' ? avaliacao.value : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proposições por Tema</h1>
          <p className="text-sm text-slate-500">
            Projetos de lei apresentados em {ano} na Câmara e no Senado. Um projeto pode ter mais de um tema e aparece
            em cada um deles, por isso a soma dos cards passa do total de projetos.
          </p>
        </div>
        <SeletorAno ano={ano} href={x => `/temas?ano=${x}`} />
      </div>

      <ComoFunciona a={a} />

      {temas.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {temas.map(c => <CardTema key={c.tema} c={c} ano={ano} />)}
        </div>
      ) : (
        <p className="text-center text-slate-400 py-12 text-sm">
          {contagem.status === 'rejected' ? 'Não foi possível ler os temas agora. Tente de novo em instantes.' : 'Ainda não há temas para este ano.'}
        </p>
      )}
    </div>
  )
}
