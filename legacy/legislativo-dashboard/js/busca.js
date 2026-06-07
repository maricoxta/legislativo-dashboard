import { camaraListProposicoes, senadoListMaterias } from './api.js';
import { getStatusClass, CAMARA_TEMAS, TIPO_SIGLAS } from './config.js';
import { formatDate, truncate, showLoading, hideLoading, debounce } from './utils.js';
import { openDetalhe } from './detalhe.js';

export async function renderBusca(params = {}) {
  const app = document.getElementById('app');
  app.innerHTML = buscaHTML(params);
  bindBuscaEvents();

  if (params.q) {
    await doSearch(params.q, params);
  }
}

function buscaHTML(params) {
  return `
    <div class="space-y-6">
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-1">Busca Avançada de Proposições</h2>
        <p class="text-sm text-gray-500 mb-5">Pesquise nas bases de dados da Câmara dos Deputados e do Senado Federal</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Palavras-chave / Ementa</label>
            <div class="relative">
              <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="busca-q" value="${params.q||''}" placeholder="ex: reforma tributária, educação básica, saúde pública..." class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Tipo de Proposição</label>
            <select id="busca-tipo" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos os tipos</option>
              ${Object.entries(TIPO_SIGLAS).map(([k,v])=>`<option value="${k}" ${params.tipo===k?'selected':''}>${k} – ${v}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Ano de Apresentação</label>
            <select id="busca-ano" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos os anos</option>
              ${[2026,2025,2024,2023,2022,2021,2020,2019,2018].map(y=>`<option ${params.ano==y?'selected':''}>${y}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Tema (Câmara)</label>
            <select id="busca-tema" class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos os temas</option>
              ${CAMARA_TEMAS.map(t=>`<option value="${t.cod}" ${params.codTema==t.cod?'selected':''}>${t.emoji} ${t.nome}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Buscar em</label>
            <div class="flex gap-3 items-center mt-1">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="busca-camara" checked class="rounded"> Câmara
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" id="busca-senado" ${params.senado?'checked':''} class="rounded"> Senado
              </label>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button id="btn-buscar" class="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Buscar
          </button>
          <button id="btn-limpar" class="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            Limpar
          </button>
        </div>
      </div>

      <div id="busca-results"></div>

      <!-- Tips -->
      ${!params.q ? `
      <div class="bg-blue-50 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-blue-700 mb-3">💡 Dicas de pesquisa</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${['reforma tributária','saúde mental','educação básica','meio ambiente','previdência','habitação','segurança pública','tecnologia'].map(term=>`
            <button class="term-hint text-xs bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left" data-term="${term}">${term}</button>`).join('')}
        </div>
      </div>` : ''}
    </div>
  `;
}

async function doSearch(q, params) {
  const resultsEl = document.getElementById('busca-results');
  if (!resultsEl) return;

  resultsEl.innerHTML = `<div class="space-y-3">${Array(4).fill('<div class="skeleton h-24 rounded-xl"></div>').join('')}</div>`;
  showLoading(`Buscando "${q}"...`);

  try {
    const queryParams = {
      keywords: q,
      itens: 20,
      ordem: 'DESC',
      ordenarPor: 'dataApresentacao',
      ...(params.tipo ? { siglaTipo: params.tipo } : {}),
      ...(params.ano ? { ano: params.ano } : {}),
      ...(params.codTema ? { codTema: params.codTema } : {}),
    };

    const [camaraRes, senadoRes] = await Promise.allSettled([
      document.getElementById('busca-camara')?.checked ? camaraListProposicoes(queryParams) : Promise.resolve({ dados: [] }),
      document.getElementById('busca-senado')?.checked ? senadoListMaterias({ ementa: q, qtdItens: 10, ...(params.ano?{ano:params.ano}:{}) }) : Promise.resolve([]),
    ]);

    const camaraBills = camaraRes.value?.dados || [];
    const senadoBills = senadoRes.value || [];
    const total = camaraBills.length + senadoBills.length;

    if (total === 0) {
      resultsEl.innerHTML = `<div class="text-center py-12">
        <div class="text-3xl mb-3">🔍</div>
        <p class="text-gray-500 text-sm">Nenhuma proposição encontrada para "<strong>${q}</strong>"</p>
        <p class="text-xs text-gray-400 mt-1">Tente palavras diferentes ou remova alguns filtros.</p>
      </div>`;
      return;
    }

    resultsEl.innerHTML = `
      <div>
        <p class="text-sm text-gray-500 mb-3"><strong class="text-gray-800">${total}</strong> resultado(s) para "<em>${q}</em>"
          · ${camaraBills.length} na Câmara, ${senadoBills.length} no Senado
        </p>
        <div class="space-y-3">
          ${camaraBills.map(b => camaraCard(b)).join('')}
          ${senadoBills.map(m => senadoCard(m)).join('')}
        </div>
      </div>`;

    resultsEl.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => openDetalhe(el.dataset.id, el.dataset.source));
    });
  } catch (err) {
    resultsEl.innerHTML = `<div class="text-sm text-red-500 text-center py-8">Erro: ${err.message}</div>`;
  } finally {
    hideLoading();
  }
}

function camaraCard(b) {
  const sit = b.statusProposicao?.descricaoSituacao || 'Em tramitação';
  return `
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" data-id="${b.id}" data-source="camara">
      <div class="flex items-start gap-3">
        <div class="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg text-center min-w-[72px]">
          <div>${b.siglaTipo}</div><div class="font-normal">${b.numero}/${b.ano}</div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex gap-2 mb-1.5">
            <span class="status-badge ${getStatusClass(sit)}">${truncate(sit, 28)}</span>
            <span class="text-xs text-gray-400">Câmara</span>
          </div>
          <p class="text-sm text-gray-800 leading-snug">${truncate(b.ementa, 200)}</p>
          <p class="text-xs text-gray-400 mt-1.5">📅 ${formatDate(b.dataApresentacao)} · ${b.statusProposicao?.siglaOrgao||''}</p>
        </div>
      </div>
    </div>`;
}

function senadoCard(m) {
  return `
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" data-id="${m.Codigo}" data-source="senado">
      <div class="flex items-start gap-3">
        <div class="shrink-0 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1.5 rounded-lg text-center min-w-[72px]">
          <div>${m.Sigla||'PL'}</div><div class="font-normal">${m.Numero||'—'}/${m.Ano||'—'}</div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex gap-2 mb-1.5">
            <span class="text-xs text-gray-400 font-medium">Senado Federal</span>
          </div>
          <p class="text-sm text-gray-800 leading-snug">${truncate(m.Ementa || '—', 200)}</p>
          <p class="text-xs text-gray-400 mt-1.5">📅 ${formatDate(m.Data)} · ${m.Autor||''}</p>
        </div>
      </div>
    </div>`;
}

function bindBuscaEvents() {
  document.getElementById('btn-buscar')?.addEventListener('click', () => {
    const q = document.getElementById('busca-q')?.value.trim();
    if (!q) return;
    const tipo = document.getElementById('busca-tipo')?.value;
    const ano = document.getElementById('busca-ano')?.value;
    const codTema = document.getElementById('busca-tema')?.value;
    const senado = document.getElementById('busca-senado')?.checked;
    doSearch(q, { q, tipo, ano, codTema, senado });
  });

  document.getElementById('btn-limpar')?.addEventListener('click', () => {
    renderBusca({});
  });

  document.getElementById('busca-q')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-buscar')?.click();
  });

  document.querySelectorAll('.term-hint').forEach(el => {
    el.addEventListener('click', () => {
      const term = el.dataset.term;
      const input = document.getElementById('busca-q');
      if (input) input.value = term;
      doSearch(term, { q: term });
    });
  });
}
