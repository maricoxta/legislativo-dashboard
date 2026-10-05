import { Cor } from '@/lib/processo-legislativo'

// Classes completas (o Tailwind só gera classes que aparecem escritas no código).
export const CORES: Record<Cor, { bg: string; bgForte: string; texto: string; borda: string; anel: string; linha: string }> = {
  blue:    { bg: 'bg-indigo-50',  bgForte: 'bg-indigo-600',  texto: 'text-indigo-700',  borda: 'border-indigo-200',  anel: 'ring-indigo-400',  linha: '#37629c' },
  emerald: { bg: 'bg-emerald-50', bgForte: 'bg-emerald-600', texto: 'text-emerald-700', borda: 'border-emerald-200', anel: 'ring-emerald-400', linha: '#10b981' },
  rose:    { bg: 'bg-rose-50',    bgForte: 'bg-rose-600',    texto: 'text-rose-700',    borda: 'border-rose-200',    anel: 'ring-rose-400',    linha: '#f43f5e' },
  amber:   { bg: 'bg-amber-50',   bgForte: 'bg-amber-500',   texto: 'text-amber-700',   borda: 'border-amber-200',   anel: 'ring-amber-400',   linha: '#f59e0b' },
  violet:  { bg: 'bg-violet-50',  bgForte: 'bg-violet-600',  texto: 'text-violet-700',  borda: 'border-violet-200',  anel: 'ring-violet-400',  linha: '#5d7bcf' },
}
