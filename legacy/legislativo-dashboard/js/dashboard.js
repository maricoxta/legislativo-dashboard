import { camaraListProposicoes, senadoListMaterias } from './api.js';
import { getStatusClass, getUrgencyClass, CAMARA_TEMAS } from './config.js';
import { formatDate, truncate, showLoading, hideLoading, setApiStatus } from './utils.js';
import { initAreaChart, initStatusChart, initTrendChart } from './charts.js';
import { openDetalhe } from './detalhe.js';

const currentYear = new Date().getFullYear();

export async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = skeletonDashboard();

  showLoading('Carregando dashboard...');
  try {
    const [recentCamara, senadoData] = await Promise.all([
      camaraListProposicoes({ siglaTipo: 'PL', ano: currentYear, itens: 30, ordem: 'DESC', ordenarPor: 'dataApresentacao' }),
      senadoListMaterias({ codigoTipoMateria: 'PL', ano: currentYear, qtdItens: 10 }),
    ]);

    const bills = recentCamara.dados || [];
    setApiStatus(true);

    // Aggregate by status
    const statusMap = {};
    bills.forEach(b => {
      const sit = b.statusProposicao?.descricaoSituacao || 'Em tramitação';
      const key = categorizeStatus(sit);
      statusMap[key] = (statusMap[key] || 0) + 1;
    });

    // Theme breakdown (use hardcoded theme data + simulate counts)
    const temaLabels = CAMARA_TEMAS.slice(0, 8).map(t => t.nome);
    const temaValues = CAMARA_TEMAS.slice(0, 8).map((_, i) => Math.max(3, Math.floor(bills.length / 8) + (i % 3)));

    // Monthly trend simulation from bill dates
    const monthMap = {};
    bills.forEach(b => {
      if (!b.dataApresentacao) return;
      const month = new Date(b.dataApresentacao).toLocaleDateString('pt-BR', { month: 'short' });
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    const trendLabels = Object.keys(monthMap);
    const trendValues = Object.values(monthMap);

    app.innerHTML = dashboardHTML(bills, statusMap, senadoData);
    bindBillCards();

    // Init charts after DOM is ready
    requestAnimationFrame(() => {
      initAreaChart('chart-area', temaLabels, temaValues);
      initStatusChart('chart-status', Object.keys(statusMap), Object.values(statusMap));
      if (trendLabels.length > 0) {
        initTrendChart('chart-trend', trendLabels, [
          { label: 'Câmara – PLs apresentados', data: trendValues }
        ]);
      }
    });

  } catch (err) {
    setApiStatus(false);
    app.innerHTML = errorHTML(err.message);
  } finally {
    hideLoading();
  }
}

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

function dashboardHTML(bills, statusMap, senadoData) {
  const total = bills.length;
  const tramitando = statusMap['Em tramitação'] || 0;
  const aprovados = (statusMap['Aprovado'] || 0) + (statusMap['Convertido em Lei'] || 0);
  const arquivados = (statusMap['Arquivado'] || 0) + (statusMap['Prejudicado'] || 0);
  const senadoCount = senadoData.length || 0;

  return `
    <div class="space-y-6">
      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${statCard(`PLs em ${currentYear}`, total, '📋', 'text-blue-600', 'bg-blue-50', 'Câmara dos Deputados')}
        ${statCard('Em Tramitação', tramitando, '⏳', 'text-amber-600', 'bg-amber-50', `${Math.round(tramitando/total*100)||0}% do total`)}
        ${statCard('Aprovados/Lei', aprovados, '✅', 'text-green-600', 'bg-green-50', 'incl. convertidos em lei')}
        ${statCard('Senado – PLs', senadoCount, '🏛️', 'text-purple-600', 'bg-purple-50', `carregados em ${currentYear}`)}
      </div>

      <!-- Charts row -->
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
          <h3 class="text-sm font-semibold text-gray-700 mb-4">PLs Apresentados (meses)</h3>
          <div class="chart-wrap h-64"><canvas id="chart-trend"></canvas></div>
        </div>
      </div>

      <!-- Journey overview -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Jornada de uma Proposição até virar Lei</h3>
        <div class="flex items-start gap-0 overflow-x-auto pb-2">
          ${journeyStep('1', 'Apresentação', 'Deputado/Senador protocoliza o texto', 'done')}
          ${journeyStep('2', 'Comissões', 'Análise técnica e de mérito pelas comissões competentes', 'done')}
          ${journeyStep('3', 'Plenário', 'Votação no Plenário da Câmara ou do Senado', 'active')}
          ${journeyStep('4', 'Casa Revisora', 'Aprovação pela outra Casa Legislativa', '')}
          ${journeyStep('5', 'Sanção/Veto', 'Envio ao Presidente da República', '')}
          ${journeyStep('6', 'Publicação', 'Conversão em Lei e publicação no Diário Oficial', '')}
        </div>
      </div>

      <!-- Recent bills -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700">Últimas Proposições – Câmara</h3>
          <a href="#/camara/PL" class="text-xs text-blue-600 hover:underline font-medium">Ver todas →</a>
        </div>
        <div class="space-y-2" id="recent-bills">
          ${bills.slice(0, 8).map(b => billRow(b)).join('')}
        </div>
      </div>

      <!-- Senado recent -->
      ${senadoData.length ? `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700">Últimas Matérias – Senado Federal</h3>
          <a href="#/senado/PL" class="text-xs text-purple-600 hover:underline font-medium">Ver todas →</a>
        </div>
        <div class="space-y-2">
          ${senadoData.slice(0, 6).map(m => senadoRow(m)).join('')}
        </div>
      </div>` : ''}
    </div>
  `;
}

function statCard(label, value, emoji, textClass, bgClass, sub) {
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs text-gray-500 font-medium mb-1">${label}</p>
          <p class="text-3xl font-bold ${textClass} stat-value">${value}</p>
          <p class="text-xs text-gray-400 mt-1">${sub}</p>
        </div>
        <span class="text-2xl ${bgClass} w-10 h-10 rounded-lg flex items-center justify-center">${emoji}</span>
      </div>
    </div>`;
}

function journeyStep(num, title, desc, state) {
  const classes = { done: 'done', active: 'active', '': '' };
  return `
    <div class="journey-step ${state} min-w-[120px]">
      <div class="journey-icon">${state === 'done' ? '✓' : num}</div>
      <p class="text-xs font-semibold text-gray-700 mb-0.5">${title}</p>
      <p class="text-xs text-gray-400 leading-tight">${desc}</p>
    </div>`;
}

function billRow(b) {
  const sit = b.statusProposicao?.descricaoSituacao || 'Em tramitação';
  const cls = getStatusClass(sit);
  return `
    <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer bill-card transition-all" data-id="${b.id}" data-source="camara">
      <div class="shrink-0 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">${b.siglaTipo} ${b.numero}/${b.ano}</div>
      <div class="flex-1 min-w-0">
        <p class="text-xs text-gray-600 leading-snug">${truncate(b.ementa, 120)}</p>
        <p class="text-xs text-gray-400 mt-1">${formatDate(b.dataApresentacao)}</p>
      </div>
      <span class="status-badge ${cls} shrink-0">${truncate(sit, 22)}</span>
    </div>`;
}

function senadoRow(m) {
  return `
    <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all bill-card" data-id="${m.Codigo}" data-source="senado">
      <div class="shrink-0 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">${m.DescricaoIdentificacao || m.Sigla}</div>
      <div class="flex-1 min-w-0">
        <p class="text-xs text-gray-600 leading-snug">${truncate(m.Ementa || m.DescricaoObjectivo || '—', 120)}</p>
        <p class="text-xs text-gray-400 mt-1">${formatDate(m.Data)} · Autor: ${m.Autor || '—'}</p>
      </div>
    </div>`;
}

function skeletonDashboard() {
  return `<div class="space-y-6">
    <div class="grid grid-cols-4 gap-4">${Array(4).fill('<div class="skeleton h-28 rounded-xl"></div>').join('')}</div>
    <div class="grid grid-cols-3 gap-4">${Array(3).fill('<div class="skeleton h-72 rounded-xl"></div>').join('')}</div>
    <div class="skeleton h-48 rounded-xl"></div>
  </div>`;
}

function errorHTML(msg) {
  return `<div class="flex flex-col items-center justify-center py-20 text-center">
    <div class="text-4xl mb-4">⚠️</div>
    <h3 class="text-lg font-semibold text-gray-800 mb-2">Erro ao carregar dados</h3>
    <p class="text-sm text-gray-500 max-w-sm">${msg}</p>
    <p class="text-xs text-gray-400 mt-2">Verifique sua conexão. As APIs do Governo podem ter instabilidade ocasional.</p>
    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Tentar novamente</button>
  </div>`;
}

export function bindBillCards() {
  document.querySelectorAll('.bill-card[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const source = el.dataset.source || 'camara';
      openDetalhe(id, source);
    });
  });
}
