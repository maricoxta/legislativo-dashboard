import { getCached, setCache } from '@/lib/cache'
import { createAdminClient } from '@/lib/supabase/admin'
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

// ---------- Situação dos PLs (tabela camara_pl_situacao) ----------
// A API da Câmara ignora o filtro codSituacao, então a situação de cada PL
// vem da tabela que o job jobs/camara_situacao.py carrega todo dia.
export interface FiltroSituacao {
  ano: number
  codigos?: number[] // só estas situações
  excluir?: number[] // todas menos estas
}

export interface LinhaSituacaoCamara {
  id: number
  sigla_tipo: string
  numero: number
  ano: number
  ementa: string | null
  data_apresentacao: string | null
  cod_situacao: number | null
  descricao_situacao: string | null
  data_situacao: string | null
  sigla_orgao: string | null
}

const paraProposicao = (l: LinhaSituacaoCamara): ProposicaoCamara => ({
  id: l.id,
  siglaTipo: l.sigla_tipo,
  numero: l.numero,
  ano: l.ano,
  ementa: l.ementa ?? '',
  dataApresentacao: l.data_apresentacao ?? undefined,
  statusProposicao: l.descricao_situacao
    ? { descricaoSituacao: l.descricao_situacao, siglaOrgao: l.sigla_orgao ?? undefined, dataHora: l.data_situacao ?? undefined }
    : undefined,
})

function consultaSituacao(f: FiltroSituacao, colunas: string, opcoes: { count: 'exact'; head?: boolean }) {
  const supabase = createAdminClient()
  if (!supabase) throw new Error('Supabase não configurado')
  let q = supabase.from('camara_pl_situacao').select(colunas, opcoes).eq('sigla_tipo', 'PL').eq('ano', f.ano)
  if (f.codigos) q = q.in('cod_situacao', f.codigos)
  // "excluir" mantém os PLs sem código de situação (ainda em tramitação).
  if (f.excluir) q = q.or(`cod_situacao.is.null,cod_situacao.not.in.(${f.excluir.join(',')})`)
  return q
}

export async function contarSituacaoCamara(f: FiltroSituacao): Promise<number> {
  const { count, error } = await consultaSituacao(f, 'id', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function listarSituacaoCamara(f: FiltroSituacao, pagina: number, porPagina: number) {
  const inicio = (pagina - 1) * porPagina
  const { data, count, error } = await consultaSituacao(f, '*', { count: 'exact' })
    .order('id', { ascending: false })
    .range(inicio, inicio + porPagina - 1)
  if (error) throw new Error(error.message)
  const dados = ((data ?? []) as unknown as LinhaSituacaoCamara[]).map(paraProposicao)
  return { dados, total: count ?? 0 }
}

// Busca na ementa dos PLs da tabela camara_pl_situacao. O parâmetro
// `keywords` da API só olha a indexação da Câmara, que costuma vir vazia
// nos projetos recentes; a ementa sempre existe.
export async function buscarEmentaCamara(palavras: string[], desde: string, limite = 100): Promise<ProposicaoCamara[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  // Vírgulas, parênteses, aspas e * quebram o filtro `or` do PostgREST.
  const termos = palavras.map(p => p.replace(/[,()"*\\]/g, ' ').trim()).filter(Boolean)
  if (!termos.length) return []
  const { data, error } = await supabase
    .from('camara_pl_situacao')
    .select('*')
    .or(termos.map(t => `ementa.ilike."*${t}*"`).join(','))
    .gte('data_apresentacao', desde)
    .order('id', { ascending: false })
    .limit(limite)
  if (error) throw new Error(error.message)
  return ((data ?? []) as LinhaSituacaoCamara[]).map(paraProposicao)
}
