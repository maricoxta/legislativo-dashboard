'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Entenda o Processo' },
  { href: '/dashboard', label: 'Dashboard', icon: <rect x="3" y="3" width="7" height="7"/>, icon2: <><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></> },
  { href: '/busca', label: 'Busca Avançada' },
  { href: '/monitoramento', label: 'Monitoramento por Temas' },
  { href: '/agenda', label: 'Agenda Legislativa' },
]

function NavLink({ href, label }: { href: string; label: string }) {
  const path = usePathname()
  const active = path === href || (href !== '/' && path.startsWith(href))
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-violet-100 hover:bg-violet-800'}`}
    >
      {label}
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-violet-900 text-white flex flex-col z-30">
      <div className="p-5 border-b border-violet-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Legislativo BR</p>
            <p className="text-xs text-violet-200 mt-0.5">Painel de Proposições</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-1 text-sm">
        {NAV.map(n => <NavLink key={n.href} href={n.href} label={n.label} />)}

        <div className="pt-3">
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-300" />
            <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">Senado</span>
          </div>
          {(['PL','PEC','MPV'] as const).map(t => (
            <Link key={t} href={`/proposicoes/senado/${t}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-violet-800 transition-colors text-violet-100 text-xs">
              {t === 'PL' ? 'Projetos de Lei' : t === 'PEC' ? 'PEC – Emendas' : 'Medidas Provisórias'}
            </Link>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-violet-800 text-xs text-violet-200">
        <p>Dados: <a href="https://dadosabertos.camara.leg.br" target="_blank" className="text-teal-200 hover:underline">Câmara</a> &amp; <a href="https://legis.senado.leg.br/dadosabertos" target="_blank" className="text-teal-200 hover:underline">Senado</a></p>
      </div>
    </aside>
  )
}
