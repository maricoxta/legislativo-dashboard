import { CAMARA_API, SENADO_API } from './config.js';

const cache = new Map();

async function fetchJSON(url, opts = {}) {
  const key = url;
  if (cache.has(key)) return cache.get(key);

  const headers = { 'Accept': 'application/json', ...opts.headers };
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  cache.set(key, data);
  return data;
}

// ─── CÂMARA ───────────────────────────────────────────────────────────────────

export async function camaraListProposicoes(params = {}) {
  const defaults = {
    itens: 20,
    ordem: 'DESC',
    ordenarPor: 'dataApresentacao',
    ...params
  };
  const qs = new URLSearchParams(defaults).toString();
  return fetchJSON(`${CAMARA_API}/proposicoes?${qs}`);
}

export async function camaraGetProposicao(id) {
  const data = await fetchJSON(`${CAMARA_API}/proposicoes/${id}`);
  return data.dados;
}

export async function camaraGetTramitacoes(id) {
  const data = await fetchJSON(`${CAMARA_API}/proposicoes/${id}/tramitacoes?ordem=DESC`);
  return data.dados || [];
}

export async function camaraGetRelatores(id) {
  try {
    const data = await fetchJSON(`${CAMARA_API}/proposicoes/${id}/relatores`);
    return data.dados || [];
  } catch { return []; }
}

export async function camaraGetVotacoes(id) {
  try {
    const data = await fetchJSON(`${CAMARA_API}/proposicoes/${id}/votacoes`);
    return data.dados || [];
  } catch { return []; }
}

export async function camaraGetAutores(id) {
  try {
    const data = await fetchJSON(`${CAMARA_API}/proposicoes/${id}/autores`);
    return data.dados || [];
  } catch { return []; }
}

export async function camaraGetTemas() {
  try {
    const data = await fetchJSON(`${CAMARA_API}/referencias/proposicoes/temas`);
    return data.dados || [];
  } catch { return []; }
}

export async function camaraGetSituacoes() {
  try {
    const data = await fetchJSON(`${CAMARA_API}/referencias/proposicoes/situacoes`);
    return data.dados || [];
  } catch { return []; }
}

export async function camaraGetTipos() {
  try {
    const data = await fetchJSON(`${CAMARA_API}/referencias/proposicoes/tipos`);
    return data.dados || [];
  } catch { return []; }
}

export async function camaraListByTema(codTema, params = {}) {
  return camaraListProposicoes({ codTema, siglaTipo: 'PL', ...params });
}

export async function camaraSearch(keywords, params = {}) {
  return camaraListProposicoes({ keywords, ...params });
}

export async function camaraGetDeputado(uri) {
  try {
    const data = await fetchJSON(uri);
    return data.dados;
  } catch { return null; }
}

// Fetch multiple pages to aggregate statistics
export async function camaraAggregateStats(ano = new Date().getFullYear()) {
  const siglasToFetch = ['PL', 'PEC', 'MPV'];
  const results = await Promise.allSettled(
    siglasToFetch.map(sigla =>
      fetchJSON(`${CAMARA_API}/proposicoes?siglaTipo=${sigla}&ano=${ano}&itens=1`)
    )
  );
  return results.map((r, i) => ({
    sigla: siglasToFetch[i],
    total: r.status === 'fulfilled' ? (r.value.links?.find(l => l.rel === 'last')
      ? parseInt(new URLSearchParams(new URL(r.value.links.find(l=>l.rel==='last').href).search).get('pagina') || '1') *
        parseInt(new URLSearchParams(new URL(r.value.links.find(l=>l.rel==='last').href).search).get('itens') || '1')
      : r.value.dados?.length || 0) : 0
  }));
}

// ─── SENADO ───────────────────────────────────────────────────────────────────

export async function senadoListMaterias(params = {}) {
  const { ano = new Date().getFullYear(), qtdItens = 20, ...rest } = params;
  const safeParams = { ano, qtdItens };
  if (rest.codigoTipoMateria) safeParams.codigoTipoMateria = rest.codigoTipoMateria;
  const qs = new URLSearchParams(safeParams).toString();
  try {
    const data = await fetchJSON(`${SENADO_API}/materia/pesquisa/lista?${qs}`);
    const materias = data?.PesquisaBasicaMateria?.Materias?.Materia || [];
    return Array.isArray(materias) ? materias : (materias ? [materias] : []);
  } catch { return []; }
}

export async function senadoGetMateria(codigo) {
  try {
    const data = await fetchJSON(`${SENADO_API}/materia/${codigo}`);
    return data?.DetalheMateria?.Materia || null;
  } catch { return null; }
}

export async function senadoGetTramitacao(codigo) {
  try {
    const data = await fetchJSON(`${SENADO_API}/materia/${codigo}/tramitacao`);
    const tram = data?.MovimentacaoMateria?.Materia?.HistoricoSituacoes?.HistoricoSituacao || [];
    return Array.isArray(tram) ? tram : [tram];
  } catch { return []; }
}

export async function senadoGetComissoes(codigo) {
  try {
    const data = await fetchJSON(`${SENADO_API}/materia/${codigo}/comissoes`);
    const com = data?.MateriaComissoes?.Comissoes?.Comissao || [];
    return Array.isArray(com) ? com : [com];
  } catch { return []; }
}

export async function senadoGetRelatorias(codigo) {
  try {
    const data = await fetchJSON(`${SENADO_API}/materia/${codigo}/relatorias`);
    const rel = data?.RelatoriaMateria?.Materia?.Relatorias?.Relatoria || [];
    return Array.isArray(rel) ? rel : [rel];
  } catch { return []; }
}

export async function senadoGetVotacoes(codigo) {
  try {
    const data = await fetchJSON(`${SENADO_API}/materia/${codigo}/votacoes`);
    const vot = data?.VotacaoMateria?.Votacoes?.Votacao || [];
    return Array.isArray(vot) ? vot : [vot];
  } catch { return []; }
}

export async function senadoGetTextos(codigo) {
  try {
    const data = await fetchJSON(`${SENADO_API}/materia/${codigo}/textos`);
    const tex = data?.TextoMateria?.Materia?.Textos?.Texto || [];
    return Array.isArray(tex) ? tex : [tex];
  } catch { return []; }
}

export function clearCache() { cache.clear(); }
