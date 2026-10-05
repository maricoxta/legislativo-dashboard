'use client'
import { useState, useEffect } from 'react'
import { BillCard } from '@/components/proposicoes/BillCard'
import { SenadoCard } from '@/components/proposicoes/SenadoCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ProposicaoCamara } from '@/types/camara'
import { ProcessoSenado } from '@/types/senado'
import { TIPO_SIGLAS, CAMARA_TEMAS, PARTIDOS_BR, UF_LIST } from '@/lib/config'
import { useRouter } from 'next/navigation'

const SUGESTOES = ['saneamento','meio ambiente','defesa civil','reforma tributária','saúde mental','educação básica','habitação','segurança pública','tecnologia','previdência']

interface Props {
  initialParams: Record<string, string>
}

export function BuscaForm({ initialParams }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initialParams.q ?? '')
  const [numero, setNumero] = useState(initialParams.numero ?? '')
  const [tipo, setTipo] = useState(initialParams.tipo ?? '')
  const [ano, setAno] = useState(initialParams.ano ?? '')
  const [codTema, setCodTema] = useState(initialParams.codTema ?? '')
  const [partido, setPartido] = useState(initialParams.partido ?? '')
  const [uf, setUf] = useState(initialParams.uf ?? '')
  const [useCamara, setUseCamara] = useState(true)
  const [useSenado, setUseSenado] = useState(true)

  const [results, setResults] = useState<{ camara: ProposicaoCamara[]; senado: ProcessoSenado[]; avisos: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialParams.q || initialParams.numero) doSearch()
  }, [])

  async function doSearch(termo?: string) {
    const busca = termo ?? q
    const hasInput = busca || numero || partido || uf || tipo || codTema || ano
    if (!hasInput || (!useCamara && !useSenado)) return

    setLoading(true)
    try {
      const qs = new URLSearchParams({ camara: useCamara ? '1' : '0', senado: useSenado ? '1' : '0' })
      const campos: Record<string, string> = { q: busca, numero, tipo, ano, codTema, partido, uf }
      for (const [k, v] of Object.entries(campos)) if (v) qs.set(k, v)
      const r = await fetch(`/api/busca?${qs}`).then(res => res.json()).catch(() => null)
      setResults({
        camara: r?.camara ?? [],
        senado: r?.senado ?? [],
        avisos: r ? (r.avisos ?? []) : ['Não foi possível buscar agora. Tente de novo em instantes.'],
      })
    } finally {
      setLoading(false)
    }
  }

  function handleSugestao(term: string) {
    setQ(term)
    doSearch(term)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Busca Avançada de Proposições</h2>
        <p className="text-sm text-slate-500 mb-5">Pesquise nas bases da Câmara dos Deputados e do Senado Federal</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Palavras-chave / Ementa</label>
            <input type="text" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="ex: reforma tributária, saneamento..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
            <input type="text" value={numero} onChange={e => setNumero(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="ex: 1234 ou 1234/2022"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos</option>
              {Object.entries(TIPO_SIGLAS).map(([k, v]) => <option key={k} value={k}>{k} – {v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ano</label>
            <select value={ano} onChange={e => setAno(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos</option>
              {[2026,2025,2024,2023,2022,2021,2020,2019,2018].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Partido</label>
            <select value={partido} onChange={e => setPartido(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos</option>
              {PARTIDOS_BR.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estado (UF)</label>
            <select value={uf} onChange={e => setUf(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos</option>
              {UF_LIST.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tema (Câmara)</label>
            <select value={codTema} onChange={e => setCodTema(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos</option>
              {CAMARA_TEMAS.map(t => <option key={t.cod} value={String(t.cod)}>{t.emoji} {t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Buscar em</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={useCamara} onChange={e => setUseCamara(e.target.checked)} className="rounded" /> Câmara
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={useSenado} onChange={e => setUseSenado(e.target.checked)} className="rounded" /> Senado
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => doSearch()}
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            🔍 Buscar
          </button>
          <button onClick={() => { setQ(''); setNumero(''); setTipo(''); setAno(''); setCodTema(''); setPartido(''); setUf(''); setResults(null) }}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
            Limpar
          </button>
        </div>
      </div>

      {!results && !loading && (
        <div className="bg-indigo-50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-indigo-700 mb-3">💡 Sugestões de pesquisa</h3>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES.map(t => (
              <button key={t} onClick={() => handleSugestao(t)}
                className="text-xs bg-white text-indigo-600 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="space-y-3">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>}

      {results && !loading && (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            <strong className="text-slate-800">{results.camara.length + results.senado.length}</strong> resultado(s) ·{' '}
            {results.camara.length} Câmara, {results.senado.length} Senado
          </p>
          {results.avisos.map(a => <p key={a} className="text-xs text-slate-400 mb-2">{a}</p>)}
          {results.camara.length + results.senado.length === 0
            ? <p className="text-center text-slate-400 py-12 text-sm">Nenhuma proposição encontrada.</p>
            : (
              <div className="space-y-3">
                {results.camara.map(b => <BillCard key={b.id} bill={b} />)}
                {results.senado.map(p => <SenadoCard key={p.id} processo={p} />)}
              </div>
            )}
        </div>
      )}
    </div>
  )
}
