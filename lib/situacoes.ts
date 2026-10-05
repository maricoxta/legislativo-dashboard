import { ProcessoSenado } from '@/types/senado'

// Grupos de situação usados nos indicadores do dashboard e nos filtros das listas.
export type StatusPL = 'tramitando' | 'aprovados' | 'vetados' | 'nao-aprovados'

export const STATUS_PL: Record<StatusPL, { titulo: string; descricao: string }> = {
  tramitando: { titulo: 'Em tramitação', descricao: 'ainda sem decisão final' },
  aprovados: { titulo: 'Aprovados até agora', descricao: 'apresentados no ano e que já viraram lei ou foram aprovados e aguardam a outra Casa, sanção ou promulgação' },
  vetados: { titulo: 'Vetados', descricao: 'vetados totalmente pela Presidência da República' },
  'nao-aprovados': { titulo: 'Não aprovados', descricao: 'arquivados, rejeitados, retirados pelo autor, prejudicados ou que perderam a eficácia' },
}

export const isStatusPL = (s?: string): s is StatusPL => !!s && s in STATUS_PL

// ---------- Câmara ----------
// Códigos de /referencias/proposicoes/codSituacao.
export const COD_CAMARA = {
  lei: [1140], // Transformado em Norma Jurídica
  aprovadosAguardando: [
    1150, // Aguardando Sanção
    1160, // Aguardando Remessa à Sanção
    1294, // Aguardando Promulgação
    1070, // Aguardando Envio ao Executivo
    1293, // Aguardando Envio ao Senado Federal
    1303, // Enviada ao Senado Federal
    926, // Aguardando Apreciação pelo Senado Federal
  ],
  vetados: [
    937, // Vetado totalmente
    939, // Aguardando Apreciação do Veto
  ],
  naoAprovados: [
    923, // Arquivada
    930, // Enviada ao Arquivo
    931, // Aguardando Remessa ao Arquivo
    940, // Aguardando Despacho de Arquivamento
    941, // Recusado
    950, // Retirado pelo(a) Autor(a)
    1120, // Devolvida ao(à) Autor(a)
    1222, // Prejudicialidade
    1292, // Perdeu a Eficácia
  ],
  // Encerradas por outro motivo: não contam como "em tramitação".
  outrasEncerradas: [
    1230, // Transformado em nova proposição
    1285, // Tramitação Finalizada
  ],
}

// Situações que tiram a proposição da tramitação na Câmara.
export const COD_CAMARA_ENCERRADAS = [
  ...COD_CAMARA.lei,
  ...COD_CAMARA.vetados,
  ...COD_CAMARA.naoAprovados,
  ...COD_CAMARA.outrasEncerradas,
]

// Códigos de cada status. "tramitando" não tem lista fixa: são todos os
// códigos da referência menos os encerrados (ver lib/server/indicadores.ts).
export const codigosCamara = (s: Exclude<StatusPL, 'tramitando'>): number[] =>
  s === 'aprovados' ? [...COD_CAMARA.lei, ...COD_CAMARA.aprovadosAguardando]
  : s === 'vetados' ? COD_CAMARA.vetados
  : COD_CAMARA.naoAprovados

// ---------- Senado ----------
// O item de /processo traz tramitando ("Sim"/"Não"), normaGerada,
// siglaTipoDeliberacao (/processo/tipos-decisao) e situacaoAtual
// (descrição de /processo/tipos-situacao).
const DECISAO_NAO_APROVADA = /^(REJEITADO|PREJUDICADO|ARQUIVADO|RETIRADO|PERDA_EFICACIA|SEM_EFICACIA|REVOGADO|DEVOLVIDO|IMPUGNADO|INADIMITIDA)/
const SITUACAO_NAO_APROVADA = /REJEITAD|ARQUIV|PREJUDICAD|RETIRADA PELO AUTOR|SEM EFIC|REVOGAD|IMPUGNAD/
const SITUACAO_VETADA = /^VETAD|VETO (MANTIDO|DELIBERADO)/
const SITUACAO_APROVADA = /NORMA JUR|REMETIDA À (SANÇÃO|PROMULGA|CÂMARA)/

export function statusSenado(p: ProcessoSenado): Record<StatusPL, boolean> {
  const decisao = p.siglaTipoDeliberacao ?? ''
  const situacao = (p.situacaoAtual ?? '').toUpperCase()

  const vetados = SITUACAO_VETADA.test(situacao)
  const aprovados = !vetados && (!!p.normaGerada || decisao.startsWith('APROVAD') || SITUACAO_APROVADA.test(situacao))
  const naoAprovados = !vetados && !aprovados && (DECISAO_NAO_APROVADA.test(decisao) || SITUACAO_NAO_APROVADA.test(situacao))

  return {
    tramitando: p.tramitando === 'Sim',
    aprovados,
    vetados,
    'nao-aprovados': naoAprovados,
  }
}
