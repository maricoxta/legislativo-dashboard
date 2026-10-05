import { codigosSituacaoCamara, contarCamara, contarCamaraPorCodigos } from '@/lib/server/camara'
import { processosDoAno } from '@/lib/server/senado'
import { COD_CAMARA_ENCERRADAS, StatusPL, codigosCamara, statusSenado } from '@/lib/situacoes'

// Indicadores de PLs do ano, por Casa. null = fonte indisponível no momento.
export type IndicadoresCasa = { total: number | null } & Record<StatusPL, number | null>

export const INDICADORES_VAZIOS: IndicadoresCasa = {
  total: null, tramitando: null, aprovados: null, vetados: null, 'nao-aprovados': null,
}

const ok = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : null)

// Códigos de situação da Câmara para um status. "tramitando" = todos os
// códigos da referência menos os que encerram a tramitação.
export async function codigosDoStatusCamara(s: StatusPL): Promise<number[]> {
  if (s !== 'tramitando') return codigosCamara(s)
  const todos = await codigosSituacaoCamara()
  return todos.filter(c => !COD_CAMARA_ENCERRADAS.includes(c))
}

async function indicadoresCamara(ano: number): Promise<IndicadoresCasa> {
  const total = await contarCamara('PL', ano)
  const contar = (s: Exclude<StatusPL, 'tramitando'>) => contarCamaraPorCodigos('PL', ano, codigosCamara(s), total)

  const [aprovados, vetados, naoAprovados, encerradas] = await Promise.allSettled([
    contar('aprovados'),
    contar('vetados'),
    contar('nao-aprovados'),
    contarCamaraPorCodigos('PL', ano, COD_CAMARA_ENCERRADAS, total),
  ])
  const enc = ok(encerradas)
  return {
    total,
    tramitando: enc === null ? null : Math.max(total - enc, 0),
    aprovados: ok(aprovados),
    vetados: ok(vetados),
    'nao-aprovados': ok(naoAprovados),
  }
}

async function indicadoresSenado(ano: number): Promise<IndicadoresCasa> {
  const status = (await processosDoAno('PL', ano)).map(statusSenado)
  const contar = (s: StatusPL) => status.filter(x => x[s]).length
  return {
    total: status.length,
    tramitando: contar('tramitando'),
    aprovados: contar('aprovados'),
    vetados: contar('vetados'),
    'nao-aprovados': contar('nao-aprovados'),
  }
}

export async function indicadoresDoAno(ano: number) {
  const [camara, senado] = await Promise.allSettled([indicadoresCamara(ano), indicadoresSenado(ano)])
  return {
    camara: ok(camara) ?? INDICADORES_VAZIOS,
    senado: ok(senado) ?? INDICADORES_VAZIOS,
  }
}
