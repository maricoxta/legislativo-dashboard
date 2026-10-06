import Link from 'next/link'

export const PRIMEIRO_ANO = 2023 // o job classifica os PLs a partir deste ano

export function anosDisponiveis() {
  const atual = new Date().getFullYear()
  return Array.from({ length: atual - PRIMEIRO_ANO + 1 }, (_, i) => atual - i)
}

export function SeletorAno({ ano, href }: { ano: number; href: (a: number) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">Ano:</span>
      {anosDisponiveis().map(a => (
        <Link key={a} href={href(a)} aria-current={a === ano ? 'page' : undefined}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${a === ano ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {a}
        </Link>
      ))}
    </div>
  )
}
