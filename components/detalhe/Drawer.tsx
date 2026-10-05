'use client'
import { useEffect, useState } from 'react'
import { ProposicaoDetalhe } from '@/types/camara'
import { DetalheSenado } from '@/types/senado'
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
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-slate-800">{value}</p>
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

  if (error) return <p className="text-sm text-slate-400 text-center py-8">Erro: {error}</p>
  if (!data) return <div className="space-y-4 p-1">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}</div>

  const sit = data.statusProposicao?.descricaoSituacao
  const history = data.tramitacoes?.map(t => t.descricaoTramitacao ?? '').join(' ')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <StatusBadge situacao={sit} />
        <UrgencyBadge regime={data.regime} />
        {data.ambito && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">📍 {data.ambito}</span>}
      </div>

      <div className="bg-indigo-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-indigo-600 mb-2">EMENTA</p>
        <p className="text-sm text-slate-800 leading-relaxed">{data.ementa ?? '—'}</p>
        {data.ementaDetalhada && <p className="text-xs text-slate-500 mt-2">{data.ementaDetalhada}</p>}
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
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Autores</h4>
          <div className="flex flex-wrap gap-2">
            {data.autores.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs">
                {a.tipo === 'Órgão' ? '🏛️' : '👤'} {a.nome ?? a.sigla ?? '—'}
                {a.siglaPartido && <span className="text-slate-400">({a.siglaPartido}{a.siglaUf ? `–${a.siglaUf}` : ''})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {!!data.relatores?.length && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Relatores</h4>
          <div className="space-y-2">
            {data.relatores.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                <span className="text-lg">👤</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.nome ?? '—'}</p>
                  <p className="text-xs text-slate-500">{r.siglaOrgao} · {formatDate(r.dataDesignacao)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!data.tramitacoes?.length && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Histórico de Tramitação</h4>
          <TimelineCamara items={data.tramitacoes} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
        {data.urlInteiroTeor && <a href={data.urlInteiroTeor} target="_blank" className="text-xs text-indigo-600 hover:underline">📄 Inteiro Teor</a>}
        <a href={`https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}`} target="_blank" className="text-xs text-slate-500 hover:underline">🔗 Ver na Câmara</a>
      </div>
    </div>
  )
}

function SenadoDetail({ id }: { id: string }) {
  const [data, setData] = useState<DetalheSenado | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/senado/${id}`)
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
  }, [id])

  if (error) return <p className="text-sm text-slate-400 text-center py-8">Erro: {error}</p>
  if (!data) return <div className="space-y-4 p-1">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}</div>
  if (!data.processo) return <p className="text-sm text-slate-400 text-center py-8">Processo não encontrado.</p>

  const p = data.processo
  const sit = data.situacaoAtual ?? undefined
  const history = [p.objetivo === 'Revisora' ? 'casa revisora' : '', ...data.tramitacao.map(t => t.descricao ?? '')].join(' ')
  const autores = (p.autoriaIniciativa ?? []).map(a => a.autor ?? a.ente).filter(Boolean).join(', ')
  const ultima = data.tramitacao[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <StatusBadge situacao={sit} />
        {p.objetivo && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">📍 Casa {p.objetivo.toLowerCase()}</span>}
      </div>

      <div className="bg-violet-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-violet-600 mb-2">EMENTA</p>
        <p className="text-sm text-slate-800 leading-relaxed">{p.conteudo?.ementa ?? '—'}</p>
      </div>

      <JourneyBar situacao={sit} history={history} />

      <div className="grid grid-cols-2 gap-3">
        <MetaItem label="Apresentação" value={formatDate(p.documento?.dataApresentacao)} />
        <MetaItem label="Tipo" value={p.descricaoSigla ?? p.documento?.tipo ?? p.sigla} />
        <MetaItem label="Autoria" value={autores || p.documento?.resumoAutoria} />
        <MetaItem label="Órgão atual" value={ultima?.colegiado?.sigla} />
        <MetaItem label="Deliberação" value={p.deliberacao?.tipoDeliberacao} />
        <MetaItem label="Norma gerada" value={p.normaGerada?.descricao} />
      </div>

      {!!data.relatorias.length && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Relatorias</h4>
          <div className="space-y-2">
            {data.relatorias.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                <span className="text-lg">👤</span>
                <div>
                  <p className="text-sm font-medium">
                    {r.nomeParlamentar ?? '—'}
                    {r.siglaPartidoParlamentar && <span className="text-slate-400 font-normal"> ({r.siglaPartidoParlamentar}{r.ufParlamentar ? `–${r.ufParlamentar}` : ''})</span>}
                  </p>
                  <p className="text-xs text-slate-500">{r.descricaoTipoRelator ?? 'Relator'} · {r.siglaColegiado} · {formatDate(r.dataDesignacao?.replace(' ', 'T'))}</p>
                  {r.descricaoTipoEncerramento && <p className="text-xs text-slate-400">Encerramento: {r.descricaoTipoEncerramento}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!data.tramitacao.length && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Histórico</h4>
          <TimelineSenado items={data.tramitacao} />
        </div>
      )}

      {!!data.votacoes.length && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Votações</h4>
          <div className="space-y-2">
            {data.votacoes.map((v, i) => {
              const ok = v.resultadoVotacao === 'A'
              return (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-600">{formatDate(v.dataSessao)} · {truncate(v.descricaoVotacao ?? '', 90)}</span>
                  <span className={`text-xs font-bold shrink-0 ${ok ? 'text-emerald-600' : 'text-rose-500'}`}>{ok ? 'Aprovada' : (v.resultadoVotacao ?? '—')}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
        {p.documento?.url && <a href={p.documento.url} target="_blank" className="text-xs text-indigo-600 hover:underline">📄 {p.documento.tipo ?? 'Texto inicial'}</a>}
        {p.codigoMateria && <a href={`https://www25.senado.leg.br/web/atividade/materias/-/materia/${p.codigoMateria}`} target="_blank" className="text-xs text-violet-600 hover:underline">🔗 Ver no Senado</a>}
      </div>
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
    : `Processo #${state.id} – Senado`

  return (
    <div className="fixed inset-0 z-40">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 p-6">
          {state.source === 'camara'
            ? <CamaraDetail id={Number(state.id)} />
            : <SenadoDetail id={String(state.id)} />}
        </div>
      </div>
    </div>
  )
}
