import { getCached, setCache } from '@/lib/cache'
import { CAMARA_API } from '@/lib/config'
import { ProposicaoCamara } from '@/types/camara'

export interface ListaCamara {
  dados: ProposicaoCamara[]
  links?: { rel: string; href: string }[]
}

// Usado pela rota /api/camara/proposicoes e direto pelas páginas do servidor.
export async function listarProposicoesCamara(params: URLSearchParams): Promise<ListaCamara> {
  const qs = params.toString()
  const cacheKey = `camara:proposicoes:${qs}`

  const cached = await getCached<ListaCamara>(cacheKey)
  if (cached) return cached

  const res = await fetch(`${CAMARA_API}/proposicoes?${qs}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ListaCamara = await res.json()
  await setCache(cacheKey, data, 30)
  return data
}
