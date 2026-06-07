import { router } from './router.js';
import { renderDashboard } from './dashboard.js';
import { renderProposicoes } from './proposicoes.js';
import { renderBusca } from './busca.js';
import { closeDrawer } from './utils.js';
import { CAMARA_TEMAS } from './config.js';

// ── Sidebar: render Câmara themes dynamically ──────────────────────────────────
function buildSidebar() {
  const container = document.getElementById('camara-temas');
  if (!container) return;
  container.innerHTML = CAMARA_TEMAS.map(t => `
    <a href="#/camara/tema/${t.cod}" class="nav-link flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-300 text-xs">
      <span class="shrink-0">${t.emoji}</span>
      <span class="truncate">${t.nome}</span>
    </a>`).join('');
}

// ── Routes ─────────────────────────────────────────────────────────────────────
router
  .on('/', () => {
    document.getElementById('topbar-breadcrumb').textContent = '';
    renderDashboard();
  })
  .on('/busca', () => {
    document.getElementById('topbar-breadcrumb').textContent = 'Busca Avançada';
    renderBusca({});
  })
  .on('/busca/q/([^/]+)', ({ match }) => {
    const q = decodeURIComponent(match[1]);
    document.getElementById('topbar-breadcrumb').textContent = `Busca: "${q}"`;
    renderBusca({ q });
  })
  .on('/camara/PL', () => {
    document.getElementById('topbar-breadcrumb').textContent = 'Câmara – Projetos de Lei';
    renderProposicoes({ source: 'camara', tipo: 'PL' });
  })
  .on('/camara/PEC', () => {
    document.getElementById('topbar-breadcrumb').textContent = 'Câmara – Emendas Constitucionais';
    renderProposicoes({ source: 'camara', tipo: 'PEC' });
  })
  .on('/camara/MPV', () => {
    document.getElementById('topbar-breadcrumb').textContent = 'Câmara – Medidas Provisórias';
    renderProposicoes({ source: 'camara', tipo: 'MPV' });
  })
  .on('/camara/tema/([^/]+)', ({ match }) => {
    const codTema = match[1];
    const tema = CAMARA_TEMAS.find(t => String(t.cod) === String(codTema));
    document.getElementById('topbar-breadcrumb').textContent = `Câmara – ${tema?.nome || 'Tema'}`;
    renderProposicoes({ source: 'camara', codTema });
  })
  .on('/senado/PL', () => {
    document.getElementById('topbar-breadcrumb').textContent = 'Senado – Projetos de Lei';
    renderProposicoes({ source: 'senado', tipo: 'PL' });
  })
  .on('/senado/PEC', () => {
    document.getElementById('topbar-breadcrumb').textContent = 'Senado – Emendas Constitucionais';
    renderProposicoes({ source: 'senado', tipo: 'PEC' });
  })
  .on('/senado/MPV', () => {
    document.getElementById('topbar-breadcrumb').textContent = 'Senado – Medidas Provisórias';
    renderProposicoes({ source: 'senado', tipo: 'MPV' });
  });

// ── Global search ──────────────────────────────────────────────────────────────
document.getElementById('global-search')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (q) router.navigate(`/busca/q/${encodeURIComponent(q)}`);
  }
});

// ── Drawer close ───────────────────────────────────────────────────────────────
document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);
document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

// ── Boot ───────────────────────────────────────────────────────────────────────
buildSidebar();
router.start();
