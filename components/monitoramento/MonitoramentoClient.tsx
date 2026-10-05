'use client'
import { useEffect, useState } from 'react'
import { BillCard } from '@/components/proposicoes/BillCard'
import { SenadoCard } from '@/components/proposicoes/SenadoCard'
import type { ResultadoMonitoramento } from '@/types/monitoramento'
import { CardSkeleton } from '@/components/ui/Skeleton'

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
  blue: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500',
  purple: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-500',
}

type Resultado = ResultadoMonitoramento

// O site não tem login: as palavras alteradas nos temas padrão e os temas
// criados pelo usuário ficam salvos neste navegador.
const CHAVE_PALAVRAS = 'monitoramento:palavras-padrao'
const CHAVE_TEMAS = 'monitoramento:temas'

function ler<T>(chave: string, vazio: T): T {
  try { return JSON.parse(localStorage.getItem(chave) ?? '') ?? vazio } catch { return vazio }
}

function gravar(chave: string, v: unknown) {
  try { localStorage.setItem(chave, JSON.stringify(v)) } catch {}
}

export function MonitoramentoClient() {
  const [customTemas, setCustomTemas] = useState<Tema[]>([])
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

  useEffect(() => {
    setPalavrasPadrao(ler(CHAVE_PALAVRAS, {}))
    setCustomTemas(ler(CHAVE_TEMAS, []))
  }, [])

  function atualizarCustom(temas: Tema[]) {
    setCustomTemas(temas)
    gravar(CHAVE_TEMAS, temas)
  }

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

  function salvarPalavras(tema: Tema, keywords: string[]) {
    setAviso('')
    if (!keywords.length) { setAviso('O tema precisa de pelo menos uma palavra-chave.'); return }
    if (isPadrao(tema.id)) {
      const novo = { ...palavrasPadrao, [tema.id]: keywords }
      setPalavrasPadrao(novo)
      gravar(CHAVE_PALAVRAS, novo)
      return
    }
    atualizarCustom(customTemas.map(t => (t.id === tema.id ? { ...t, keywords } : t)))
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
    gravar(CHAVE_PALAVRAS, resto)
  }

  function addTema() {
    const nome = prompt('Nome do tema:')
    if (!nome?.trim()) return
    const kw = prompt('Palavras-chave (separadas por vírgula):')
    if (!kw?.trim()) return
    const keywords = kw.split(',').map(k => k.trim()).filter(Boolean)

    const novo: Tema = { id: `custom-${Date.now()}`, nome: nome.trim(), emoji: '🔍', cor: 'purple', keywords }
    atualizarCustom([novo, ...customTemas])
    setAtivoId(novo.id)
  }

  function removeTema(id: string) {
    if (!confirm('Remover este tema monitorado?')) return
    atualizarCustom(customTemas.filter(t => t.id !== id))
    if (ativoId === id) setAtivoId(TEMAS_PADRAO[0].id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Monitoramento por Temas</h1>
          <p className="text-sm text-slate-500">Acompanhe proposições por área de interesse</p>
        </div>
        <button onClick={addTema}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
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
              className={`bg-white rounded-xl border cursor-pointer hover:shadow-md transition-all p-4 ${isAtivo ? `ring-2 ${cls.split(' ').find(c => c.startsWith('ring-'))}` : 'border-slate-100 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{t.nome}</h3>
                    {isCustom && <span className="text-xs text-slate-400">Personalizado</span>}
                  </div>
                </div>
                {isCustom && (
                  <button onClick={e => { e.stopPropagation(); removeTema(t.id) }}
                    className="text-slate-300 hover:text-rose-400 p-1 transition-colors">
                    ✕
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {t.keywords.slice(0, 3).map(k => (
                  <span key={k} className={`text-xs px-2 py-0.5 rounded-full border ${cls.split(' ').slice(0, 3).join(' ')}`}>{k}</span>
                ))}
                {t.keywords.length > 3 && <span className="text-xs text-slate-400">+{t.keywords.length - 3}</span>}
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
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">{ativo.emoji} {ativo.nome}: palavras-chave do filtro</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mostramos as proposições da Câmara e os projetos de lei do Senado, deste ano e do anterior, que contêm qualquer uma destas palavras.
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
                  className="text-xs border border-slate-200 rounded-full px-3 py-1 w-44 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                <button type="submit" className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">Incluir</button>
              </form>
              {editado && (
                <button onClick={restaurarPadrao} className="text-xs text-slate-400 hover:text-slate-600 underline">Restaurar padrão</button>
              )}
            </div>
            {aviso && <p className="text-xs text-rose-500">{aviso}</p>}

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">
                Últimas proposições {!loading && <span className="font-normal text-slate-400">({resultados.length})</span>}
              </h4>
              {loading
                ? <div className="space-y-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
                : resultados.length
                  ? <div className="space-y-2">{resultados.map(r => (
                      <div key={r.casa === 'camara' ? `c${r.bill.id}` : `s${r.processo.id}`}>
                        <p className="text-xs text-slate-400 mb-1">
                          {r.casa === 'camara' ? 'Câmara' : 'Senado'} · encontrada por: {r.palavras.join(', ')}
                        </p>
                        {r.casa === 'camara' ? <BillCard bill={r.bill} /> : <SenadoCard processo={r.processo} />}
                      </div>
                    ))}</div>
                  : <p className="text-sm text-slate-400 text-center py-8">Nenhuma proposição deste ano ou do anterior com estas palavras-chave.</p>}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
