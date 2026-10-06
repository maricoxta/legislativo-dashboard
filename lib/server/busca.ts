import { buscarEmentaCamara, listarProposicoesCamara } from '@/lib/server/camara'
import { listarProcessosSenado } from '@/lib/server/senado'
import { ProposicaoCamara } from '@/types/camara'
import { ProcessoSenado } from '@/types/senado'

export interface FiltroBusca {
  q?: string
  numero?: string
  tipo?: string
  ano?: string
  codTema?: string
  partido?: string
  uf?: string
  camara?: boolean
  senado?: boolean
}

export interface ResultadoBusca {
  camara: ProposicaoCamara[]
  senado: ProcessoSenado[]
  avisos: string[]
}

// Aceita "1955", "1955/2022", "1955/22" e "PL 1955/2022".
export function interpretarNumero(texto: string): { sigla?: string; numero?: string; ano?: string } {
  const m = texto.trim().match(/^(?:([A-Za-z]{2,4})\s*)?(\d{1,5})(?:\s*[/-]\s*(\d{2}|\d{4}))?$/)
  if (!m) return {}
  let ano = m[3]
  if (ano?.length === 2) ano = String(Number(ano) > 50 ? 1900 + Number(ano) : 2000 + Number(ano))
  return { sigla: m[1]?.toUpperCase(), numero: String(Number(m[2])), ano }
}

const ANOS_NUMERO = 8 // número sem ano: procura nos últimos 8 anos

export async function buscaAvancada(f: FiltroBusca): Promise<ResultadoBusca> {
  const avisos: string[] = []
  const lido = f.numero ? interpretarNumero(f.numero) : {}
  if (f.numero && !lido.numero) avisos.push('O número deve ter o formato 1234 ou 1234/2022.')
  const numero = lido.numero
  const tipo = f.tipo || lido.sigla || ''
  const ano = f.ano || lido.ano || ''
  const q = f.q?.trim() ?? ''
  const anoAtual = new Date().getFullYear()

  // Sem ano, a API da Câmara só olha proposições com tramitação nos últimos
  // 30 dias; por isso sempre consultamos ano a ano.
  const anos = ano ? [Number(ano)] : numero
    ? Array.from({ length: ANOS_NUMERO }, (_, i) => anoAtual - i)
    : [anoAtual, anoAtual - 1]
  if (!ano && !numero) avisos.push(`Sem ano escolhido, a busca considera ${anoAtual - 1} e ${anoAtual}.`)

  const camara = new Map<number, ProposicaoCamara>()
  if (f.camara !== false) {
    const base: Record<string, string> = { itens: '50', ordem: 'DESC', ordenarPor: 'id' }
    if (q) base.keywords = q
    if (tipo) base.siglaTipo = tipo
    if (numero) base.numero = numero
    if (f.codTema) base.codTema = f.codTema
    if (f.partido) base.siglaPartidoAutor = f.partido
    if (f.uf) base.siglaUfAutor = f.uf

    const r = await Promise.allSettled(anos.map(a => listarProposicoesCamara(new URLSearchParams({ ...base, ano: String(a) }))))
    for (const x of r) if (x.status === 'fulfilled') for (const p of x.value.dados ?? []) camara.set(p.id, p)
    if (r.every(x => x.status === 'rejected')) avisos.push('A API da Câmara não respondeu agora.')

    // `keywords` só acha o que a Câmara indexou; a ementa dos PLs está na
    // nossa tabela. Só vale quando os outros filtros não restringem a busca.
    if (q && !numero && !f.codTema && !f.partido && !f.uf && (!tipo || tipo === 'PL')) {
      const naEmenta = await buscarEmentaCamara([q], `${Math.min(...anos)}-01-01`).catch(() => [])
      for (const p of naEmenta) if (anos.includes(p.ano)) camara.set(p.id, p)
    }
  }

  let senado: ProcessoSenado[] = []
  if (f.senado !== false) {
    if (f.codTema || f.partido || f.uf) {
      avisos.push('Tema, partido e estado só filtram a Câmara; o Senado não foi consultado.')
    } else {
      // No Senado cada ano é percorrido em janelas de 30 dias; com número e
      // sem ano, olhamos só os dois últimos anos para não pesar a consulta.
      const anosSenado = ano ? [Number(ano)] : [anoAtual, anoAtual - 1]
      const r = await Promise.allSettled(anosSenado.map(a =>
        listarProcessosSenado({ sigla: tipo || undefined, numero, termo: q || undefined, ano: a, limite: 20 })))
      const vistos = new Map<number, ProcessoSenado>()
      for (const x of r) if (x.status === 'fulfilled') for (const p of x.value) vistos.set(p.id, p)
      senado = [...vistos.values()]
      if (r.every(x => x.status === 'rejected')) avisos.push('A API do Senado não respondeu agora.')
    }
  }

  return {
    camara: [...camara.values()].sort((a, b) => b.id - a.id).slice(0, 60),
    senado: senado.sort((a, b) => (b.dataApresentacao ?? '').localeCompare(a.dataApresentacao ?? '')),
    avisos,
  }
}
