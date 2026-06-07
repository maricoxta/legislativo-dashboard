import { camaraListProposicoes, senadoListMaterias } from './api.js';
import { getStatusClass, getUrgencyClass, CAMARA_TEMAS, TIPO_SIGLAS } from './config.js';
import { formatDate, truncate, showLoading, hideLoading, setApiStatus, debounce } from './utils.js';
import { openDetalhe } from './detalhe.js';

let currentFilters = {};
let currentPage = 1;
let currentSource = 'camara';
let totalPages = 1;

export async function renderProposicoes(params = {}) {
  currentFilters = params;
  currentPage = params.page || 1;
  currentSource = params.source || 'camara';

  const app = document.getElementById('app');
  app.innerHTML = skeletonList();
  showLoading('Buscando proposições...');

  try {
    let bills = [], meta = {};

    if (currentSource === 'senado') {
      const raw = await senadoListMaterias({
        codigoTipoMateria: params.tipo || 'PL',
        ano: params.ano || new Date().getFullYear(),
        qtdItens: 20,
        ...(params.keywords ? { ementa: params.keywords } : {})
      });
      bills = raw;
      meta = { totalItens: raw.length };
    } else {
      const queryParams = {
        itens: 20,
        pagina: currentPage,
        ordem: 'DESC',
        ordenarPor: 'dataApresentacao',
        ...(params.tipo ? { siglaTipo: params.tipo } : { siglaTipo: 'PL' }),
        ...(params.ano ? { ano: params.ano } : {}),
        ...(params.keywords ? { keywords: params.keywords } : {}),
        ...(params.codTema ? { codTema: params.codTema } : {}),
        ...(params.codSituacao ? { codSituacao: params.codSituacao } : {}),
      };
      const res = await camaraListProposicoes(queryParams);
      bills = res.dados || [];
      // Estimate pagination from links
      const lastLink = (res.links || []).find(l => l.rel === 'last');
      if (lastLink) {
        const url = new URL(lastLink.href);
        totalPages = parseInt(url.searchParams.get('pagina') || '1');
      }
      meta = { totalItens: bills.length, pagina: currentPage, totalPaginas: totalPages };
    }

    setApiStatus(true);
    app.innerHTML = listHTML(bills, meta, params);
    bindEvents();
  } catch (err) {
    setApiStatus(false);
    app.innerHTML = errorHTML(err.message);
  } finally {
    hideLoading();
  }
}

