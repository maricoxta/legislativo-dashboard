'use client'
import { useEffect, useState } from 'react'
import { ProposicaoDetalhe } from '@/types/camara'
import { MateriaDetalhadaSenado, TramitacaoSenado, RelatorSenado, ComissaoSenado, VotacaoSenado, TextoSenado } from '@/types/senado'
import { StatusBadge, UrgencyBadge } from '@/components/ui/StatusBadge'
import { JourneyBar } from '@/components/detalhe/JourneyBar'
import { TimelineCamara, TimelineSenado } from '@/components/detalhe/Timeline'
import { formatDate, formatDatetime, truncate } from '@/lib/utils'

interface DrawerState {
  id: string | number
  source: 'camara' | 'senado'
}

interface Props {
  state: DrawerState | null
  onClose: () => void
}

function MetaItem({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === '—') return null
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-gray-800">{value}</p>
    </div>
  )
}

function CamaraDetail({ id }: { id: number }) {
  const [data, setData] = useState<ProposicaoDetalhe | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/camara/${id}`)
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
  }, [id])

  if (error) return <p className="text-sm text-gray-400 text-center py-8">Erro: {error}</p>
  if (!data) return <div className="space-y-4 p-1">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>

  const sit = data.statusProposicao?.descricaoSituacao
  const history = data.tramitacoes?.map(t => t.descricaoTramitacao ?? '').join(' ')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <StatusBadge situacao={sit} />
        <UrgencyBadge regime={data.regime} />
        {data.ambito && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">📍 {data.ambito}</span>}
      </div>

      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-600 mb-2">EMENTA</p>
        <p className="text-sm text-gray-800 leading-relaxed">{data.ementa ?? '—'}</p>
        {data.ementaDetalhada && <p className="text-xs text-gray-500 mt-2">{data.ementaDetalhada}</p>}
      </div>

      <JourneyBar situacao={sit} history={history} />

      <div className="grid grid-cols-2 gap-3">
        <MetaItem label="Apresentação" value={formatDate(data.dataApresentacao)} />
        <MetaItem label="Tipo" value={data.descricaoTipo ?? data.siglaTipo} />
        <MetaItem label="Órgão Atual" value={data.statusProposicao?.siglaOrgao} />
        <MetaItem label="Regime" value={data.regime ?? 'Ordinário'} />
        <MetaItem label="Última movimentação" value={data.statusProposicao?.descricaoTramitacao} />
        <MetaItem label="Data movimentação" value={formatDatetime(data.statusProposicao?.dataHora)} />
      </div>

      {!!data.autores?.length && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Autores</h4>
          <div className="flex flex-wrap gap-2">
            {data.autores.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs">
                {a.tipo === 'Órgão' ? '🏛️' : '👤'} {a.nome ?? a.sigla ?? '—'}
                {a.siglaPartido && <span className="text-gray-400">({a.siglaPartido}{a.siglaUf ? `–${a.siglaUf}` : ''})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {!!data.relatores?.length && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Relatores</h4>
          <div className="space-y-2">
            {data.relatores.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                <span className="text-lg">👤</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.nome ?? '—'}</p>
                  <p className="text-xs text-gray-500">{r.siglaOrgao} · {formatDate(r.dataDesignacao)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!data.tramitacoes?.length && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico de Tramitação</h4>
          <TimelineCamara items={data.tramitacoes} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
        {data.urlInteiroTeor && <a href={data.urlInteiroTeor} target="_blank" className="text-xs text-blue-600 hover:underline">📄 Inteiro Teor</a>}
        <a href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}`} target="_blank" className="text-xs text-gray-500 hover:underline">🔗 Ver na Câmara</a>
      </div>
    </div>
  )
}

function SenadoDetail({ codigo }: { codigo: string }) {
  const [data, setData] = useState<{
    materia: MateriaDetalhadaSenado | null
    tramitacao: TramitacaoSenado[]
    comissoes: ComissaoSenado[]
    relatorias: RelatorSenado[]
    votacoes: VotacaoSenado[]
    textos: TextoSenado[]
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/senado/${codigo}`)
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
  }, [codigo])

  if (error) return <p className="text-sm text-gray-400 text-center py-8">Erro: {error}</p>
  if (!data) return <div className="space-y-4 p-1">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
  if (!data.materia) return <p className="text-sm text-gray-400 text-center py-8">Matéria não encontrada.</p>

  const m = data.materia
  const id2 = m.IdentificacaoMateria ?? {}
  const sit = m.SituacaoAtual?.DescricaoSituacao
  const history = data.tramitacao.map(t => t.DescricaoSituacao ?? '').join(' ')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <StatusBadge situacao={sit} />
        <UrgencyBadge regime={m.Regime?.DescricaoRegime} />
      </div>

      <div className="bg-purple-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-purple-600 mb-2">EMENTA</p>
        <p className="text-sm text-gray-800 leading-relaxed">{m.EmentaMateria ?? '—'}</p>
        {m.ExplicacaoEmentaMateria && <p className="text-xs text-gray-500 mt-2">{m.ExplicacaoEmentaMateria}</p>}
      </div>

      <JourneyBar situacao={sit} history={history} />

      <div className="grid grid-cols-2 gap-3">
        <MetaItem label="Apresentação" value={formatDate(m.DataApresentacao)} />
        <MetaItem label="Tipo" value={id2.DescricaoTipoMateria ?? id2.SiglaTipoMateria} />
      </div>

      {!!data.relatorias.length && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Relatorias</h4>
          <div className="space-y-2">
            {data.relatorias.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                <span className="text-lg">👤</span>
                <div>
                  <p className="text-sm font-medium">{r.DescricaoRelator ?? r.NomeRelator ?? '—'}</p>
                  <p className="text-xs text-gray-500">{r.SiglaComissaoRelatoria} · {formatDate(r.DataDesignacaoRelator)}</p>
                  {r.DescricaoVotacaoRelatorio && <p className="text-xs text-gray-400">Parecer: {r.DescricaoVotacaoRelatorio}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!data.tramitacao.length && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico</h4>
          <TimelineSenado items={data.tramitacao} />
        </div>
      )}

      {!!data.votacoes.length && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Votações</h4>
          <div className="space-y-2">
            {data.votacoes.map((v, i) => {
              const ok = (v.DescricaoResultado ?? '').toLowerCase().includes('aprovad')
              return (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600">{formatDate(v.DataSessaoVotacao)}</span>
                  <span className={`text-xs font-bold ${ok ? 'text-green-600' : 'text-red-500'}`}>{v.DescricaoResultado ?? '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!!data.textos.filter(t => t.UrlTexto).length && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {data.textos.filter(t => t.UrlTexto).map((t, i) => (
            <a key={i} href={t.UrlTexto} target="_blank" className="text-xs text-blue-600 hover:underline">📄 {t.DescricaoTipoTexto ?? 'Texto'}</a>
          ))}
          <a href={`https://www25.senado.leg.br/web/atividade/materias/-/materia/${codigo}`} target="_blank" className="text-xs text-purple-600 hover:underline">🔗 Ver no Senado</a>
        </div>
      )}
    </div>
  )
}

export function Drawer({ state, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = state ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [state])

  if (!state) return null

  const title = state.source === 'camara'
    ? `Proposição #${state.id} – Câmara`
    : `Matéria #${state.id} – Senado`

  return (
    <div className="fixed inset-0 z-40">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-6">
          {state.source === 'camara'
            ? <CamaraDetail id={Number(state.id)} />
            : <SenadoDetail codigo={String(state.id)} />}
        </div>
      </div>
    </div>
  )
}
