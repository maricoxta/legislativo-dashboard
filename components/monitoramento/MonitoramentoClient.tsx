'use client'
import { useEffect, useState } from 'react'
import { BillCard } from '@/components/proposicoes/BillCard'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ProposicaoCamara } from '@/types/camara'

interface Tema {
  id: string
  nome: string
  emoji: string
  cor: string
  keywords: string[]
}

const TEMAS_PADRAO: Tema[] = [
  { id: 'saneamento', nome: 'Saneamento', emoji: '💧', cor: 'blue', keywords: ['saneamento', 'água potável', 'esgoto', 'resíduos sólidos'] },
  { id: 'meio-ambiente', nome: 'Meio Ambiente', emoji: '🌿', cor: 'green', keywords: ['mudança climática', 'clima', 'carbono', 'conservação'] },
  { id: 'defesa-civil', nome: 'Defesa Civil', emoji: '⛑️', cor: 'orange', keywords: ['desastre', 'enchente', 'seca', 'risco', 'emergência'] },
]

const COR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500',
  green: 'bg-green-50 text-green-700 border-green-200 ring-green-500',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500',
}

interface Resultado {
  bill: ProposicaoCamara
  palavras: string[] // palavras-chave do tema que encontraram a proposição
}

// Os temas padrão são fixos no código; as palavras que o usuário muda neles
// ficam neste navegador. Temas personalizados são salvos no Supabase.
const CHAVE_LOCAL = 'monitoramento:palavras-padrao'

function lerPalavrasLocais(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? '{}') } catch { return {} }
}

function salvarPalavrasLocais(v: Record<string, string[]>) {
  try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(v)) } catch {}
}

