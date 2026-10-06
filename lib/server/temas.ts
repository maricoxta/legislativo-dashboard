import { createAdminClient } from '@/lib/supabase/admin'
import { AvaliacaoClassificacao, ContagemTema, PlTema } from '@/types/temas'

// Temas dos PLs, gravados pelo job jobs/classificacao_tematica.py: tema oficial
// quando a Câmara já indexou o PL; senão, o previsto pelo modelo (TF-IDF +
// Regressão Logística treinado com a indexação oficial).

function cliente() {
  const supabase = createAdminClient()
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase
}

// Contagem pelo tema principal de cada PL, para que a soma dê o total do ano.
export async function contagemPorTema(ano: number): Promise<ContagemTema[]> {
  const { data, error } = await cliente().from('pl_temas_contagem').select('*').eq('ano', ano)
  if (error) throw new Error(error.message)
  const porTema = new Map<string, ContagemTema>()
  for (const l of (data ?? []) as { casa: 'camara' | 'senado'; tema: string; origem: string; total: number }[]) {
    const c = porTema.get(l.tema) ?? { tema: l.tema, camara: 0, senado: 0, total: 0, peloModelo: 0 }
    c[l.casa] += l.total
    c.total += l.total
    if (l.origem === 'modelo') c.peloModelo += l.total
    porTema.set(l.tema, c)
  }
  return [...porTema.values()].sort((a, b) => b.total - a.total)
}

export async function listarPorTema(tema: string, ano: number, casa: 'camara' | 'senado' | null, pagina: number, porPagina: number) {
  const inicio = (pagina - 1) * porPagina
  let q = cliente().from('pl_temas').select('*', { count: 'exact' }).contains('temas', [tema]).eq('ano', ano)
  if (casa) q = q.eq('casa', casa)
  const { data, count, error } = await q
    .order('data_apresentacao', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .range(inicio, inicio + porPagina - 1)
  if (error) throw new Error(error.message)
  return { dados: (data ?? []) as PlTema[], total: count ?? 0 }
}

export async function ultimaAvaliacao(): Promise<AvaliacaoClassificacao | null> {
  const { data, error } = await cliente()
    .from('classificacao_avaliacao')
    .select('*')
    .order('executado_em', { ascending: false })
    .limit(1)
  if (error) throw new Error(error.message)
  return (data?.[0] as AvaliacaoClassificacao) ?? null
}
