import { ProposicaoCamara } from '@/types/camara'
import { ProcessoSenado } from '@/types/senado'

// Item devolvido por /api/monitoramento: a proposição e as palavras-chave
// do tema que a encontraram.
export type ResultadoMonitoramento =
  | { casa: 'camara'; bill: ProposicaoCamara; palavras: string[] }
  | { casa: 'senado'; processo: ProcessoSenado; palavras: string[] }