export function MonitoramentoClient({ initialTemas }: { initialTemas: Tema[] }) {
  const [customTemas, setCustomTemas] = useState<Tema[]>(initialTemas)
  const [palavrasPadrao, setPalavrasPadrao] = useState<Record<string, string[]>>({})
  const [ativoId, setAtivoId] = useState<string>(TEMAS_PADRAO[0].id)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(false)
  const [novaPalavra, setNovaPalavra] = useState('')
  const [aviso, setAviso] = useState('')

  const padrao = TEMAS_PADRAO.map(t => ({ ...t, keywords: palavrasPadrao[t.id] ?? t.keywords }))
  const allTemas = [...padrao, ...customTemas]
  const ativo = allTemas.find(t => t.id === ativoId) ?? null
  const isPadrao = (id: string) => TEMAS_PADRAO.some(c => c.id === id)

  useEffect(() => { setPalavrasPadrao(lerPalavrasLocais()) }, [])

  // Busca de novo sempre que o tema ativo ou as palavras dele mudam.
  const chaveBusca = ativo ? `${ativo.id}|${ativo.keywords.join('|')}` : ''
  useEffect(() => {
    if (!ativo) return
    let cancelado = false
    setLoading(true)
    const qs = new URLSearchParams(ativo.keywords.map(k => ['kw', k]))
    fetch(`/api/monitoramento?${qs}`)
      .then(r => r.json())
      .then(d => { if (!cancelado) setResultados(d.dados ?? []) })
      .catch(() => { if (!cancelado) setResultados([]) })
      .finally(() => { if (!cancelado) setLoading(false) })
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveBusca])

  async function salvarPalavras(tema: Tema, keywords: string[]) {
    setAviso('')
    if (!keywords.length) { setAviso('O tema precisa de pelo menos uma palavra-chave.'); return }
    if (isPadrao(tema.id)) {
      const novo = { ...palavrasPadrao, [tema.id]: keywords }
      setPalavrasPadrao(novo)
      salvarPalavrasLocais(novo)
      return
    }
    const anterior = tema.keywords
    setCustomTemas(prev => prev.map(t => (t.id === tema.id ? { ...t, keywords } : t)))
    const res = await fetch('/api/temas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tema.id, keywords }),
    })
    if (!res.ok) {
      setCustomTemas(prev => prev.map(t => (t.id === tema.id ? { ...t, keywords: anterior } : t)))
      setAviso('Não foi possível salvar. Faça login para editar seus temas.')
    }
  }

  function incluirPalavra() {
    if (!ativo) return
    const novas = novaPalavra.split(',').map(k => k.trim()).filter(Boolean)
    const keywords = [...new Set([...ativo.keywords, ...novas])]
    setNovaPalavra('')
    if (keywords.length !== ativo.keywords.length) salvarPalavras(ativo, keywords)
  }

  function excluirPalavra(k: string) {
    if (ativo) salvarPalavras(ativo, ativo.keywords.filter(x => x !== k))
  }

  function restaurarPadrao() {
    if (!ativo) return
    const { [ativo.id]: _removido, ...resto } = palavrasPadrao
    void _removido
    setPalavrasPadrao(resto)
    salvarPalavrasLocais(resto)
  }

  async function addTema() {
    const nome = prompt('Nome do tema:')
    if (!nome?.trim()) return
    const kw = prompt('Palavras-chave (separadas por vírgula):')
    if (!kw?.trim()) return
    const keywords = kw.split(',').map(k => k.trim()).filter(Boolean)

    const res = await fetch('/api/temas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nome.trim(), emoji: '🔍', cor: 'purple', keywords }),
    })
    if (res.ok) {
      const novo = await res.json()
      setCustomTemas(prev => [novo, ...prev])
    } else {
      alert('Erro ao salvar tema. Faça login para usar esta funcionalidade.')
    }
  }

  async function removeTema(id: string) {
    if (!confirm('Remover este tema monitorado?')) return
    await fetch('/api/temas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setCustomTemas(prev => prev.filter(t => t.id !== id))
    if (ativoId === id) setAtivoId(TEMAS_PADRAO[0].id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monitoramento por Temas</h1>
          <p className="text-sm text-gray-500">Acompanhe proposições por área de interesse</p>
        </div>
        <button onClick={addTema}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          + Novo Tema
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allTemas.map(t => {
          const cls = COR_MAP[t.cor] ?? COR_MAP.blue
          const isCustom = !isPadrao(t.id)
          const isAtivo = ativoId === t.id
          return (
            <div key={t.id} onClick={() => setAtivoId(t.id)}
              className={`bg-white rounded-xl border cursor-pointer hover:shadow-md transition-all p-4 ${isAtivo ? `ring-2 ${cls.split(' ').find(c => c.startsWith('ring-'))}` : 'border-gray-100 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.nome}</h3>
                    {isCustom && <span className="text-xs text-gray-400">Personalizado</span>}
                  </div>
                </div>
                {isCustom && (
                  <button onClick={e => { e.stopPropagation(); removeTema(t.id) }}
                    className="text-gray-300 hover:text-red-400 p-1 transition-colors">
                    ✕
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {t.keywords.slice(0, 3).map(k => (
                  <span key={k} className={`text-xs px-2 py-0.5 rounded-full border ${cls.split(' ').slice(0, 3).join(' ')}`}>{k}</span>
                ))}
                {t.keywords.length > 3 && <span className="text-xs text-gray-400">+{t.keywords.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {ativo && (() => {
        const cls = COR_MAP[ativo.cor] ?? COR_MAP.blue
        const chip = cls.split(' ').slice(0, 3).join(' ')
        const editado = isPadrao(ativo.id) && palavrasPadrao[ativo.id] !== undefined
        return (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">{ativo.emoji} {ativo.nome}: palavras-chave do filtro</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Mostramos as proposições da Câmara deste ano e do anterior que contêm qualquer uma destas palavras.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {ativo.keywords.map(k => (
                <span key={k} className={`text-xs pl-2.5 pr-1 py-1 rounded-full border flex items-center gap-1 ${chip}`}>
                  {k}
                  <button onClick={() => excluirPalavra(k)} aria-label={`Excluir ${k}`}
                    className="w-4 h-4 rounded-full hover:bg-white/80 leading-none">×</button>
                </span>
              ))}
              <form onSubmit={e => { e.preventDefault(); incluirPalavra() }} className="flex gap-1">
                <input value={novaPalavra} onChange={e => setNovaPalavra(e.target.value)}
                  placeholder="Incluir palavra-chave"
                  className="text-xs border border-gray-200 rounded-full px-3 py-1 w-44 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <button type="submit" className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700">Incluir</button>
              </form>
              {editado && (
                <button onClick={restaurarPadrao} className="text-xs text-gray-400 hover:text-gray-600 underline">Restaurar padrão</button>
              )}
            </div>
            {aviso && <p className="text-xs text-red-500">{aviso}</p>}

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Últimas proposições {!loading && <span className="font-normal text-gray-400">({resultados.length})</span>}
              </h4>
              {loading
                ? <div className="space-y-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
                : resultados.length
                  ? <div className="space-y-2">{resultados.map(r => (
                      <div key={r.bill.id}>
                        <p className="text-xs text-gray-400 mb-1">Encontrada por: {r.palavras.join(', ')}</p>
                        <BillCard bill={r.bill} />
                      </div>
                    ))}</div>
                  : <p className="text-sm text-gray-400 text-center py-8">Nenhuma proposição deste ano ou do anterior com estas palavras-chave.</p>}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