function listHTML(bills, meta, params) {
  const source = currentSource;
  const rows = source === 'camara'
    ? bills.map(b => camaraRow(b)).join('')
    : bills.map(m => senadoRow(m)).join('');

  return `
    <div class="space-y-4">
      <!-- Filter bar -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Fonte</label>
            <div class="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onclick="window.__setSource('camara')" class="px-3 py-1.5 text-xs font-medium ${source==='camara'?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-50'}">Câmara</button>
              <button onclick="window.__setSource('senado')" class="px-3 py-1.5 text-xs font-medium ${source==='senado'?'bg-purple-600 text-white':'text-gray-600 hover:bg-gray-50'}">Senado</button>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Tipo</label>
            <select id="filter-tipo" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              ${Object.entries(TIPO_SIGLAS).map(([k,v])=>`<option value="${k}" ${params.tipo===k?'selected':''}>${k} – ${v}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Ano</label>
            <select id="filter-ano" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              ${[2026,2025,2024,2023,2022,2021,2020].map(y=>`<option ${params.ano==y?'selected':''}>${y}</option>`).join('')}
            </select>
          </div>
          ${source==='camara' ? `
          <div>
            <label class="block text-xs text-gray-500 mb-1">Tema</label>
            <select id="filter-tema" class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              ${CAMARA_TEMAS.map(t=>`<option value="${t.cod}" ${params.codTema==t.cod?'selected':''}>${t.emoji} ${t.nome}</option>`).join('')}
            </select>
          </div>` : ''}
          <div class="flex-1 min-w-48">
            <label class="block text-xs text-gray-500 mb-1">Palavras-chave / Ementa</label>
            <input type="text" id="filter-keywords" value="${params.keywords||''}" placeholder="ex: reforma tributária..." class="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <button id="btn-filter" class="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">Filtrar</button>
          <button id="btn-clear" class="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">Limpar</button>
        </div>
      </div>

      <!-- Results header -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">
          <span class="font-semibold text-gray-800">${bills.length}</span> proposições carregadas
          ${meta.totalPaginas > 1 ? `· Página <strong>${currentPage}</strong> de ${totalPages}` : ''}
        </p>
        <div class="flex items-center gap-2">
          ${source==='camara' && currentPage > 1 ? `<button id="btn-prev" class="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">← Anterior</button>` : ''}
          ${source==='camara' && currentPage < totalPages ? `<button id="btn-next" class="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Próxima →</button>` : ''}
        </div>
      </div>

      <!-- Bills list -->
      <div class="space-y-3" id="bills-list">
        ${rows || '<p class="text-center text-gray-400 py-12 text-sm">Nenhuma proposição encontrada com esses filtros.</p>'}
      </div>

      ${source==='camara' && bills.length === 20 ? `
      <div class="text-center pt-2">
        <button id="btn-next2" class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Carregar mais →</button>
      </div>` : ''}
    </div>
  `;
}

function camaraRow(b) {
  const sit = b.statusProposicao?.descricaoSituacao || 'Em tramitação';
  const orgao = b.statusProposicao?.siglaOrgao || '';
  const regime = b.regime || '';
  const cls = getStatusClass(sit);
  const urgCls = getUrgencyClass(regime);

  return `
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 bill-card cursor-pointer" data-id="${b.id}" data-source="camara">
      <div class="flex items-start gap-4">
        <div class="shrink-0">
          <div class="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
            <div>${b.siglaTipo}</div>
            <div class="text-xs font-normal">${b.numero}/${b.ano}</div>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap gap-2 mb-2">
            <span class="status-badge ${cls}">${sit}</span>
            ${regime ? `<span class="status-badge ${urgCls}">${regime}</span>` : ''}
            ${orgao ? `<span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${orgao}</span>` : ''}
          </div>
          <p class="text-sm text-gray-800 leading-snug font-medium">${truncate(b.ementa, 200)}</p>
          <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>📅 ${formatDate(b.dataApresentacao)}</span>
            ${b.descricaoTipo ? `<span>📄 ${b.descricaoTipo}</span>` : ''}
          </div>
        </div>
        <div class="shrink-0">
          <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>`;
}

function senadoRow(m) {
  return `
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 bill-card cursor-pointer" data-id="${m.Codigo}" data-source="senado">
      <div class="flex items-start gap-4">
        <div class="shrink-0">
          <div class="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg text-center min-w-[80px]">
            <div>${m.Sigla || 'PL'}</div>
            <div class="text-xs font-normal">${m.Numero || '—'}/${m.Ano || '—'}</div>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800 leading-snug font-medium mb-1">${truncate(m.Ementa || '—', 200)}</p>
          <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span>📅 ${formatDate(m.Data)}</span>
            ${m.Autor ? `<span>👤 ${m.Autor}</span>` : ''}
            ${m.SiglaComissao ? `<span>🏛️ ${m.SiglaComissao}</span>` : ''}
          </div>
        </div>
        <div class="shrink-0">
          <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>`;
}

function bindEvents() {
  // Card clicks
  document.querySelectorAll('.bill-card[data-id]').forEach(el => {
    el.addEventListener('click', () => openDetalhe(el.dataset.id, el.dataset.source || 'camara'));
  });

  // Filter button
  document.getElementById('btn-filter')?.addEventListener('click', applyFilters);
  document.getElementById('btn-clear')?.addEventListener('click', () => {
    renderProposicoes({ source: currentSource });
  });

  // Pagination
  document.getElementById('btn-prev')?.addEventListener('click', () => {
    renderProposicoes({ ...currentFilters, page: currentPage - 1 });
  });
  document.getElementById('btn-next')?.addEventListener('click', () => {
    renderProposicoes({ ...currentFilters, page: currentPage + 1 });
  });
  document.getElementById('btn-next2')?.addEventListener('click', () => {
    renderProposicoes({ ...currentFilters, page: currentPage + 1 });
  });

  // Enter on keyword input
  document.getElementById('filter-keywords')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') applyFilters();
  });
}

function applyFilters() {
  const tipo = document.getElementById('filter-tipo')?.value;
  const ano = document.getElementById('filter-ano')?.value;
  const tema = document.getElementById('filter-tema')?.value;
  const kw = document.getElementById('filter-keywords')?.value;
  renderProposicoes({
    source: currentSource,
    ...(tipo ? { tipo } : {}),
    ...(ano ? { ano } : {}),
    ...(tema ? { codTema: tema } : {}),
    ...(kw ? { keywords: kw } : {}),
  });
}

window.__setSource = (src) => {
  currentSource = src;
  renderProposicoes({ source: src });
};

function skeletonList() {
  return `<div class="space-y-3">${Array(6).fill('<div class="skeleton h-24 rounded-xl"></div>').join('')}</div>`;
}

function errorHTML(msg) {
  return `<div class="flex flex-col items-center py-20 text-center">
    <div class="text-3xl mb-3">⚠️</div>
    <p class="text-sm text-gray-600">${msg}</p>
    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Tentar novamente</button>
  </div>`;
}
