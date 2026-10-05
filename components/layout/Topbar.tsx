'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function Topbar() {
  const router = useRouter()
  const [q, setQ] = useState('')
  function handleSearch(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && q.trim()) {
      router.push(`/busca?q=${encodeURIComponent(q.trim())}`)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 sticky top-0 z-20 flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)} onKeyDown={handleSearch}
          placeholder="Buscar proposição, ementa, tema..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </header>
  )
}
