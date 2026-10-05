import { contarSituacaoCamara, FiltroSituacao } from '@/lib/server/camara'
import { processosDoAno } from '@/lib/server/senado'
import { COD_CAMARA_ENCERRADAS, StatusPL, codigosCamara, statusSenado } from '@/lib/situacoes'

// Indicadores de PLs do ano, por Casa. null = fonte indisponível no momento.
export type IndicadoresCasa = { total: number | null } & Record<StatusPL, number | null>

export const INDICADORES_VAZIOS: IndicadoresCasa = {
  total: null, tramitando: null, aprovados: null, vetados: null, 'nao-aprovados': null,
}

const ok = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : null)

// Filtro da tabela camara_pl_situacao para um status. "tramitando" = todos
// os PLs menos os que estão numa situação que encerra a tramitação.
export function filtroStatusCamara(ano: number, s?: StatusPL): FiltroSituacao {
  if (!s) return { ano }
  if (s === 'tramitando') return { ano, excluir: COD_CAMARA_ENCERRADAS }
  return { ano, codigos: codigosCamara(s) }
}

async function indicadoresCamara(ano: number): Promise<IndicadoresCasa> {
  const contar = (s?: StatusPL) => contarSituacaoCamara(filtroStatusCamara(ano, s))
  const [total, tramitando, aprovados, vetados, naoAprovados] = await Promise.allSettled([
    contar(), contar('tramitando'), contar('aprovados'), contar('vetados'), contar('nao-aprovados'),
  ])
  // Tabela vazia = o job ainda não rodou: melhor "—" do que zeros.
  if (!ok(total)) return INDICADORES_VAZIOS
  return {
    total: ok(total),
    tramitando: ok(tramitando),
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
