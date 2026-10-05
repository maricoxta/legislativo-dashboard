import type { StatusPL } from '@/lib/situacoes'

// Cores das Casas nos gráficos: as mesmas do tema em app/globals.css
// (teal-600 = Câmara, violet-600 = Senado), validadas para daltonismo.
export const CASA_HEX = { camara: '#238d9c', senado: '#1f49a1' }

// Ordem fixa das situações no gráfico.
export const STATUS_GRAFICO: { id: StatusPL; nome: string }[] = [
  { id: 'tramitando', nome: 'Em tramitação' },
  { id: 'aprovados', nome: 'Aprovados até agora' },
  { id: 'vetados', nome: 'Vetados' },
  { id: 'nao-aprovados', nome: 'Não aprovados' },
]
