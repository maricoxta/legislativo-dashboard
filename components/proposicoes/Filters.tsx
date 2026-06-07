'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CAMARA_TEMAS, TIPO_SIGLAS } from '@/lib/config'

interface Props {
  source: 'camara' | 'senado'
  tipo?: string
  codTema?: string
}

export function ProposicaoFilters({ source, tipo, codTema }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [keywords, setKeywords] = useState(sp.get('keywords') ?? '')
  const [ano, setAno] = useState(sp.get('ano') ?? String(new Date().getFullYear()))

  function apply() {
    const params = new URLSearchParams()
    if (keywords) params.set('keywords', keywords)
    if (ano) params.set('ano', ano)
    router.push(`${pathname}?${params}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Ano</label>
        <select value={ano} onChange={e => setAno(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {[2026,2025,2024,2023,2022,2021,2020].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {source === 'camara' && (
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-500 mb-1">Palavras-chave</label>
          <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && apply()}
            placeholder="ex: reforma tributária..."
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      <button onClick={apply}
        className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
        Filtrar
      </button>
      <button onClick={() => { setKeywords(''); setAno(String(new Date().getFullYear())); router.push(pathname) }}
        className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors">
        Limpar
      </button>
    </div>
  )
}
