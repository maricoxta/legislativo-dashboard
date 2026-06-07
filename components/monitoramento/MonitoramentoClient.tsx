'use client'
import { useState } from 'react'
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

const CNM_TEMAS: Tema[] = [
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

export function MonitoramentoClient({ initialTemas }: { initialTemas: Tema[] }) {
  const [customTemas, setCustomTemas] = useState<Tema[]>(initialTemas)
  const [ativo, setAtivo] = useState<Tema | null>(CNM_TEMAS[0])
  const [bills, setBills] = useState<ProposicaoCamara[]>([])
  const [loading, setLoading] = useState(false)

  const allTemas = [...CNM_TEMAS, ...customTemas]

  async function loadTema(tema: Tema) {
    setAtivo(tema)
    setLoading(true)
    try {
      const res = await fetch(`/api/camara/proposicoes?keywords=${encodeURIComponent(tema.keywords[0])}&itens=10`)
      const data = await res.json()
      setBills(data.dados ?? [])
    } finally {
      setLoading(false)
    }
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
    if (ativo?.id === id) setAtivo(CNM_TEMAS[0])
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
          const isCustom = !CNM_TEMAS.find(c => c.id === t.id)
          const isAtivo = ativo?.id === t.id
          return (
            <div key={t.id} onClick={() => loadTema(t)}
              className={`bg-white rounded-xl border cursor-pointer hover:shadow-md transition-all p-4 ${isAtivo ? `ring-2 ${cls.split(' ').find(c => c.startsWith('ring-'))}` : 'border-gray-100 shadow-sm'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t.nome}</h3>
                    <span className="text-xs text-gray-400">{isCustom ? 'Personalizado' : 'CNM'}</span>
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

      {ativo && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{ativo.emoji} {ativo.nome} — Últimas Proposições</h3>
          {loading
            ? <div className="space-y-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
            : bills.length
              ? <div className="space-y-2">{bills.map(b => <BillCard key={b.id} bill={b} />)}</div>
              : <p className="text-sm text-gray-400 text-center py-8">Nenhuma proposição encontrada para &quot;{ativo.keywords[0]}&quot;.</p>}
        </div>
      )}
    </div>
  )
}
