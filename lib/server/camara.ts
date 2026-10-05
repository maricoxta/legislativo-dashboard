import { getCached, setCache } from '@/lib/cache'
import { createAdminClient, supabaseUrl } from '@/lib/supabase/admin'
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
  const { count, error, status } = await consultaSituacao(f, 'id', { count: 'exact', head: true })
  // Consultas só de contagem voltam sem corpo no erro; o código HTTP é a pista.
  if (error) throw new Error([`HTTP ${status}`, error.message, error.details].filter(Boolean).join(' — '))
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

// PLs apresentados em cada mês do ano (12 contagens, uma por mês).
export async function porMesCamara(ano: number): Promise<number[]> {
  const supabase = createAdminClient()
  if (!supabase) throw new Error('Supabase não configurado')
  const mes = (m: number) => `${m > 12 ? ano + 1 : ano}-${String(m > 12 ? 1 : m).padStart(2, '0')}-01`
  return Promise.all(
    Array.from({ length: 12 }, async (_, i) => {
      const { count, error } = await supabase
        .from('camara_pl_situacao')
        .select('id', { count: 'exact', head: true })
        .eq('sigla_tipo', 'PL')
        .eq('ano', ano)
        .gte('data_apresentacao', mes(i + 1))
        .lt('data_apresentacao', mes(i + 2))
      if (error) throw new Error(error.message)
      return count ?? 0
    }),
  )
}

// Motivo, em texto, de a tabela da Câmara não responder (null = está ok).
// Aparece no dashboard para facilitar achar erro de configuração.
export async function diagnosticoCamara(ano: number): Promise<string | null> {
  const url = supabaseUrl()
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) return 'a variável SUPABASE_URL não existe neste ambiente da Vercel'
  if (!chave) return 'a variável SUPABASE_SERVICE_ROLE_KEY não existe neste ambiente da Vercel'
  const problemaChave = conferirChave(chave, url)
  if (problemaChave) return problemaChave
  try {
    const n = await contarSituacaoCamara({ ano })
    return n ? null : `a tabela camara_pl_situacao não tem PLs de ${ano}`
  } catch (e) {
    // "fetch failed" esconde o motivo real (endereço inexistente, etc.) em e.cause.
    const causa = e instanceof Error && e.cause instanceof Error ? ` (${e.cause.message})` : ''
    let host = url
    try { host = new URL(url.trim()).host } catch {}
    return `o Supabase respondeu: ${e instanceof Error ? e.message : String(e)}${causa}; endereço usado: ${host}`
  }
}

// Lê o "crachá" da chave (o meio do JWT, que não é secreto) para dizer se
// ela é a service_role e se é do mesmo projeto do endereço.
function conferirChave(chave: string, url: string): string | null {
  const k = chave.trim()
  if (k.startsWith('sb_publishable_')) return 'a SUPABASE_SERVICE_ROLE_KEY da Vercel é a chave pública (publishable); use a chave secreta (secret ou service_role)'
  if (k.startsWith('sb_secret_')) return null
  const partes = k.split('.')
  if (partes.length !== 3) return 'a SUPABASE_SERVICE_ROLE_KEY da Vercel não parece uma chave do Supabase (copiada pela metade?)'
  try {
    const dados = JSON.parse(Buffer.from(partes[1], 'base64url').toString())
    if (dados.role !== 'service_role') return `a SUPABASE_SERVICE_ROLE_KEY da Vercel é a chave "${dados.role}", não a service_role`
    const projetoUrl = new URL(url.trim()).host.split('.')[0]
    if (dados.ref && dados.ref !== projetoUrl) return `a SUPABASE_SERVICE_ROLE_KEY é do projeto ${dados.ref}, mas o endereço é do projeto ${projetoUrl}`
  } catch {
    return 'a SUPABASE_SERVICE_ROLE_KEY da Vercel não parece uma chave do Supabase (copiada pela metade?)'
  }
  return null
}
