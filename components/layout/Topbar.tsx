'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  function handleSearch(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && q.trim()) {
      router.push(`/busca?q=${encodeURIComponent(q.trim())}`)
    }
  }

  async function signOut() {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.refresh()
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
      <div className="ml-auto flex items-center gap-3">
        {userEmail ? (
          <>
            <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
            <button onClick={signOut} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              Sair
            </button>
          </>
        ) : (
          <a href="/auth/login" className="text-xs text-blue-600 hover:underline font-medium">Entrar</a>
        )}
      </div>
    </header>
  )
}
