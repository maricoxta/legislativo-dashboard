export function formatDate(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return str; }
}

export function formatDatetime(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return str; }
}

export function truncate(text, len = 160) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len).trimEnd() + '…' : text;
}

export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

export function showLoading(msg = 'Carregando...') {
  const el = document.getElementById('loading');
  const msgEl = document.getElementById('loading-msg');
  if (el) { el.classList.remove('hidden'); if (msgEl) msgEl.textContent = msg; }
}

export function hideLoading() {
  document.getElementById('loading')?.classList.add('hidden');
}

export function setApiStatus(ok) {
  const dot = document.getElementById('api-dot');
  const label = document.getElementById('api-label');
  if (!dot || !label) return;
  if (ok) {
    dot.className = 'w-2 h-2 rounded-full bg-green-400';
    label.textContent = 'API online';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-red-400';
    label.textContent = 'Erro na API';
  }
}

export function openDrawer(title) {
  const drawer = document.getElementById('drawer');
  const titleEl = document.getElementById('drawer-title');
  if (drawer) drawer.classList.remove('hidden');
  if (titleEl) titleEl.textContent = title;
  document.body.style.overflow = 'hidden';
}

export function closeDrawer() {
  document.getElementById('drawer')?.classList.add('hidden');
  document.body.style.overflow = '';
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

export function getYear() { return new Date().getFullYear(); }

export function pluralize(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function extractTipoFromSigla(sigla) {
  const map = {
    PL: 'Projeto de Lei', PEC: 'PEC', MPV: 'MP', PDL: 'PDL',
    PLN: 'PLN', PLV: 'PLV', MSC: 'Mensagem', REQ: 'Requerimento'
  };
  return map[sigla] || sigla;
}
