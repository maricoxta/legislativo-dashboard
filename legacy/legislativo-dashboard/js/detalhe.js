import {
  camaraGetProposicao, camaraGetTramitacoes, camaraGetRelatores,
  camaraGetVotacoes, camaraGetAutores,
  senadoGetMateria, senadoGetTramitacao, senadoGetComissoes,
  senadoGetRelatorias, senadoGetVotacoes, senadoGetTextos
} from './api.js';
import { getStatusClass, getUrgencyClass } from './config.js';
import { formatDate, formatDatetime, truncate, openDrawer, closeDrawer, escapeHtml } from './utils.js';

export async function openDetalhe(id, source = 'camara') {
  openDrawer('Carregando...');
  const body = document.getElementById('drawer-body');
  body.innerHTML = skeletonDetalhe();

  try {
    if (source === 'camara') {
      await renderCamaraDetalhe(id, body);
    } else {
      await renderSenadoDetalhe(id, body);
    }
  } catch (err) {
    body.innerHTML = `<div class="p-6 text-center text-sm text-gray-500">Erro ao carregar: ${err.message}</div>`;
  }
}

async function renderCamaraDetalhe(id, body) {
  const [prop, tramitacoes, relatores, votacoes, autores] = await Promise.all([
    camaraGetProposicao(id),
    camaraGetTramitacoes(id),
    camaraGetRelatores(id),
    camaraGetVotacoes(id),
    camaraGetAutores(id),
  ]);

  document.getElementById('drawer-title').textContent =
    `${prop.siglaTipo} ${prop.numero}/${prop.ano} – Câmara`;

  const sit = prop.statusProposicao?.descricaoSituacao || 'Em tramitação';
  const regime = prop.regime || '';
  const orgaoAtual = prop.statusProposicao?.siglaOrgao || '';

  body.innerHTML = `
    <div class="space-y-6">

      <!-- Header badges -->
      <div class="flex flex-wrap gap-2">
        <span class="status-badge ${getStatusClass(sit)}">${sit}</span>
        ${regime ? `<span class="status-badge ${getUrgencyClass(regime)}">⚡ ${regime}</span>` : ''}
        ${prop.ambito ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">📍 ${prop.ambito}</span>` : ''}
        ${prop.apreciacao ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">🗳️ ${prop.apreciacao}</span>` : ''}
      </div>

      <!-- Ementa -->
      <div class="bg-blue-50 rounded-xl p-4">
        <p class="text-xs font-semibold text-blue-600 mb-2">EMENTA</p>
        <p class="text-sm text-gray-800 leading-relaxed">${escapeHtml(prop.ementa || '—')}</p>
        ${prop.ementaDetalhada ? `<p class="text-xs text-gray-500 mt-2 leading-relaxed">${escapeHtml(prop.ementaDetalhada)}</p>` : ''}
        ${prop.keywords ? `<p class="text-xs text-blue-500 mt-2">🏷️ ${escapeHtml(prop.keywords)}</p>` : ''}
      </div>

      <!-- Journey / Situação atual -->
      ${journeyBar(sit, tramitacoes)}

      <!-- Meta grid -->
      <div class="grid grid-cols-2 gap-3">
        ${metaItem('Apresentação', formatDate(prop.dataApresentacao))}
        ${metaItem('Tipo', prop.descricaoTipo || prop.siglaTipo)}
        ${metaItem('Órgão Atual', orgaoAtual || '—')}
        ${metaItem('Regime', regime || 'Ordinário')}
        ${prop.statusProposicao?.descricaoTramitacao ? metaItem('Última movimentação', prop.statusProposicao.descricaoTramitacao) : ''}
        ${prop.statusProposicao?.dataHora ? metaItem('Data da movimentação', formatDatetime(prop.statusProposicao.dataHora)) : ''}
      </div>

      <!-- Autores -->
      ${autores.length ? `
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Autores</h4>
        <div class="flex flex-wrap gap-2">
          ${autores.map(a => `
            <span class="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs">
              ${a.tipo === 'Órgão' ? '🏛️' : '👤'} ${escapeHtml(a.nome || a.sigla || '—')}
              ${a.siglaPartido ? `<span class="text-gray-400">(${a.siglaPartido}–${a.siglaUf || ''})</span>` : ''}
            </span>`).join('')}
        </div>
      </div>` : ''}

      <!-- Relatores -->
      ${relatores.length ? `
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Relatores</h4>
        <div class="space-y-2">
          ${relatores.map(r => `
            <div class="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <span class="text-lg">👤</span>
              <div>
                <p class="text-sm font-medium text-gray-800">${escapeHtml(r.nome || '—')}</p>
                <p class="text-xs text-gray-500">${r.siglaOrgao || '—'} · ${r.dataDesignacao ? formatDate(r.dataDesignacao) : ''}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Tramitações (timeline) -->
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico de Tramitação</h4>
        ${tramitacoes.length
          ? `<div class="timeline">${tramitacoes.map((t, i) => tramitacaoItem(t, i === 0)).join('')}</div>`
          : '<p class="text-xs text-gray-400">Sem histórico disponível.</p>'
        }
      </div>

      <!-- Votações -->
      ${votacoes.length ? `
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Votações</h4>
        <div class="space-y-2">
          ${votacoes.map(v => votacaoItem(v)).join('')}
        </div>
      </div>` : ''}

      <!-- Links -->
      <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        ${prop.urlInteiroTeor ? `<a href="${prop.urlInteiroTeor}" target="_blank" class="text-xs text-blue-600 hover:underline flex items-center gap-1">📄 Inteiro Teor</a>` : ''}
        ${prop.urnFinal ? `<a href="https://www.planalto.gov.br/ccivil_03/${prop.urnFinal}" target="_blank" class="text-xs text-green-600 hover:underline flex items-center gap-1">⚖️ Texto da Lei</a>` : ''}
        <a href="https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}" target="_blank" class="text-xs text-gray-500 hover:underline">🔗 Ver na Câmara</a>
      </div>
    </div>
  `;
}

async function renderSenadoDetalhe(codigo, body) {
  const [materia, tramitacao, comissoes, relatorias, votacoes, textos] = await Promise.all([
    senadoGetMateria(codigo),
    senadoGetTramitacao(codigo),
    senadoGetComissoes(codigo),
    senadoGetRelatorias(codigo),
    senadoGetVotacoes(codigo),
    senadoGetTextos(codigo),
  ]);

  if (!materia) {
    body.innerHTML = '<div class="p-6 text-sm text-gray-500 text-center">Matéria não encontrada.</div>';
    return;
  }

  const id = materia.IdentificacaoMateria || {};
  const sit = materia.SituacaoAtual?.DescricaoSituacao || 'Em tramitação';

  document.getElementById('drawer-title').textContent =
    `${id.SiglaTipoMateria || 'PL'} ${id.NumeroMateria || '—'}/${id.AnoMateria || '—'} – Senado`;

  body.innerHTML = `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex flex-wrap gap-2">
        <span class="status-badge ${getStatusClass(sit)}">${sit}</span>
        ${materia.Regime?.DescricaoRegime ? `<span class="status-badge ${getUrgencyClass(materia.Regime.DescricaoRegime)}">⚡ ${escapeHtml(materia.Regime.DescricaoRegime)}</span>` : ''}
      </div>

      <!-- Ementa -->
      <div class="bg-purple-50 rounded-xl p-4">
        <p class="text-xs font-semibold text-purple-600 mb-2">EMENTA</p>
        <p class="text-sm text-gray-800 leading-relaxed">${escapeHtml(materia.EmentaMateria || '—')}</p>
        ${materia.ExplicacaoEmentaMateria ? `<p class="text-xs text-gray-500 mt-2">${escapeHtml(materia.ExplicacaoEmentaMateria)}</p>` : ''}
      </div>

      <!-- Journey -->
      ${journeyBarSenado(sit, tramitacao)}

      <!-- Meta -->
      <div class="grid grid-cols-2 gap-3">
        ${metaItem('Apresentação', formatDate(materia.DataApresentacao))}
        ${metaItem('Tipo', id.DescricaoTipoMateria || id.SiglaTipoMateria || '—')}
        ${materia.Autoria?.length ? metaItem('Autoria', Array.isArray(materia.Autoria) ? materia.Autoria.map(a=>a.NomeAutor||a).join(', ') : materia.Autoria) : ''}
        ${materia.SituacaoAtual?.Comissao?.NomeComissao ? metaItem('Comissão Atual', materia.SituacaoAtual.Comissao.NomeComissao) : ''}
      </div>

      <!-- Relatorias -->
      ${relatorias.length ? `
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Relatorias</h4>
        <div class="space-y-2">
          ${relatorias.map(r => `
            <div class="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <span class="text-lg">👤</span>
              <div>
                <p class="text-sm font-medium text-gray-800">${escapeHtml(r.DescricaoRelator || r.NomeRelator || '—')}</p>
                <p class="text-xs text-gray-500">${r.SiglaComissaoRelatoria || '—'} · ${r.DataDesignacaoRelator ? formatDate(r.DataDesignacaoRelator) : ''}</p>
                ${r.DescricaoVotacaoRelatorio ? `<p class="text-xs text-gray-400 mt-0.5">Parecer: ${escapeHtml(r.DescricaoVotacaoRelatorio)}</p>` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Comissões -->
      ${comissoes.length ? `
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Comissões</h4>
        <div class="space-y-2">
          ${comissoes.map(c => `
            <div class="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p class="text-xs font-semibold text-gray-700">${escapeHtml(c.IdentificacaoComissao?.SiglaComissao || '—')} – ${escapeHtml(c.IdentificacaoComissao?.NomeComissao || '—')}</p>
              ${c.DescricaoParecerComissao ? `<p class="text-xs text-gray-500 mt-1">Parecer: ${escapeHtml(c.DescricaoParecerComissao)}</p>` : ''}
              ${c.DataPublicacaoParecerComissao ? `<p class="text-xs text-gray-400">${formatDate(c.DataPublicacaoParecerComissao)}</p>` : ''}
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Tramitação Senado -->
      ${tramitacao.length ? `
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico de Tramitação</h4>
        <div class="timeline">
          ${tramitacao.map((t, i) => senadoTramitacaoItem(t, i === 0)).join('')}
        </div>
      </div>` : ''}

      <!-- Votações -->
      ${votacoes.length ? `
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Votações</h4>
        <div class="space-y-2">
          ${votacoes.map(v => `
            <div class="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <p class="text-xs font-medium text-gray-700">${formatDate(v.DataSessaoVotacao)}</p>
                <span class="text-xs font-bold ${v.DescricaoResultado?.toLowerCase().includes('aprovad') ? 'text-green-600' : 'text-red-500'}">${escapeHtml(v.DescricaoResultado || '—')}</span>
              </div>
              ${v.SiglaCasaIdentificacaoVotacao ? `<p class="text-xs text-gray-400">${v.SiglaCasaIdentificacaoVotacao}</p>` : ''}
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Textos -->
      ${textos.length ? `
      <div>
        <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Textos Disponíveis</h4>
        <div class="flex flex-wrap gap-2">
          ${textos.map(t => t.UrlTexto ? `<a href="${t.UrlTexto}" target="_blank" class="text-xs text-blue-600 hover:underline flex items-center gap-1">📄 ${escapeHtml(t.DescricaoTipoTexto || 'Texto')}</a>` : '').join('')}
        </div>
      </div>` : ''}

      <!-- Link externo -->
      <div class="pt-2 border-t border-gray-100">
        <a href="https://www25.senado.leg.br/web/atividade/materias/-/materia/${codigo}" target="_blank" class="text-xs text-purple-600 hover:underline">🔗 Ver no Senado Federal</a>
      </div>
    </div>
  `;
}

function journeyBar(sit, tramitacoes) {
  const steps = [
    { key: 'apresentad', label: 'Apresentação', icon: '📋' },
    { key: 'comiss', label: 'Comissões', icon: '🏛️' },
    { key: 'plenário', label: 'Plenário', icon: '🗳️' },
    { key: 'senado|câmara revisora', label: 'Casa Revisora', icon: '⇄' },
    { key: 'sancionad|vetad', label: 'Sanção/Veto', icon: '✍️' },
    { key: 'lei|norma', label: 'Publicação', icon: '📜' },
  ];
  const sitLow = (sit + ' ' + tramitacoes.map(t=>t.descricaoTramitacao||'').join(' ')).toLowerCase();
  let activeIdx = 0;
  steps.forEach((s, i) => {
    if (s.key.split('|').some(k => sitLow.includes(k))) activeIdx = i;
  });

  return `
    <div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Jornada da Proposição</h4>
      <div class="flex overflow-x-auto gap-0 pb-1">
        ${steps.map((s, i) => {
          const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : '';
          return `<div class="journey-step ${state} min-w-[80px]">
            <div class="journey-icon">${state === 'done' ? '✓' : s.icon}</div>
            <p class="text-xs font-medium text-gray-600 leading-tight">${s.label}</p>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function journeyBarSenado(sit, tramitacao) {
  const sitLow = sit.toLowerCase();
  const steps = [
    { key: 'apresentad', label: 'Apresentação', icon: '📋' },
    { key: 'comiss', label: 'Comissões', icon: '🏛️' },
    { key: 'plenário', label: 'Plenário', icon: '🗳️' },
    { key: 'câmara|casa revisora', label: 'Casa Revisora', icon: '⇄' },
    { key: 'sancionad|vetad|promulgad', label: 'Sanção', icon: '✍️' },
    { key: 'lei|publicad', label: 'Publicação', icon: '📜' },
  ];
  let activeIdx = 0;
  const tramLow = tramitacao.map(t=>(t.DescricaoSituacao||'').toLowerCase()).join(' ');
  steps.forEach((s, i) => {
    if (s.key.split('|').some(k => sitLow.includes(k) || tramLow.includes(k))) activeIdx = i;
  });

  return `
    <div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Jornada da Proposição</h4>
      <div class="flex overflow-x-auto gap-0 pb-1">
        ${steps.map((s, i) => {
          const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : '';
          return `<div class="journey-step ${state} min-w-[80px]">
            <div class="journey-icon">${state === 'done' ? '✓' : s.icon}</div>
            <p class="text-xs font-medium text-gray-600 leading-tight">${s.label}</p>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function tramitacaoItem(t, isCurrent) {
  const dotClass = isCurrent ? 'current' : (t.descricaoSituacao?.toLowerCase().includes('aprovad') ? 'done' : '');
  return `
    <div class="timeline-item">
      <div class="timeline-dot ${dotClass}"></div>
      <div class="flex flex-col gap-0.5">
        <div class="flex items-center gap-2 flex-wrap">
          ${t.siglaOrgao ? `<span class="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">${escapeHtml(t.siglaOrgao)}</span>` : ''}
          <span class="text-xs font-medium text-gray-700">${escapeHtml(t.descricaoTramitacao || '—')}</span>
          <span class="text-xs text-gray-400 ml-auto">${formatDate(t.dataHora)}</span>
        </div>
        ${t.descricaoSituacao ? `<p class="text-xs text-gray-500">${escapeHtml(t.descricaoSituacao)}</p>` : ''}
        ${t.despacho ? `<p class="text-xs text-gray-400 italic mt-0.5">${truncate(escapeHtml(t.despacho), 150)}</p>` : ''}
      </div>
    </div>`;
}

function senadoTramitacaoItem(t, isCurrent) {
  const sit = t.DescricaoSituacao || '—';
  const dotClass = isCurrent ? 'current' : (sit.toLowerCase().includes('aprovad') ? 'done' : '');
  return `
    <div class="timeline-item">
      <div class="timeline-dot ${dotClass}"></div>
      <div class="flex flex-col gap-0.5">
        <div class="flex items-center gap-2 flex-wrap">
          ${t.SiglaLocalSituacao ? `<span class="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">${escapeHtml(t.SiglaLocalSituacao)}</span>` : ''}
          <span class="text-xs font-medium text-gray-700">${escapeHtml(sit)}</span>
          <span class="text-xs text-gray-400 ml-auto">${formatDate(t.DataSituacao)}</span>
        </div>
        ${t.NomeLocalSituacao ? `<p class="text-xs text-gray-500">${escapeHtml(t.NomeLocalSituacao)}</p>` : ''}
      </div>
    </div>`;
}

function votacaoItem(v) {
  const sim = v.aprovacaoInicial?.votosSim || v.sim || 0;
  const nao = v.aprovacaoInicial?.votosNao || v.nao || 0;
  const resultado = v.aprovacao || v.descricao || '—';
  const approved = String(resultado).toLowerCase().includes('aprovad');
  return `
    <div class="bg-gray-50 border border-gray-100 rounded-lg p-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-medium text-gray-700">${formatDate(v.data)}</span>
        <span class="text-xs font-bold ${approved ? 'text-green-600' : 'text-red-500'}">${approved ? '✓ Aprovado' : '✗ Rejeitado'}</span>
      </div>
      ${v.descricao ? `<p class="text-xs text-gray-500 mb-1">${truncate(escapeHtml(v.descricao), 100)}</p>` : ''}
      ${sim || nao ? `
        <div class="flex gap-3 text-xs">
          <span class="text-green-600">✓ Sim: ${sim}</span>
          <span class="text-red-500">✗ Não: ${nao}</span>
          ${v.aprovacaoInicial?.votosAbstencao ? `<span class="text-gray-400">Abstenção: ${v.aprovacaoInicial.votosAbstencao}</span>` : ''}
        </div>` : ''}
    </div>`;
}

function metaItem(label, value) {
  if (!value || value === '—') return '';
  return `
    <div class="bg-gray-50 rounded-lg p-3">
      <p class="text-xs text-gray-400 mb-0.5">${label}</p>
      <p class="text-xs font-semibold text-gray-800">${escapeHtml(String(value))}</p>
    </div>`;
}

function skeletonDetalhe() {
  return `<div class="space-y-4">
    <div class="skeleton h-8 w-3/4 rounded-lg"></div>
    <div class="skeleton h-24 rounded-xl"></div>
    <div class="skeleton h-16 rounded-xl"></div>
    <div class="grid grid-cols-2 gap-3">${Array(4).fill('<div class="skeleton h-14 rounded-lg"></div>').join('')}</div>
    <div class="skeleton h-40 rounded-xl"></div>
  </div>`;
}
