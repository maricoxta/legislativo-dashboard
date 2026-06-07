/* Legislativo Dashboard — single-file bundle (no ES modules required) */
(function () {
'use strict';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';
const SENADO_API = 'https://legis.senado.leg.br/dadosabertos';

const CAMARA_TEMAS = [
  { cod: 46, nome: 'Administração Pública', emoji: '🏛️' },
  { cod: 40, nome: 'Educação e Cultura', emoji: '📚' },
  { cod: 47, nome: 'Saúde', emoji: '🏥' },
  { cod: 48, nome: 'Segurança Pública', emoji: '🛡️' },
  { cod: 41, nome: 'Economia e Finanças', emoji: '💰' },
  { cod: 49, nome: 'Trabalho e Emprego', emoji: '👷' },
  { cod: 50, nome: 'Meio Ambiente', emoji: '🌿' },
  { cod: 45, nome: 'Ciência e Tecnologia', emoji: '🔬' },
  { cod: 42, nome: 'Direitos Humanos', emoji: '⚖️' },
  { cod: 43, nome: 'Previdência Social', emoji: '👴' },
  { cod: 44, nome: 'Tributação e Orçamento', emoji: '📊' },
  { cod: 51, nome: 'Comunicações', emoji: '📡' },
  { cod: 52, nome: 'Transportes', emoji: '🚂' },
  { cod: 53, nome: 'Agricultura', emoji: '🌾' },
];

const TIPO_SIGLAS = {
  PL: 'Projeto de Lei', PEC: 'Emenda Constitucional', MPV: 'Medida Provisória',
  PLN: 'Projeto de Lei do Congresso', PDL: 'Decreto Legislativo',
  PLV: 'Projeto de Lei de Conversão', MSC: 'Mensagem', REQ: 'Requerimento',
};

const CNM_TEMAS = [
  { id: 'saneamento', nome: 'Saneamento', emoji: '💧', cor: 'blue',
    keywords: ['saneamento', 'água potável', 'esgoto', 'resíduos sólidos', 'drenagem'],
    descricao: 'Saneamento básico, água, esgoto e resíduos urbanos' },
  { id: 'meio-ambiente', nome: 'Meio Ambiente', emoji: '🌿', cor: 'green',
    keywords: ['mudança climática', 'clima', 'carbono', 'conservação', 'biodiversidade'],
    descricao: 'Meio ambiente, clima e sustentabilidade' },
  { id: 'defesa-civil', nome: 'Defesa Civil', emoji: '⛑️', cor: 'orange',
    keywords: ['desastre', 'enchente', 'seca', 'risco', 'emergência'],
    descricao: 'Proteção e defesa civil, desastres naturais' },
];

const PARTIDOS_BR = ['AVANTE','DC','MDB','NOVO','PCdoB','PDT','PL','PMN','PP','PRD','PROS','PSB','PSD','PSDB','PSOL','PT','PV','PODE','REPUBLICANOS','SOLIDARIEDADE','UNIÃO'];

const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

function getStatusClass(sit) {
  if (!sit) return 'status-tramitando';
  const s = sit.toLowerCase();
  if (s.includes('lei') || s.includes('norma jurídica')) return 'status-lei';
  if (s.includes('aprovad')) return 'status-aprovado';
  if (s.includes('arquivad') || s.includes('retirad')) return 'status-arquivado';
  if (s.includes('vetad')) return 'status-vetado';
  if (s.includes('prejudicad')) return 'status-prejudicado';
  return 'status-tramitando';
}

function getUrgencyClass(regime) {
  if (!regime) return 'urgency-normal';
  const r = regime.toLowerCase();
  if (r.includes('urgência')) return 'urgency-urgente';
  if (r.includes('prioridade')) return 'urgency-prioridade';
  return 'urgency-normal';
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
function formatDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }); }
  catch { return str; }
}
function formatDatetime(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); }
  catch { return str; }
}
function truncate(text, len = 160) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len).trimEnd() + '…' : text;
}
function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}
function showLoading(msg = 'Carregando...') {
  const el = document.getElementById('loading');
  const m = document.getElementById('loading-msg');
  if (el) { el.classList.remove('hidden'); if (m) m.textContent = msg; }
}
function hideLoading() { document.getElementById('loading')?.classList.add('hidden'); }
function setApiStatus(ok) {
  const dot = document.getElementById('api-dot');
  const lbl = document.getElementById('api-label');
  if (!dot || !lbl) return;
  dot.className = `w-2 h-2 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`;
  lbl.textContent = ok ? 'API online' : 'Erro na API';
}
function openDrawer(title) {
  document.getElementById('drawer')?.classList.remove('hidden');
  const t = document.getElementById('drawer-title');
  if (t) t.textContent = title;
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  document.getElementById('drawer')?.classList.add('hidden');
  document.body.style.overflow = '';
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════
const cache = new Map();
async function fetchJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

async function camaraListProposicoes(params = {}) {
  const p = { itens: 20, ordem: 'DESC', ordenarPor: 'id', ...params };
  return fetchJSON(`${CAMARA_API}/proposicoes?${new URLSearchParams(p)}`);
}
async function camaraGetProposicao(id) {
  const d = await fetchJSON(`${CAMARA_API}/proposicoes/${id}`);
  return d.dados;
}
async function camaraGetTramitacoes(id) {
  try { const d = await fetchJSON(`${CAMARA_API}/proposicoes/${id}/tramitacoes?ordem=DESC`); return d.dados || []; }
  catch { return []; }
}
async function camaraGetRelatores(id) {
  try { const d = await fetchJSON(`${CAMARA_API}/proposicoes/${id}/relatores`); return d.dados || []; }
  catch { return []; }
}
async function camaraGetVotacoes(id) {
  try { const d = await fetchJSON(`${CAMARA_API}/proposicoes/${id}/votacoes`); return d.dados || []; }
  catch { return []; }
}
async function camaraGetAutores(id) {
  try { const d = await fetchJSON(`${CAMARA_API}/proposicoes/${id}/autores`); return d.dados || []; }
  catch { return []; }
}

async function senadoListMaterias(params = {}) {
  const { ano = new Date().getFullYear(), qtdItens = 20, codigoTipoMateria } = params;
  const p = { ano, qtdItens };
  if (codigoTipoMateria) p.codigoTipoMateria = codigoTipoMateria;
  try {
    const d = await fetchJSON(`${SENADO_API}/materia/pesquisa/lista?${new URLSearchParams(p)}`);
    const m = d?.PesquisaBasicaMateria?.Materias?.Materia || [];
    return Array.isArray(m) ? m : (m ? [m] : []);
  } catch { return []; }
}
async function senadoGetMateria(codigo) {
  try { const d = await fetchJSON(`${SENADO_API}/materia/${codigo}`); return d?.DetalheMateria?.Materia || null; }
  catch { return null; }
}
async function senadoGetTramitacao(codigo) {
  try {
    const d = await fetchJSON(`${SENADO_API}/materia/${codigo}/tramitacao`);
    const t = d?.MovimentacaoMateria?.Materia?.HistoricoSituacoes?.HistoricoSituacao || [];
    return Array.isArray(t) ? t : (t ? [t] : []);
  } catch { return []; }
}
async function senadoGetComissoes(codigo) {
  try {
    const d = await fetchJSON(`${SENADO_API}/materia/${codigo}/comissoes`);
    const c = d?.MateriaComissoes?.Comissoes?.Comissao || [];
    return Array.isArray(c) ? c : (c ? [c] : []);
  } catch { return []; }
}
async function senadoGetRelatorias(codigo) {
  try {
    const d = await fetchJSON(`${SENADO_API}/materia/${codigo}/relatorias`);
    const r = d?.RelatoriaMateria?.Materia?.Relatorias?.Relatoria || [];
    return Array.isArray(r) ? r : (r ? [r] : []);
  } catch { return []; }
}
async function senadoGetVotacoes(codigo) {
  try {
    const d = await fetchJSON(`${SENADO_API}/materia/${codigo}/votacoes`);
    const v = d?.VotacaoMateria?.Votacoes?.Votacao || [];
    return Array.isArray(v) ? v : (v ? [v] : []);
  } catch { return []; }
}
async function senadoGetTextos(codigo) {
  try {
    const d = await fetchJSON(`${SENADO_API}/materia/${codigo}/textos`);
    const t = d?.TextoMateria?.Materia?.Textos?.Texto || [];
    return Array.isArray(t) ? t : (t ? [t] : []);
  } catch { return []; }
}

async function camaraGetEventos(params = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const p = { itens: 50, dataInicio: today, dataFim: twoWeeks, ordem: 'ASC', ordenarPor: 'dataHoraInicio', ...params };
  try {
    const d = await fetchJSON(`${CAMARA_API}/eventos?${new URLSearchParams(p)}`);
    return d.dados || [];
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════════════════
const PALETTE = ['#3b82f6','#8b5cf6','#22c55e','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1','#14b8a6','#a855f7','#eab308','#10b981','#64748b'];
let _areaChart, _statusChart, _trendChart;

function initAreaChart(id, labels, values) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  _areaChart?.destroy();
  _areaChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: PALETTE.slice(0, labels.length), borderWidth: 0, hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14, font: { size: 11 } } },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}` } } } }
  });
}
function initStatusChart(id, labels, values) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  _statusChart?.destroy();
  const colors = labels.map(l => {
    const lo = l.toLowerCase();
    if (lo.includes('tramit')) return '#3b82f6';
    if (lo.includes('aprovad') || lo.includes('lei')) return '#22c55e';
    if (lo.includes('arquivad') || lo.includes('retirad')) return '#9ca3af';
    if (lo.includes('vetad')) return '#f59e0b';
    if (lo.includes('prejudicad')) return '#ef4444';
    return '#6366f1';
  });
  _statusChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 6, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } } }
  });
}
function initTrendChart(id, labels, datasets) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  _trendChart?.destroy();
  _trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: datasets.map((ds, i) => ({ ...ds, borderColor: PALETTE[i], backgroundColor: PALETTE[i] + '22', borderWidth: 2, pointRadius: 4, fill: true, tension: 0.4 })) },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: { x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } }, y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } } },
      interaction: { mode: 'index', intersect: false } }
  });
}

// ═══════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════
const routes = [];
function addRoute(pattern, handler) {
  routes.push({ regex: new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$'), handler });
}
function navigate(path) { window.location.hash = path; }
function dispatch() {
  const hash = window.location.hash.slice(1) || '/';
  document.querySelectorAll('.nav-link').forEach(el => {
    const href = (el.getAttribute('href') || '').slice(1);
    el.classList.toggle('active', href === hash);
  });
  for (const r of routes) {
    const m = hash.match(r.regex);
    if (m) { r.handler(m); return; }
  }
}
window.addEventListener('hashchange', dispatch);

// ═══════════════════════════════════════════════════════════════
// DETALHE (defined early, called from dashboard/proposicoes)
// ═══════════════════════════════════════════════════════════════
async function openDetalhe(id, source) {
  openDrawer('Carregando...');
  const body = document.getElementById('drawer-body');
  body.innerHTML = skeletonDetalhe();
  try {
    if (source === 'senado') await renderSenadoDetalhe(id, body);
    else await renderCamaraDetalhe(id, body);
  } catch (err) {
    body.innerHTML = `<div class="p-6 text-center text-sm text-gray-500">Erro ao carregar: ${escapeHtml(err.message)}</div>`;
  }
}

async function renderCamaraDetalhe(id, body) {
  const [prop, tramitacoes, relatores, votacoes, autores] = await Promise.all([
    camaraGetProposicao(id), camaraGetTramitacoes(id), camaraGetRelatores(id), camaraGetVotacoes(id), camaraGetAutores(id)
  ]);
  document.getElementById('drawer-title').textContent = `${prop.siglaTipo} ${prop.numero}/${prop.ano} – Câmara`;
  const sit = prop.statusProposicao?.descricaoSituacao || 'Em tramitação';
  const regime = prop.regime || '';
  const orgaoAtual = prop.statusProposicao?.siglaOrgao || '';

  body.innerHTML = `<div class="space-y-6">
    <div class="flex flex-wrap gap-2">
      <span class="status-badge ${getStatusClass(sit)}">${escapeHtml(sit)}</span>
      ${regime ? `<span class="status-badge ${getUrgencyClass(regime)}">⚡ ${escapeHtml(regime)}</span>` : ''}
      ${prop.ambito ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">📍 ${escapeHtml(prop.ambito)}</span>` : ''}
      ${prop.apreciacao ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">🗳️ ${escapeHtml(prop.apreciacao)}</span>` : ''}
    </div>

    <div class="bg-blue-50 rounded-xl p-4">
      <p class="text-xs font-semibold text-blue-600 mb-2">EMENTA</p>
      <p class="text-sm text-gray-800 leading-relaxed">${escapeHtml(prop.ementa || '—')}</p>
      ${prop.ementaDetalhada ? `<p class="text-xs text-gray-500 mt-2 leading-relaxed">${escapeHtml(prop.ementaDetalhada)}</p>` : ''}
      ${prop.keywords ? `<p class="text-xs text-blue-500 mt-2">🏷️ ${escapeHtml(prop.keywords)}</p>` : ''}
    </div>

    ${journeyBar(sit, tramitacoes)}

    <div class="grid grid-cols-2 gap-3">
      ${metaItem('Apresentação', formatDate(prop.dataApresentacao))}
      ${metaItem('Tipo', prop.descricaoTipo || prop.siglaTipo)}
      ${metaItem('Órgão Atual', orgaoAtual)}
      ${metaItem('Regime', regime || 'Ordinário')}
      ${prop.statusProposicao?.descricaoTramitacao ? metaItem('Última movimentação', prop.statusProposicao.descricaoTramitacao) : ''}
      ${prop.statusProposicao?.dataHora ? metaItem('Data movimentação', formatDatetime(prop.statusProposicao.dataHora)) : ''}
    </div>

    ${autores.length ? `<div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Autores</h4>
      <div class="flex flex-wrap gap-2">${autores.map(a => `<span class="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs">${a.tipo==='Órgão'?'🏛️':'👤'} ${escapeHtml(a.nome||a.sigla||'—')}${a.siglaPartido?` <span class="text-gray-400">(${a.siglaPartido}${a.siglaUf?'–'+a.siglaUf:''})</span>`:''}</span>`).join('')}</div>
    </div>` : ''}

    ${relatores.length ? `<div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Relatores</h4>
      <div class="space-y-2">${relatores.map(r => `<div class="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3"><span class="text-lg">👤</span><div><p class="text-sm font-medium text-gray-800">${escapeHtml(r.nome||'—')}</p><p class="text-xs text-gray-500">${escapeHtml(r.siglaOrgao||'—')} · ${r.dataDesignacao?formatDate(r.dataDesignacao):''}</p></div></div>`).join('')}</div>
    </div>` : ''}

    <div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico de Tramitação</h4>
      ${tramitacoes.length
        ? `<div class="timeline">${tramitacoes.map((t,i) => tramitacaoItem(t, i===0)).join('')}</div>`
        : '<p class="text-xs text-gray-400">Sem histórico disponível.</p>'}
    </div>

    ${votacoes.length ? `<div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Votações</h4>
      <div class="space-y-2">${votacoes.map(v => votacaoItem(v)).join('')}</div>
    </div>` : ''}

    <div class="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
      ${prop.urlInteiroTeor ? `<a href="${prop.urlInteiroTeor}" target="_blank" class="text-xs text-blue-600 hover:underline">📄 Inteiro Teor</a>` : ''}
      <a href="https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${id}" target="_blank" class="text-xs text-gray-500 hover:underline">🔗 Ver na Câmara</a>
    </div>
  </div>`;
}

async function renderSenadoDetalhe(codigo, body) {
  const [materia, tramitacao, comissoes, relatorias, votacoes, textos] = await Promise.all([
    senadoGetMateria(codigo), senadoGetTramitacao(codigo), senadoGetComissoes(codigo),
    senadoGetRelatorias(codigo), senadoGetVotacoes(codigo), senadoGetTextos(codigo)
  ]);
  if (!materia) { body.innerHTML = '<div class="p-6 text-sm text-gray-500 text-center">Matéria não encontrada.</div>'; return; }

  const id2 = materia.IdentificacaoMateria || {};
  const sit = materia.SituacaoAtual?.DescricaoSituacao || 'Em tramitação';
  document.getElementById('drawer-title').textContent = `${id2.SiglaTipoMateria||'PL'} ${id2.NumeroMateria||'—'}/${id2.AnoMateria||'—'} – Senado`;

  body.innerHTML = `<div class="space-y-6">
    <div class="flex flex-wrap gap-2">
      <span class="status-badge ${getStatusClass(sit)}">${escapeHtml(sit)}</span>
      ${materia.Regime?.DescricaoRegime ? `<span class="status-badge ${getUrgencyClass(materia.Regime.DescricaoRegime)}">⚡ ${escapeHtml(materia.Regime.DescricaoRegime)}</span>` : ''}
    </div>

    <div class="bg-purple-50 rounded-xl p-4">
      <p class="text-xs font-semibold text-purple-600 mb-2">EMENTA</p>
      <p class="text-sm text-gray-800 leading-relaxed">${escapeHtml(materia.EmentaMateria||'—')}</p>
      ${materia.ExplicacaoEmentaMateria ? `<p class="text-xs text-gray-500 mt-2">${escapeHtml(materia.ExplicacaoEmentaMateria)}</p>` : ''}
    </div>

    ${journeyBarSenado(sit, tramitacao)}

    <div class="grid grid-cols-2 gap-3">
      ${metaItem('Apresentação', formatDate(materia.DataApresentacao))}
      ${metaItem('Tipo', id2.DescricaoTipoMateria||id2.SiglaTipoMateria)}
    </div>

    ${relatorias.length ? `<div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Relatorias</h4>
      <div class="space-y-2">${relatorias.map(r => `<div class="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3"><span class="text-lg">👤</span><div><p class="text-sm font-medium text-gray-800">${escapeHtml(r.DescricaoRelator||r.NomeRelator||'—')}</p><p class="text-xs text-gray-500">${escapeHtml(r.SiglaComissaoRelatoria||'—')} · ${r.DataDesignacaoRelator?formatDate(r.DataDesignacaoRelator):''}</p>${r.DescricaoVotacaoRelatorio?`<p class="text-xs text-gray-400 mt-0.5">Parecer: ${escapeHtml(r.DescricaoVotacaoRelatorio)}</p>`:''}</div></div>`).join('')}</div>
    </div>` : ''}

    ${comissoes.length ? `<div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Comissões</h4>
      <div class="space-y-2">${comissoes.map(c => `<div class="bg-gray-50 border border-gray-100 rounded-lg p-3"><p class="text-xs font-semibold text-gray-700">${escapeHtml(c.IdentificacaoComissao?.SiglaComissao||'—')} – ${escapeHtml(c.IdentificacaoComissao?.NomeComissao||'—')}</p>${c.DescricaoParecerComissao?`<p class="text-xs text-gray-500 mt-1">Parecer: ${escapeHtml(c.DescricaoParecerComissao)}</p>`:''}</div>`).join('')}</div>
    </div>` : ''}

    ${tramitacao.length ? `<div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico de Tramitação</h4>
      <div class="timeline">${tramitacao.map((t,i) => senadoTramitacaoItem(t, i===0)).join('')}</div>
    </div>` : ''}

    ${votacoes.length ? `<div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Votações</h4>
      <div class="space-y-2">${votacoes.map(v => `<div class="bg-gray-50 border border-gray-100 rounded-lg p-3"><div class="flex items-center justify-between"><span class="text-xs font-medium text-gray-700">${formatDate(v.DataSessaoVotacao)}</span><span class="text-xs font-bold ${(v.DescricaoResultado||'').toLowerCase().includes('aprovad')?'text-green-600':'text-red-500'}">${escapeHtml(v.DescricaoResultado||'—')}</span></div></div>`).join('')}</div>
    </div>` : ''}

    ${textos.length ? `<div>
      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Textos Disponíveis</h4>
      <div class="flex flex-wrap gap-2">${textos.filter(t=>t.UrlTexto).map(t=>`<a href="${t.UrlTexto}" target="_blank" class="text-xs text-blue-600 hover:underline">📄 ${escapeHtml(t.DescricaoTipoTexto||'Texto')}</a>`).join('')}</div>
    </div>` : ''}

    <div class="pt-2 border-t border-gray-100">
      <a href="https://www25.senado.leg.br/web/atividade/materias/-/materia/${codigo}" target="_blank" class="text-xs text-purple-600 hover:underline">🔗 Ver no Senado Federal</a>
    </div>
  </div>`;
}

function journeyBar(sit, tramitacoes) {
  const steps = [
    {key:'apresentad|protocolo',label:'Apresentação',icon:'📋'},
    {key:'comiss',label:'Comissões',icon:'🏛️'},
    {key:'plenário|plenario',label:'Plenário',icon:'🗳️'},
    {key:'senado|câmara revisora|casa revisora',label:'Casa Revisora',icon:'⇄'},
    {key:'sancionad|vetad',label:'Sanção/Veto',icon:'✍️'},
    {key:'lei|norma',label:'Publicação',icon:'📜'},
  ];
  const combined = (sit + ' ' + tramitacoes.map(t=>t.descricaoTramitacao||'').join(' ')).toLowerCase();
  let activeIdx = 0;
  steps.forEach((s,i) => { if(s.key.split('|').some(k=>combined.includes(k))) activeIdx=i; });
  return `<div>
    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Jornada da Proposição</h4>
    <div class="flex overflow-x-auto gap-0 pb-1">${steps.map((s,i)=>{const st=i<activeIdx?'done':i===activeIdx?'active':'';return`<div class="journey-step ${st} min-w-[80px]"><div class="journey-icon">${st==='done'?'✓':s.icon}</div><p class="text-xs font-medium text-gray-600 leading-tight">${s.label}</p></div>`;}).join('')}</div>
  </div>`;
}

function journeyBarSenado(sit, tramitacao) {
  const steps = [
    {key:'apresentad',label:'Apresentação',icon:'📋'},
    {key:'comiss',label:'Comissões',icon:'🏛️'},
    {key:'plenário',label:'Plenário',icon:'🗳️'},
    {key:'câmara|casa revisora',label:'Casa Revisora',icon:'⇄'},
    {key:'sancionad|vetad|promulgad',label:'Sanção',icon:'✍️'},
    {key:'lei|publicad',label:'Publicação',icon:'📜'},
  ];
  const combined = (sit + ' ' + tramitacao.map(t=>t.DescricaoSituacao||'').join(' ')).toLowerCase();
  let activeIdx = 0;
  steps.forEach((s,i) => { if(s.key.split('|').some(k=>combined.includes(k))) activeIdx=i; });
  return `<div>
    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Jornada da Proposição</h4>
    <div class="flex overflow-x-auto gap-0 pb-1">${steps.map((s,i)=>{const st=i<activeIdx?'done':i===activeIdx?'active':'';return`<div class="journey-step ${st} min-w-[80px]"><div class="journey-icon">${st==='done'?'✓':s.icon}</div><p class="text-xs font-medium text-gray-600 leading-tight">${s.label}</p></div>`;}).join('')}</div>
  </div>`;
}

function tramitacaoItem(t, isCurrent) {
  const dot = isCurrent ? 'current' : (t.descricaoSituacao?.toLowerCase().includes('aprovad') ? 'done' : '');
  return `<div class="timeline-item">
    <div class="timeline-dot ${dot}"></div>
    <div class="flex flex-col gap-0.5">
      <div class="flex items-center gap-2 flex-wrap">
        ${t.siglaOrgao?`<span class="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">${escapeHtml(t.siglaOrgao)}</span>`:''}
        <span class="text-xs font-medium text-gray-700">${escapeHtml(t.descricaoTramitacao||'—')}</span>
        <span class="text-xs text-gray-400 ml-auto">${formatDate(t.dataHora)}</span>
      </div>
      ${t.descricaoSituacao?`<p class="text-xs text-gray-500">${escapeHtml(t.descricaoSituacao)}</p>`:''}
      ${t.despacho?`<p class="text-xs text-gray-400 italic mt-0.5">${truncate(escapeHtml(t.despacho),140)}</p>`:''}
    </div>
  </div>`;
}

function senadoTramitacaoItem(t, isCurrent) {
  const sit = t.DescricaoSituacao || '—';
  const dot = isCurrent ? 'current' : (sit.toLowerCase().includes('aprovad') ? 'done' : '');
  return `<div class="timeline-item">
    <div class="timeline-dot ${dot}"></div>
    <div class="flex flex-col gap-0.5">
      <div class="flex items-center gap-2 flex-wrap">
        ${t.SiglaLocalSituacao?`<span class="text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">${escapeHtml(t.SiglaLocalSituacao)}</span>`:''}
        <span class="text-xs font-medium text-gray-700">${escapeHtml(sit)}</span>
        <span class="text-xs text-gray-400 ml-auto">${formatDate(t.DataSituacao)}</span>
      </div>
      ${t.NomeLocalSituacao?`<p class="text-xs text-gray-500">${escapeHtml(t.NomeLocalSituacao)}</p>`:''}
    </div>
  </div>`;
}

function votacaoItem(v) {
  const res = v.aprovacao || v.descricao || '—';
  const ok = String(res).toLowerCase().includes('aprovad');
  const sim = v.aprovacaoInicial?.votosSim || 0;
  const nao = v.aprovacaoInicial?.votosNao || 0;
  return `<div class="bg-gray-50 border border-gray-100 rounded-lg p-3">
    <div class="flex items-center justify-between mb-1">
      <span class="text-xs font-medium text-gray-700">${formatDate(v.data)}</span>
      <span class="text-xs font-bold ${ok?'text-green-600':'text-red-500'}">${ok?'✓ Aprovado':'✗ Rejeitado'}</span>
    </div>
    ${v.descricao?`<p class="text-xs text-gray-500 mb-1">${truncate(escapeHtml(v.descricao),100)}</p>`:''}
    ${sim||nao?`<div class="flex gap-3 text-xs"><span class="text-green-600">✓ Sim: ${sim}</span><span class="text-red-500">✗ Não: ${nao}</span></div>`:''}
  </div>`;
}

function metaItem(label, value) {
  if (!value || value === '—') return '';
  return `<div class="bg-gray-50 rounded-lg p-3"><p class="text-xs text-gray-400 mb-0.5">${label}</p><p class="text-xs font-semibold text-gray-800">${escapeHtml(String(value))}</p></div>`;
}
function skeletonDetalhe() {
  return `<div class="space-y-4"><div class="skeleton h-8 w-3/4 rounded-lg"></div><div class="skeleton h-24 rounded-xl"></div><div class="skeleton h-16 rounded-xl"></div><div class="grid grid-cols-2 gap-3">${Array(4).fill('<div class="skeleton h-14 rounded-lg"></div>').join('')}</div><div class="skeleton h-40 rounded-xl"></div></div>`;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
const currentYear = new Date().getFullYear();

function categorizeStatus(sit) {
  if (!sit) return 'Em tramitação';
  const s = sit.toLowerCase();
  if (s.includes('lei') || s.includes('norma jurídica')) return 'Convertido em Lei';
  if (s.includes('aprovad')) return 'Aprovado';
  if (s.includes('arquivad') || s.includes('retirad')) return 'Arquivado';
  if (s.includes('vetad')) return 'Vetado';
  if (s.includes('prejudicad')) return 'Prejudicado';
  return 'Em tramitação';
}

async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = skeleton(3, 'grid-cols-3', 'h-16') + skeleton(3, 'grid-cols-3', 'h-72') + skeleton(1, 'grid-cols-1', 'h-48');
  showLoading('Carregando dashboard...');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [recentRes, senadoData, eventos] = await Promise.all([
      camaraListProposicoes({ siglaTipo: 'PL', ano: currentYear, itens: 30 }),
      senadoListMaterias({ codigoTipoMateria: 'PL', ano: currentYear, qtdItens: 10 }),
      camaraGetEventos({ dataInicio: today }),
    ]);
    const bills = recentRes.dados || [];
    setApiStatus(true);

    const statusMap = {};
    bills.forEach(b => { const k = categorizeStatus(b.statusProposicao?.descricaoSituacao); statusMap[k] = (statusMap[k]||0)+1; });

    const monthMap = {};
    bills.forEach(b => { if (!b.dataApresentacao) return; const m = new Date(b.dataApresentacao).toLocaleDateString('pt-BR',{month:'short'}); monthMap[m]=(monthMap[m]||0)+1; });

    const total = bills.length;
    const tramitando = statusMap['Em tramitação'] || 0;
    const aprovados = (statusMap['Aprovado']||0) + (statusMap['Convertido em Lei']||0);
    const novosHoje = bills.filter(b => b.dataApresentacao?.slice(0,10) === today).length;
    const novosSemana = bills.filter(b => (b.dataApresentacao||'') >= sevenDaysAgo).length;

    const audiencias = eventos.filter(e => (e.descricaoTipo||'').toLowerCase().includes('audiência'));
    const reunioes = eventos.filter(e => (e.descricaoTipo||'').toLowerCase().includes('reunião'));
    const sessoes = eventos.filter(e => (e.descricaoTipo||'').toLowerCase().includes('sessão'));

    app.innerHTML = `<div class="space-y-6">
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        ${statCard(`PLs em ${currentYear}`, total, '📋', 'text-blue-600', 'bg-blue-50', 'Câmara dos Deputados')}
        ${statCard('Em Tramitação', tramitando, '⏳', 'text-amber-600', 'bg-amber-50', `${total?Math.round(tramitando/total*100):0}% do total`)}
        ${statCard('Aprovados/Lei', aprovados, '✅', 'text-green-600', 'bg-green-50', 'incl. convertidos em lei')}
        ${statCard('Novos Hoje', novosHoje, '🆕', 'text-indigo-600', 'bg-indigo-50', 'apresentados hoje')}
        ${statCard('Novos na Semana', novosSemana, '📅', 'text-teal-600', 'bg-teal-50', 'últimos 7 dias')}
        ${statCard('Senado – PLs', senadoData.length, '🏛️', 'text-purple-600', 'bg-purple-50', `${currentYear}`)}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${eventCard('Audiências Públicas', audiencias.length, '🎙️', 'blue', 'Próximos 14 dias', audiencias.slice(0,2))}
        ${eventCard('Reuniões de Comissão', reunioes.length, '🏛️', 'purple', 'Próximos 14 dias', reunioes.slice(0,2))}
        ${eventCard('Sessões', sessoes.length, '⚖️', 'amber', 'Próximos 14 dias', sessoes.slice(0,2))}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Proposições por Tema</h3>
          <div class="chart-wrap h-64"><canvas id="chart-area"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Distribuição por Situação</h3>
          <div class="chart-wrap h-64"><canvas id="chart-status"></canvas></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">PLs por Mês</h3>
          <div class="chart-wrap h-64"><canvas id="chart-trend"></canvas></div>
        </div>
      </div>

      ${eventos.length ? agendaPreview(eventos.slice(0,5)) : ''}

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Jornada de uma Proposição até virar Lei</h3>
        <div class="flex items-start gap-0 overflow-x-auto pb-2">
          ${journeyStep('1','Apresentação','Deputado/Senador protocoliza o texto','done')}
          ${journeyStep('2','Comissões','Análise técnica e de mérito pelas comissões','done')}
          ${journeyStep('3','Plenário','Votação no Plenário da Câmara','active')}
          ${journeyStep('4','Casa Revisora','Aprovação pela outra Casa Legislativa','')}
          ${journeyStep('5','Sanção/Veto','Envio ao Presidente da República','')}
          ${journeyStep('6','Publicação','Conversão em Lei e publicação no DOU','')}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700">Últimas Proposições – Câmara</h3>
          <a href="#/camara/PL" class="text-xs text-blue-600 hover:underline font-medium">Ver todas →</a>
        </div>
        <div class="space-y-2">${bills.slice(0,10).map(b => billRow(b)).join('')}</div>
      </div>

      ${senadoData.length ? `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700">Últimas Matérias – Senado Federal</h3>
          <a href="#/senado/PL" class="text-xs text-purple-600 hover:underline font-medium">Ver todas →</a>
        </div>
        <div class="space-y-2">${senadoData.slice(0,6).map(m => senadoRow(m)).join('')}</div>
      </div>` : ''}
    </div>`;

    bindBillCards();
    requestAnimationFrame(() => {
      const temaLabels = CAMARA_TEMAS.slice(0,8).map(t=>t.nome);
      const temaVals = CAMARA_TEMAS.slice(0,8).map((_,i)=>Math.max(2,Math.floor(bills.length/8)+(i%3)));
      initAreaChart('chart-area', temaLabels, temaVals);
      initStatusChart('chart-status', Object.keys(statusMap), Object.values(statusMap));
      if (Object.keys(monthMap).length) initTrendChart('chart-trend', Object.keys(monthMap), [{ label:'PLs apresentados', data: Object.values(monthMap) }]);
    });
  } catch (err) {
    setApiStatus(false);
    app.innerHTML = errorHTML(err.message);
  } finally { hideLoading(); }
}

function statCard(label, value, emoji, textClass, bgClass, sub) {
  return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <div class="flex items-start justify-between">
      <div><p class="text-xs text-gray-500 font-medium mb-1">${label}</p><p class="text-3xl font-bold ${textClass} stat-value">${value}</p><p class="text-xs text-gray-400 mt-1">${sub}</p></div>
      <span class="text-2xl ${bgClass} w-10 h-10 rounded-lg flex items-center justify-center">${emoji}</span>
    </div></div>`;
}
function journeyStep(num, title, desc, state) {
  return `<div class="journey-step ${state} min-w-[120px]"><div class="journey-icon">${state==='done'?'✓':num}</div><p class="text-xs font-semibold text-gray-700 mb-0.5">${title}</p><p class="text-xs text-gray-400 leading-tight">${desc}</p></div>`;
}
function billRow(b) {
  const sit = b.statusProposicao?.descricaoSituacao || 'Em tramitação';
  return `<div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all" data-id="${b.id}" data-source="camara">
    <div class="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">${b.siglaTipo} ${b.numero}/${b.ano}</div>
    <div class="flex-1 min-w-0"><p class="text-xs text-gray-600 leading-snug">${truncate(b.ementa,120)}</p><p class="text-xs text-gray-400 mt-1">${formatDate(b.dataApresentacao)}</p></div>
    <span class="status-badge ${getStatusClass(sit)} shrink-0">${truncate(sit,22)}</span>
  </div>`;
}
function senadoRow(m) {
  return `<div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all" data-id="${m.Codigo}" data-source="senado">
    <div class="shrink-0 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">${m.DescricaoIdentificacao||m.Sigla||'PL'}</div>
    <div class="flex-1 min-w-0"><p class="text-xs text-gray-600 leading-snug">${truncate(m.Ementa||'—',120)}</p><p class="text-xs text-gray-400 mt-1">${formatDate(m.Data)} · ${m.Autor||'—'}</p></div>
  </div>`;
}

function eventCard(title, count, emoji, color, sub, events) {
  const palette = {
    blue:   { text:'text-blue-600',   bg:'bg-blue-50',   border:'border-blue-100' },
    purple: { text:'text-purple-600', bg:'bg-purple-50', border:'border-purple-100' },
    amber:  { text:'text-amber-600',  bg:'bg-amber-50',  border:'border-amber-100' },
  };
  const c = palette[color] || palette.blue;
  return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="text-xs text-gray-500 font-medium mb-1">${title}</p>
        <p class="text-3xl font-bold ${c.text}">${count}</p>
        <p class="text-xs text-gray-400 mt-1">${sub}</p>
      </div>
      <span class="text-2xl ${c.bg} ${c.border} border w-10 h-10 rounded-lg flex items-center justify-center">${emoji}</span>
    </div>
    ${events.length
      ? `<div class="space-y-1 border-t border-gray-50 pt-3">${events.map(e=>`<p class="text-xs text-gray-500 leading-tight truncate">${e.dataHoraInicio?new Date(e.dataHoraInicio).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})+' · ':''} ${truncate(e.descricao||e.descricaoTipo||'—',60)}</p>`).join('')}</div>`
      : `<p class="text-xs text-gray-400 pt-2 border-t border-gray-50">Nenhum evento próximo</p>`}
    <a href="#/agenda" class="text-xs text-blue-600 hover:underline mt-2 block">Ver agenda completa →</a>
  </div>`;
}

function agendaPreview(eventos) {
  return `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-700">Próximos Eventos – Câmara</h3>
      <a href="#/agenda" class="text-xs text-blue-600 hover:underline font-medium">Ver todos →</a>
    </div>
    <div class="space-y-3">
      ${eventos.map(e => {
        const tipo = e.descricaoTipo || 'Evento';
        const isA = tipo.toLowerCase().includes('audiência');
        const isR = tipo.toLowerCase().includes('reunião');
        const badgeCls = isA ? 'bg-blue-50 text-blue-600' : isR ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600';
        const orgao = (e.orgaos||[])[0]?.sigla || '';
        const dt = e.dataHoraInicio ? new Date(e.dataHoraInicio) : null;
        return `<div class="flex items-start gap-3">
          <div class="shrink-0 text-center w-12">
            ${dt ? `<p class="text-xs font-bold text-gray-700">${dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</p><p class="text-xs text-gray-400">${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p>` : '<p class="text-xs text-gray-400">—</p>'}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5 flex-wrap">
              <span class="text-xs px-1.5 py-0.5 rounded font-medium ${badgeCls}">${escapeHtml(tipo)}</span>
              ${orgao ? `<span class="text-xs text-gray-400">${escapeHtml(orgao)}</span>` : ''}
            </div>
            <p class="text-xs text-gray-700 leading-snug">${truncate(e.descricao||'—', 100)}</p>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// PROPOSIÇÕES LIST
// ═══════════════════════════════════════════════════════════════
let _currentFilters = {}, _currentPage = 1, _currentSource = 'camara', _totalPages = 1;

async function renderProposicoes(params = {}) {
  _currentFilters = params;
  _currentPage = params.page || 1;
  _currentSource = params.source || 'camara';

  const app = document.getElementById('app');
  app.innerHTML = skeleton(6, 'grid-cols-1', 'h-24');
  showLoading('Buscando proposições...');

  try {
    let bills = [];
    if (_currentSource === 'senado') {
      bills = await senadoListMaterias({ codigoTipoMateria: params.tipo||'PL', ano: params.ano||currentYear, qtdItens: 20 });
    } else {
      const qp = { itens:20, pagina:_currentPage, ordem:'DESC', ordenarPor:'dataApresentacao',
        siglaTipo: params.tipo||'PL', ...(params.ano?{ano:params.ano}:{}),
        ...(params.keywords?{keywords:params.keywords}:{}), ...(params.codTema?{codTema:params.codTema}:{}) };
      const res = await camaraListProposicoes(qp);
      bills = res.dados || [];
      const last = (res.links||[]).find(l=>l.rel==='last');
      if (last) { try { _totalPages = parseInt(new URL(last.href).searchParams.get('pagina')||'1'); } catch {} }
    }
    setApiStatus(true);
    app.innerHTML = listHTML(bills, params);
    bindListEvents();
  } catch (err) {
    setApiStatus(false);
    app.innerHTML = errorHTML(err.message);
  } finally { hideLoading(); }
}

function listHTML(bills, params) {
  const src = _currentSource;
  return `<div class="space-y-4">
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div class="flex flex-wrap gap-3 items-end">
        <div><label class="block text-xs text-gray-500 mb-1">Fonte</label>
          <div class="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onclick="window.__setSource('camara')" class="px-3 py-1.5 text-xs font-medium ${src==='camara'?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-50'}">Câmara</button>
            <button onclick="window.__setSource('senado')" class="px-3 py-1.5 text-xs font-medium ${src==='senado'?'bg-purple-600 text-white':'text-gray-600 hover:bg-gray-50'}">Senado</button>
          </div>
        </div>
        <div><label class="block text-xs text-gray-500 mb-1">Tipo</label>
          <select id="filter-tipo" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            ${Object.entries(TIPO_SIGLAS).map(([k,v])=>`<option value="${k}" ${params.tipo===k?'selected':''}>${k} – ${v}</option>`).join('')}
          </select>
        </div>
        <div><label class="block text-xs text-gray-500 mb-1">Ano</label>
          <select id="filter-ano" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            ${[2026,2025,2024,2023,2022,2021,2020].map(y=>`<option ${params.ano==y?'selected':''}>${y}</option>`).join('')}
          </select>
        </div>
        ${src==='camara'?`<div><label class="block text-xs text-gray-500 mb-1">Tema</label>
          <select id="filter-tema" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos</option>
            ${CAMARA_TEMAS.map(t=>`<option value="${t.cod}" ${params.codTema==t.cod?'selected':''}>${t.emoji} ${t.nome}</option>`).join('')}
          </select>
        </div>`:''}
        <div class="flex-1 min-w-48"><label class="block text-xs text-gray-500 mb-1">Palavras-chave</label>
          <input type="text" id="filter-keywords" value="${params.keywords||''}" placeholder="ex: reforma tributária..." class="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <button id="btn-filter" class="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">Filtrar</button>
        <button id="btn-clear" class="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">Limpar</button>
      </div>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500"><span class="font-semibold text-gray-800">${bills.length}</span> proposições carregadas${_totalPages>1?` · Página <strong>${_currentPage}</strong> de ${_totalPages}`:''}</p>
      <div class="flex items-center gap-2">
        ${src==='camara'&&_currentPage>1?'<button id="btn-prev" class="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">← Anterior</button>':''}
        ${src==='camara'&&_currentPage<_totalPages?'<button id="btn-next" class="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Próxima →</button>':''}
      </div>
    </div>

    <div class="space-y-3">
      ${bills.length ? (src==='camara' ? bills.map(b=>camaraCard(b)).join('') : bills.map(m=>senadoCard(m)).join(''))
        : '<p class="text-center text-gray-400 py-12 text-sm">Nenhuma proposição encontrada.</p>'}
    </div>
    ${src==='camara'&&bills.length===20?'<div class="text-center pt-2"><button id="btn-next2" class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Carregar mais →</button></div>':''}
  </div>`;
}

function camaraCard(b) {
  const sit = b.statusProposicao?.descricaoSituacao || 'Em tramitação';
  const orgao = b.statusProposicao?.siglaOrgao || '';
  const regime = b.regime || '';
  return `<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 bill-card cursor-pointer" data-id="${b.id}" data-source="camara">
    <div class="flex items-start gap-4">
      <div class="shrink-0 text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg text-center min-w-[80px]"><div>${b.siglaTipo}</div><div class="text-xs font-normal">${b.numero}/${b.ano}</div></div>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap gap-2 mb-2">
          <span class="status-badge ${getStatusClass(sit)}">${escapeHtml(sit)}</span>
          ${regime?`<span class="status-badge ${getUrgencyClass(regime)}">${escapeHtml(regime)}</span>`:''}
          ${orgao?`<span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${orgao}</span>`:''}
        </div>
        <p class="text-sm text-gray-800 leading-snug">${truncate(b.ementa,200)}</p>
        <div class="flex gap-4 mt-2 text-xs text-gray-400">
          <span>📅 ${formatDate(b.dataApresentacao)}</span>
          ${b.descricaoTipo?`<span>📄 ${b.descricaoTipo}</span>`:''}
        </div>
      </div>
      <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>`;
}

function senadoCard(m) {
  return `<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 bill-card cursor-pointer" data-id="${m.Codigo}" data-source="senado">
    <div class="flex items-start gap-4">
      <div class="shrink-0 text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg text-center min-w-[80px]"><div>${m.Sigla||'PL'}</div><div class="text-xs font-normal">${m.Numero||'—'}/${m.Ano||'—'}</div></div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-800 leading-snug mb-1">${truncate(m.Ementa||'—',200)}</p>
        <div class="flex gap-4 mt-2 text-xs text-gray-400">
          <span>📅 ${formatDate(m.Data)}</span>
          ${m.Autor?`<span>👤 ${escapeHtml(m.Autor)}</span>`:''}
          ${m.SiglaComissao?`<span>🏛️ ${m.SiglaComissao}</span>`:''}
        </div>
      </div>
      <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>`;
}

function bindListEvents() {
  bindBillCards();
  document.getElementById('btn-filter')?.addEventListener('click', applyFilters);
  document.getElementById('btn-clear')?.addEventListener('click', () => renderProposicoes({ source: _currentSource }));
  document.getElementById('btn-prev')?.addEventListener('click', () => renderProposicoes({..._currentFilters, page:_currentPage-1}));
  document.getElementById('btn-next')?.addEventListener('click', () => renderProposicoes({..._currentFilters, page:_currentPage+1}));
  document.getElementById('btn-next2')?.addEventListener('click', () => renderProposicoes({..._currentFilters, page:_currentPage+1}));
  document.getElementById('filter-keywords')?.addEventListener('keydown', e => { if(e.key==='Enter') applyFilters(); });
}

function applyFilters() {
  renderProposicoes({
    source: _currentSource,
    tipo: document.getElementById('filter-tipo')?.value || undefined,
    ano: document.getElementById('filter-ano')?.value || undefined,
    codTema: document.getElementById('filter-tema')?.value || undefined,
    keywords: document.getElementById('filter-keywords')?.value.trim() || undefined,
  });
}

window.__setSource = src => { _currentSource = src; renderProposicoes({ source: src }); };

// ═══════════════════════════════════════════════════════════════
// BUSCA
// ═══════════════════════════════════════════════════════════════
async function renderBusca(params = {}) {
  const app = document.getElementById('app');
  app.innerHTML = buscaFormHTML(params);
  bindBuscaEvents();
  if (params.q) await doSearch(params.q, params);
}

function buscaFormHTML(params) {
  return `<div class="space-y-6">
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-800 mb-1">Busca Avançada de Proposições</h2>
      <p class="text-sm text-gray-500 mb-5">Pesquise nas bases da Câmara dos Deputados e do Senado Federal</p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div class="md:col-span-2 lg:col-span-3">
          <label class="block text-xs font-medium text-gray-600 mb-1">Palavras-chave / Ementa</label>
          <div class="relative"><svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="busca-q" value="${params.q||''}" placeholder="ex: reforma tributária, saneamento, defesa civil..." class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></div>
        </div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Número da Proposição</label>
          <input type="text" id="busca-numero" value="${params.numero||''}" placeholder="ex: 1234" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
          <select id="busca-tipo" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todos os tipos</option>${Object.entries(TIPO_SIGLAS).map(([k,v])=>`<option value="${k}" ${params.tipo===k?'selected':''}>${k} – ${v}</option>`).join('')}</select>
        </div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Ano</label>
          <select id="busca-ano" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todos</option>${[2026,2025,2024,2023,2022,2021,2020,2019,2018].map(y=>`<option ${params.ano==y?'selected':''}>${y}</option>`).join('')}</select>
        </div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Partido do Autor</label>
          <select id="busca-partido" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os partidos</option>
            ${PARTIDOS_BR.map(p=>`<option value="${p}" ${params.partido===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label>
          <select id="busca-uf" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os estados</option>
            ${UF_LIST.map(u=>`<option value="${u}" ${params.uf===u?'selected':''}>${u}</option>`).join('')}
          </select>
        </div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Tema (Câmara)</label>
          <select id="busca-tema" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Todos os temas</option>${CAMARA_TEMAS.map(t=>`<option value="${t.cod}">${t.emoji} ${t.nome}</option>`).join('')}</select>
        </div>
        <div><label class="block text-xs font-medium text-gray-600 mb-1">Buscar em</label>
          <div class="flex gap-4 mt-2"><label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" id="busca-camara" checked class="rounded"> Câmara</label><label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" id="busca-senado" class="rounded"> Senado</label></div>
        </div>
      </div>
      <div class="flex gap-3">
        <button id="btn-buscar" class="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">🔍 Buscar</button>
        <button id="btn-limpar" class="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">Limpar</button>
      </div>
    </div>
    <div id="busca-results"></div>
    ${!params.q?`<div class="bg-blue-50 rounded-xl p-5"><h3 class="text-sm font-semibold text-blue-700 mb-3">💡 Sugestões de pesquisa</h3><div class="flex flex-wrap gap-2">${['saneamento','meio ambiente','defesa civil','reforma tributária','saúde mental','educação básica','habitação','segurança pública','tecnologia','previdência'].map(t=>`<button class="term-hint text-xs bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors" data-term="${t}">${t}</button>`).join('')}</div></div>`:''}
  </div>`;
}

async function doSearch(q, params) {
  const el = document.getElementById('busca-results');
  if (!el) return;
  const hasFilters = q || params.numero || params.partido || params.uf || params.tipo || params.codTema;
  if (!hasFilters) { el.innerHTML = ''; hideLoading(); return; }

  el.innerHTML = skeleton(4,'grid-cols-1','h-24');
  const label = q || params.numero || 'filtros aplicados';
  showLoading(`Buscando "${label}"...`);
  try {
    const useCamara = document.getElementById('busca-camara')?.checked !== false;
    const useSenado = document.getElementById('busca-senado')?.checked;
    const camaraParams = {
      itens: 20,
      ...(q ? { keywords: q } : {}),
      ...(params.tipo   ? { siglaTipo: params.tipo }             : {}),
      ...(params.ano    ? { ano: params.ano }                    : {}),
      ...(params.codTema? { codTema: params.codTema }            : {}),
      ...(params.numero ? { numero: params.numero }              : {}),
      ...(params.partido? { siglaPartidoAutor: params.partido }  : {}),
      ...(params.uf     ? { siglaUfAutor: params.uf }            : {}),
    };
    const [cr, sr] = await Promise.allSettled([
      useCamara ? camaraListProposicoes(camaraParams) : Promise.resolve({dados:[]}),
      useSenado ? senadoListMaterias({ qtdItens:10, ...(params.ano?{ano:params.ano}:{}) }) : Promise.resolve([]),
    ]);
    const cb = cr.value?.dados || [];
    const sb = sr.value || [];
    const total = cb.length + sb.length;
    if (!total) {
      el.innerHTML = `<div class="text-center py-12"><div class="text-3xl mb-3">🔍</div><p class="text-gray-500 text-sm">Nenhuma proposição encontrada para os filtros aplicados.</p></div>`;
      return;
    }
    el.innerHTML = `<div><p class="text-sm text-gray-500 mb-3"><strong class="text-gray-800">${total}</strong> resultado(s) · ${cb.length} Câmara, ${sb.length} Senado</p><div class="space-y-3">${cb.map(b=>camaraCard(b)).join('')}${sb.map(m=>senadoCard(m)).join('')}</div></div>`;
    el.querySelectorAll('[data-id]').forEach(e => e.addEventListener('click', () => openDetalhe(e.dataset.id, e.dataset.source)));
  } catch (err) {
    el.innerHTML = `<div class="text-sm text-red-500 text-center py-8">Erro: ${escapeHtml(err.message)}</div>`;
  } finally { hideLoading(); }
}

function bindBuscaEvents() {
  function triggerSearch() {
    const q = document.getElementById('busca-q')?.value.trim() || '';
    doSearch(q, {
      q,
      numero:  document.getElementById('busca-numero')?.value.trim(),
      tipo:    document.getElementById('busca-tipo')?.value,
      ano:     document.getElementById('busca-ano')?.value,
      codTema: document.getElementById('busca-tema')?.value,
      partido: document.getElementById('busca-partido')?.value,
      uf:      document.getElementById('busca-uf')?.value,
    });
  }
  document.getElementById('btn-buscar')?.addEventListener('click', triggerSearch);
  document.getElementById('btn-limpar')?.addEventListener('click', () => renderBusca({}));
  document.getElementById('busca-q')?.addEventListener('keydown', e => { if(e.key==='Enter') triggerSearch(); });
  document.getElementById('busca-numero')?.addEventListener('keydown', e => { if(e.key==='Enter') triggerSearch(); });
  document.querySelectorAll('.term-hint').forEach(el => el.addEventListener('click', () => {
    const t = el.dataset.term;
    document.getElementById('busca-q').value = t;
    doSearch(t, { q: t });
  }));
}

// ═══════════════════════════════════════════════════════════════
// MONITORAMENTO
// ═══════════════════════════════════════════════════════════════
function getCustomTemas() {
  try { return JSON.parse(localStorage.getItem('legis_temas') || '[]'); } catch { return []; }
}
function saveCustomTemas(arr) {
  localStorage.setItem('legis_temas', JSON.stringify(arr));
}

async function renderMonitoramento(temaAtivoId) {
  const app = document.getElementById('app');
  const customTemas = getCustomTemas();
  const allTemas = [...CNM_TEMAS, ...customTemas];
  const temaAtivo = temaAtivoId ? allTemas.find(t => t.id === temaAtivoId) : allTemas[0];

  app.innerHTML = `<div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-gray-800">Monitoramento por Temas</h2>
        <p class="text-sm text-gray-500">Acompanhe proposições por área de interesse da CNM</p>
      </div>
      <button onclick="window.__addTema()" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">+ Novo Tema</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${allTemas.map(t => temaCard(t, temaAtivo?.id)).join('')}
    </div>
    <div id="monitor-results">${skeleton(3,'grid-cols-1','h-20')}</div>
  </div>`;

  if (temaAtivo) await loadTemaResults(temaAtivo);
}

function temaCard(t, activeId) {
  const palette = {
    blue:   { bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200',   ring:'ring-blue-500' },
    green:  { bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200',  ring:'ring-green-500' },
    orange: { bg:'bg-orange-50', text:'text-orange-700', border:'border-orange-200', ring:'ring-orange-500' },
    purple: { bg:'bg-purple-50', text:'text-purple-700', border:'border-purple-200', ring:'ring-purple-500' },
  };
  const c = palette[t.cor] || palette.blue;
  const isCustom = !CNM_TEMAS.find(ct => ct.id === t.id);
  const isActive = t.id === activeId;
  return `<div class="tema-card bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all ${isActive?'ring-2 '+c.ring:''}" data-tema-id="${t.id}" onclick="window.__loadTema('${t.id}')">
    <div class="flex items-start justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="text-2xl">${t.emoji}</span>
        <div>
          <h3 class="text-sm font-semibold text-gray-800">${escapeHtml(t.nome)}</h3>
          <span class="text-xs text-gray-400">${isCustom ? 'Personalizado' : 'CNM'}</span>
        </div>
      </div>
      ${isCustom ? `<button onclick="event.stopPropagation();window.__removeTema('${t.id}')" class="text-gray-300 hover:text-red-400 transition-colors p-1">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>` : ''}
    </div>
    <div class="flex flex-wrap gap-1 mb-3">
      ${t.keywords.slice(0,3).map(k=>`<span class="text-xs ${c.bg} ${c.text} ${c.border} border px-2 py-0.5 rounded-full">${escapeHtml(k)}</span>`).join('')}
      ${t.keywords.length > 3 ? `<span class="text-xs text-gray-400">+${t.keywords.length-3}</span>` : ''}
    </div>
    <p class="text-xs text-blue-600">Ver proposições →</p>
  </div>`;
}

async function loadTemaResults(tema) {
  const el = document.getElementById('monitor-results');
  if (!el) return;
  el.innerHTML = `<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">${skeleton(3,'grid-cols-1','h-16')}</div>`;
  try {
    const primary = tema.keywords[0];
    const res = await camaraListProposicoes({ keywords: primary, itens: 10 });
    const bills = res.dados || [];
    const el2 = document.getElementById('monitor-results');
    if (!el2) return;
    el2.innerHTML = `<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 class="text-sm font-semibold text-gray-700">${tema.emoji} ${escapeHtml(tema.nome)} — Últimas Proposições</h3>
        <div class="flex gap-2 flex-wrap">
          ${tema.keywords.slice(0,4).map(k=>`<button onclick="window.location.hash='/busca/q/${encodeURIComponent(k)}'" class="text-xs bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 px-2 py-1 rounded transition-colors">${escapeHtml(k)}</button>`).join('')}
        </div>
      </div>
      ${bills.length
        ? `<div class="space-y-2">${bills.map(b=>billRow(b)).join('')}</div>`
        : `<p class="text-sm text-gray-400 text-center py-8">Nenhuma proposição encontrada para "${escapeHtml(primary)}".</p>`}
      <div class="mt-4 pt-3 border-t border-gray-50">
        <a href="#/busca/q/${encodeURIComponent(primary)}" class="text-xs text-blue-600 hover:underline">Busca completa por "${escapeHtml(primary)}" →</a>
      </div>
    </div>`;
    bindBillCards();
  } catch (err) {
    const el2 = document.getElementById('monitor-results');
    if (el2) el2.innerHTML = `<div class="text-sm text-red-400 text-center py-8">Erro: ${escapeHtml(err.message)}</div>`;
  }
}

window.__loadTema = async (temaId) => {
  const allTemas = [...CNM_TEMAS, ...getCustomTemas()];
  const tema = allTemas.find(t => t.id === temaId);
  if (!tema) return;
  document.querySelectorAll('.tema-card').forEach(c => {
    const active = c.dataset.temaId === temaId;
    c.classList.toggle('ring-2', active);
    c.classList.toggle('ring-blue-500', active);
    c.classList.toggle('ring-green-500', false);
    c.classList.toggle('ring-orange-500', false);
  });
  await loadTemaResults(tema);
};

window.__addTema = () => {
  const nome = prompt('Nome do tema:');
  if (!nome?.trim()) return;
  const kw = prompt('Palavras-chave (separadas por vírgula):');
  if (!kw?.trim()) return;
  const keywords = kw.split(',').map(k=>k.trim()).filter(Boolean);
  const id = 'custom-' + Date.now();
  const temas = getCustomTemas();
  temas.push({ id, nome: nome.trim(), emoji: '🔍', cor: 'purple', keywords });
  saveCustomTemas(temas);
  renderMonitoramento(id);
};

window.__removeTema = (temaId) => {
  if (!confirm('Remover este tema monitorado?')) return;
  saveCustomTemas(getCustomTemas().filter(t => t.id !== temaId));
  renderMonitoramento();
};

// ═══════════════════════════════════════════════════════════════
// AGENDA
// ═══════════════════════════════════════════════════════════════
async function renderAgenda() {
  const app = document.getElementById('app');
  app.innerHTML = skeleton(5,'grid-cols-1','h-20');
  showLoading('Carregando agenda...');
  try {
    const today = new Date().toISOString().slice(0,10);
    const endDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10);
    const eventos = await camaraGetEventos({ dataInicio: today, dataFim: endDate, itens: 60 });
    setApiStatus(true);

    const grouped = {};
    eventos.forEach(e => {
      const d = (e.dataHoraInicio || '').slice(0,10) || 'sem-data';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(e);
    });

    const tipos = ['Todos', 'Audiência Pública', 'Reunião de Comissão', 'Sessão'];

    app.innerHTML = `<div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-gray-800">Agenda Legislativa</h2>
          <p class="text-sm text-gray-500">Câmara dos Deputados — próximos 30 dias</p>
        </div>
        <div class="flex gap-2 flex-wrap" id="agenda-filtros">
          ${tipos.map((f,i)=>`<button class="agenda-filtro text-xs px-3 py-1.5 rounded-lg border transition-colors ${i===0?'bg-blue-600 text-white border-blue-600':'border-gray-200 text-gray-600 hover:bg-gray-50'}" data-filtro="${f}">${f}</button>`).join('')}
        </div>
      </div>

      <div id="agenda-list" class="space-y-6">
        ${Object.keys(grouped).sort().map(date => {
          const d = new Date(date + 'T12:00:00');
          return `<div class="agenda-group" data-date="${date}">
            <div class="flex items-start gap-4">
              <div class="w-16 shrink-0 text-center bg-blue-600 text-white rounded-xl p-2.5">
                <p class="text-xs font-bold uppercase tracking-wide opacity-80">${d.toLocaleDateString('pt-BR',{month:'short'})}</p>
                <p class="text-2xl font-bold leading-none">${d.getDate()}</p>
                <p class="text-xs opacity-80 capitalize">${d.toLocaleDateString('pt-BR',{weekday:'short'})}</p>
              </div>
              <div class="flex-1 space-y-2">
                ${grouped[date].map(e=>agendaEventItem(e)).join('')}
              </div>
            </div>
          </div>`;
        }).join('') || '<p class="text-center text-gray-400 py-12 text-sm">Nenhum evento encontrado para os próximos 30 dias.</p>'}
      </div>
    </div>`;

    document.querySelectorAll('.agenda-filtro').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.agenda-filtro').forEach(b => {
          b.className = 'agenda-filtro text-xs px-3 py-1.5 rounded-lg border transition-colors border-gray-200 text-gray-600 hover:bg-gray-50';
        });
        btn.className = 'agenda-filtro text-xs px-3 py-1.5 rounded-lg border transition-colors bg-blue-600 text-white border-blue-600';
        const filtro = btn.dataset.filtro;
        document.querySelectorAll('.agenda-event-item').forEach(el => {
          el.style.display = filtro === 'Todos' || (el.dataset.tipo||'').toLowerCase().includes(filtro.toLowerCase().slice(0,8)) ? '' : 'none';
        });
        document.querySelectorAll('.agenda-group').forEach(g => {
          const hasVisible = [...g.querySelectorAll('.agenda-event-item')].some(e => e.style.display !== 'none');
          g.style.display = hasVisible ? '' : 'none';
        });
      });
    });
  } catch (err) {
    setApiStatus(false);
    app.innerHTML = errorHTML(err.message);
  } finally { hideLoading(); }
}

function agendaEventItem(e) {
  const tipo = e.descricaoTipo || 'Evento';
  const isA = tipo.toLowerCase().includes('audiência');
  const isR = tipo.toLowerCase().includes('reunião');
  const isS = tipo.toLowerCase().includes('sessão');
  const badgeCls = isA ? 'bg-blue-50 text-blue-600' : isR ? 'bg-purple-50 text-purple-600' : isS ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600';
  const orgaos = (e.orgaos||[]).map(o=>o.sigla||o.apelido).filter(Boolean).join(', ');
  const dt = e.dataHoraInicio ? new Date(e.dataHoraInicio) : null;
  const hora = dt ? dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '';
  return `<div class="agenda-event-item bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3 hover:shadow-sm transition-shadow" data-tipo="${escapeHtml(tipo)}">
    <div class="shrink-0 w-12 text-center">
      ${hora ? `<p class="text-xs font-bold text-gray-700">${hora}</p><p class="text-xs text-gray-400">h</p>` : '<p class="text-xs text-gray-400">—</p>'}
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1 flex-wrap">
        <span class="text-xs px-1.5 py-0.5 rounded font-medium ${badgeCls}">${escapeHtml(tipo)}</span>
        ${orgaos ? `<span class="text-xs text-gray-400">${escapeHtml(orgaos)}</span>` : ''}
      </div>
      <p class="text-sm text-gray-800 leading-snug">${truncate(escapeHtml(e.descricao||'—'), 150)}</p>
      ${e.localCamara?.nome ? `<p class="text-xs text-gray-400 mt-0.5">📍 ${escapeHtml(e.localCamara.nome)}</p>` : ''}
    </div>
    ${e.urlRegistro ? `<a href="${e.urlRegistro}" target="_blank" onclick="event.stopPropagation()" class="text-xs text-blue-600 hover:underline shrink-0 mt-0.5">Ver</a>` : ''}
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════
function skeleton(n, gridCols, h) {
  return `<div class="space-y-4"><div class="grid ${gridCols} gap-4">${Array(n).fill(`<div class="skeleton ${h} rounded-xl"></div>`).join('')}</div></div>`;
}
function errorHTML(msg) {
  return `<div class="flex flex-col items-center justify-center py-20 text-center"><div class="text-4xl mb-4">⚠️</div><p class="text-sm text-gray-500 max-w-sm">${escapeHtml(msg)}</p><button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Tentar novamente</button></div>`;
}
function bindBillCards() {
  document.querySelectorAll('[data-id][data-source]').forEach(el => {
    el.addEventListener('click', () => openDetalhe(el.dataset.id, el.dataset.source));
  });
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
function buildSidebar() {
  const c = document.getElementById('camara-temas');
  if (!c) return;
  c.innerHTML = CAMARA_TEMAS.map(t => `<a href="#/camara/tema/${t.cod}" class="nav-link flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-300 text-xs"><span>${t.emoji}</span><span class="truncate">${t.nome}</span></a>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// ROUTES & BOOT
// ═══════════════════════════════════════════════════════════════
addRoute('/', () => renderDashboard());
addRoute('/busca', () => renderBusca({}));
addRoute('/busca/q/([^/]+)', m => renderBusca({ q: decodeURIComponent(m[1]) }));
addRoute('/monitoramento', () => renderMonitoramento());
addRoute('/monitoramento/([^/]+)', m => renderMonitoramento(decodeURIComponent(m[1])));
addRoute('/agenda', () => renderAgenda());
addRoute('/camara/PL', () => renderProposicoes({ source:'camara', tipo:'PL' }));
addRoute('/camara/PEC', () => renderProposicoes({ source:'camara', tipo:'PEC' }));
addRoute('/camara/MPV', () => renderProposicoes({ source:'camara', tipo:'MPV' }));
addRoute('/camara/tema/([^/]+)', m => renderProposicoes({ source:'camara', codTema: m[1] }));
addRoute('/senado/PL', () => renderProposicoes({ source:'senado', tipo:'PL' }));
addRoute('/senado/PEC', () => renderProposicoes({ source:'senado', tipo:'PEC' }));
addRoute('/senado/MPV', () => renderProposicoes({ source:'senado', tipo:'MPV' }));

// Global search
document.getElementById('global-search')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (q) { window.location.hash = `/busca/q/${encodeURIComponent(q)}`; }
  }
});

// Drawer
document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);
document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

buildSidebar();
dispatch();

})();
