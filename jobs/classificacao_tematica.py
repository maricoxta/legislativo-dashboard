"""Classifica os PLs da Câmara e do Senado em temas e grava no Supabase.

Mesmo método do notebook analises/classificacao_tematica.py (TCC), rodando
como job de produção:

1. Coleta: baixa proposicoes-{ano}.csv (ementas) e proposicoesTemas-{ano}.csv
   (temas oficiais da Câmara) e lista os PLs do Senado pela API /processo.
2. Preparação: junta cada PL da Câmara com a ementa e os temas oficiais.
3. Pré-processamento: minúsculas, sem acento, sem número, sem palavras vazias.
4. Treino e avaliação: M1 (palavras-chave) e M2 (TF-IDF + Regressão
   Logística), com divisão temporal treino / validação / teste.
5. Aplicação: PLs da Câmara já indexados ficam com o tema oficial; os demais
   e todos os do Senado recebem os temas previstos pelo M2.

Grava em pl_temas (um registro por PL) e a avaliação em classificacao_avaliacao.

Uso: python jobs/classificacao_tematica.py
Variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import csv
import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, precision_recall_fscore_support, precision_score, recall_score
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer

from camara_situacao import base_supabase

ARQ_PROPOSICOES = "https://dadosabertos.camara.leg.br/arquivos/proposicoes/csv/proposicoes-{ano}.csv"
ARQ_TEMAS = "https://dadosabertos.camara.leg.br/arquivos/proposicoesTemas/csv/proposicoesTemas-{ano}.csv"
SENADO_PROCESSO = "https://legis.senado.leg.br/dadosabertos/processo"

# Divisão temporal relativa ao ano corrente. Em 2026: treino 2019–2023,
# validação 2024, teste 2025 (a mesma do artigo).
ANO = date.today().year
ANO_TESTE = ANO - 1
ANO_VALIDACAO = ANO - 2
ANOS_TREINO = list(range(ANO - 7, ANO - 2))
ANOS_APLICACAO = list(range(2023, ANO + 1))  # anos do seletor do dashboard
ANOS_CSV = sorted(set(ANOS_TREINO + [ANO_VALIDACAO, ANO_TESTE] + ANOS_APLICACAO))

MIN_EXEMPLOS_TREINO = 80  # temas com menos exemplos no treino não entram no modelo
GRADE_C = [0.5, 1, 2, 4, 8]
GRADE_LIMIAR = [round(x, 2) for x in np.arange(0.3, 0.95, 0.05)]
MODELO = "tfidf-logreg-v1"
LOTE = 500


# ---------------------------------------------------------------- coleta

def baixar_csv(url: str, tentativas: int = 4):
    for i in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "legislativo-dashboard-job"})
            with urllib.request.urlopen(req, timeout=300) as resp:
                conteudo = resp.read().decode("utf-8-sig")
            print(f"  {url.rsplit('/', 1)[-1]}: {len(conteudo) / 1e6:.1f} MB")
            return csv.DictReader(io.StringIO(conteudo), delimiter=";")
        except (urllib.error.URLError, TimeoutError) as e:
            if i == tentativas - 1:
                raise
            print(f"  falhou ({e}), tentando de novo")
            time.sleep(2 ** (i + 1))


def exigir(leitor, colunas):
    faltando = [c for c in colunas if c not in (leitor.fieldnames or [])]
    if faltando:
        sys.exit(f"Colunas ausentes no CSV: {faltando}\nCabeçalho recebido: {leitor.fieldnames}")


def pls_camara(anos):
    """id -> {ano, numero, ementa, data}: só PLs com ementa."""
    pls = {}
    for ano in anos:
        leitor = baixar_csv(ARQ_PROPOSICOES.format(ano=ano))
        exigir(leitor, ["id", "siglaTipo", "numero", "ano", "ementa", "dataApresentacao"])
        for l in leitor:
            ementa = (l["ementa"] or "").strip()
            if l["siglaTipo"].strip() != "PL" or not ementa or not l["id"].strip():
                continue
            pls[int(l["id"])] = {
                "ano": int(float(l["ano"])),
                "numero": int(float(l["numero"])) if l["numero"].strip() else None,
                "ementa": ementa,
                "data": (l["dataApresentacao"] or "")[:10] or None,
            }
    return pls


def temas_oficiais(anos, ids):
    """id -> temas oficiais, do mais para o menos relevante."""
    por_id: dict[int, dict[str, float]] = {}
    for ano in anos:
        leitor = baixar_csv(ARQ_TEMAS.format(ano=ano))
        exigir(leitor, ["uriProposicao", "tema", "relevancia"])
        for l in leitor:
            m = re.search(r"(\d+)$", l["uriProposicao"] or "")
            tema = (l["tema"] or "").strip()
            if not m or not tema or int(m.group(1)) not in ids:
                continue
            try:
                rel = float(l["relevancia"])
            except (TypeError, ValueError):
                rel = 0.0
            temas = por_id.setdefault(int(m.group(1)), {})
            temas[tema] = max(rel, temas.get(tema, rel))
    return {i: [t for t, _ in sorted(d.items(), key=lambda x: -x[1])] for i, d in por_id.items()}


def senado_janela(ini: date, fim: date):
    qs = urllib.parse.urlencode({"sigla": "PL", "dataInicioApresentacao": ini.isoformat(), "dataFimApresentacao": fim.isoformat()})
    req = urllib.request.Request(f"{SENADO_PROCESSO}?{qs}", headers={"Accept": "application/json", "User-Agent": "legislativo-dashboard-job"})
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                itens = json.load(resp) or []
            break
        except (urllib.error.URLError, TimeoutError):
            if i == 3:
                raise
            time.sleep(2 ** (i + 1))
    time.sleep(0.15)  # a API do Senado recusa mais de 10 requisições por segundo
    # Janela com 100 itens pode ter batido no teto da API: divide ao meio.
    if len(itens) >= 100 and fim > ini:
        meio = ini + timedelta(days=(fim - ini).days // 2)
        return senado_janela(ini, meio) + senado_janela(meio + timedelta(days=1), fim)
    return itens


def pls_senado(ano: int):
    vistos, ini = {}, date(ano, 1, 1)
    fim_ano = min(date(ano, 12, 31), date.today())
    while ini <= fim_ano:
        fim = min(ini + timedelta(days=6), fim_ano)
        for p in senado_janela(ini, fim):
            if p.get("ementa"):
                vistos[p["id"]] = p
        ini = fim + timedelta(days=1)
    return list(vistos.values())


# ------------------------------------------------------ pré-processamento

def normalizar(t: str) -> str:
    t = unicodedata.normalize("NFKD", (t or "").lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"\d+", " ", t)
    return re.sub(r"[^a-z\s]", " ", t)


STOP = set("""a o as os um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para com sem sob sobre
e ou que se ao aos a as ate entre como mais menos seu sua seus suas este esta estes estas esse essa isso
dispoe altera alteracao acrescenta revoga institui estabelece determina lei leis decreto n art arts artigo
paragrafo inciso caput outras providencias da dar fins redacao nova dispositivo dispositivos federal termos
""".split())


def limpar(t: str) -> str:
    return " ".join(w for w in normalizar(t).split() if w not in STOP and len(w) > 2)


# ----------------------------------------------- M1: regras por palavras-chave

# chave (trecho do nome do tema, sem acento) -> radicais procurados na ementa
DICIONARIO = {
    "administracao publica": ["servidor", "servidores", "concurso publico", "licitac", "administracao publica", "cargo publico", "orgao publico"],
    "agricultura": ["agricult", "agropecu", "pecuari", "pesca", "pescador", "rural", "agrotox", "safra", "agrari"],
    "cultura": ["cultur", "patrimonio historico", "artista", "museu", "cinema", "religi", "igreja", "templo"],
    "cidades": ["urban", "moradia", "habitac", "saneamento", "mobilidade urbana", "condominio", "imovel"],
    "ciencia": ["tecnolog", "inovac", "pesquisa cientif", "internet", "dados pessoais", "inteligencia artificial", "digital", "ciberne"],
    "comunicac": ["telecomunic", "radiodifus", "televis", "radio", "telefon", "imprensa", "jornalis"],
    "consumidor": ["consumidor", "fornecedor", "codigo de defesa do consumidor", "cobranca", "propaganda"],
    "defesa": ["forcas armadas", "militar", "exercito", "marinha", "aeronautica", "policia", "policial", "arma de fogo", "armas", "seguranca publica", "guarda municipal"],
    "penal": ["codigo penal", "crime", "crimes", "pena", "penas", "reclusao", "detencao", "processo penal", "execucao penal", "prisao", "presidio", "criminal"],
    "civil": ["codigo civil", "contrato", "casamento", "divorcio", "heranca", "adocao", "processo civil", "alimentos", "guarda compartilhada", "familia"],
    "direitos humanos": ["direitos humanos", "discrimin", "racis", "deficiencia", "idoso", "violencia domestica", "violencia contra a mulher", "mulheres", "crianca", "adolescente", "indigen", "quilombol", "lgbt"],
    "economia": ["economi", "empresa", "credito", "juros", "mercado", "banco central", "microempre", "financeir", "bancari"],
    "educac": ["educac", "ensino", "escola", "escolar", "estudant", "aluno", "universidad", "professor", "creche"],
    "energia": ["energia", "eletric", "petroleo", "gas natural", "combustiv", "minerac", "minerio", "recursos hidricos", "hidreletric"],
    "esporte": ["esport", "lazer", "atleta", "futebol", "olimpi"],
    "financas": ["orcament", "tribut", "imposto", "contribuic", "fiscal", "receita federal", "icms", "ipi", "renda", "isencao"],
    "homenage": ["denomina", "inscreve o nome", "livro dos herois", "dia nacional", "semana nacional", "comemorativ", "patrono", "capital nacional", "titulo de"],
    "industria": ["industri", "comerci", "franquia", "varejo", "servicos"],
    "meio ambiente": ["ambient", "florest", "desmatamento", "clima", "climatic", "poluic", "residuos solidos", "fauna", "flora", "sustentav", "animais"],
    "previdenc": ["previdenc", "aposentador", "assistencia social", "beneficio de prestacao continuada", "bolsa familia", "inss", "pensao"],
    "processo legislativo": ["processo legislativo", "regimento interno", "parlamentar", "congresso nacional", "medida provisoria"],
    "relacoes internacionais": ["internacional", "tratado", "comercio exterior", "estrangeir", "importac", "exportac", "mercosul"],
    "saude": ["saude", "sus", "medicament", "hospital", "doenc", "medic", "vacin", "sanitari", "farmac", "enfermag", "cancer"],
    "trabalho": ["trabalh", "emprego", "consolidacao das leis do trabalho", "salari", "sindic", "empregad", "jornada"],
    "turismo": ["turis"],
    "transporte": ["transito", "transporte", "rodovi", "veiculo", "ferrovi", "aviac", "aeroport", "habilitacao", "motorista", "estrada"],
    "eleic": ["eleic", "eleitoral", "partido politico", "partidos politicos", "candidat", "campanha eleitoral"],
    "constitucional": ["constituic", "emenda constitucional"],
    "justica": ["judiciario", "justica", "tribunal", "magistrad", "ministerio publico", "defensoria", "advogad", "cartorio"],
}


def padroes_m1(temas):
    padroes = {}
    for tema in temas:
        n = normalizar(tema)
        chave = next((c for c in DICIONARIO if c in n), None)  # a ordem resolve "Direito Penal" vs "Direito Civil"
        if chave:
            padroes[tema] = re.compile(r"\b(" + "|".join(map(re.escape, DICIONARIO[chave])) + ")")
    return padroes


def m1_prever(ementas, padroes):
    return [[t for t, p in padroes.items() if p.search(normalizar(e))] for e in ementas]


# --------------------------------------------- M2: TF-IDF + Regressão Logística

def novo_vetorizador():
    return TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_df=0.5, sublinear_tf=True)


def novo_modelo(C):
    return OneVsRestClassifier(LogisticRegression(C=C, class_weight="balanced", max_iter=2000), n_jobs=-1)


def decidir(prob, limiar):
    Y = (prob >= limiar).astype(int)
    Y[np.arange(len(Y)), prob.argmax(1)] = 1  # todo PL recebe ao menos o tema mais provável
    return Y


def metricas(Y, P, prob=None):
    m = {
        "precisao_micro": precision_score(Y, P, average="micro", zero_division=0),
        "recall_micro": recall_score(Y, P, average="micro", zero_division=0),
        "f1_micro": f1_score(Y, P, average="micro", zero_division=0),
        "f1_macro": f1_score(Y, P, average="macro", zero_division=0),
        "cobertura": float(np.mean(P.sum(1) > 0)),
    }
    if prob is not None:
        m["acerto_tema_principal"] = float(np.mean(Y[np.arange(len(Y)), prob.argmax(1)] == 1))
    return {k: round(float(v), 4) for k, v in m.items()}


def treinar_e_avaliar(pls, oficiais):
    rotulados = [(i, p) for i, p in pls.items() if oficiais.get(i)]
    treino = [(i, p) for i, p in rotulados if p["ano"] in ANOS_TREINO]
    valid = [(i, p) for i, p in rotulados if p["ano"] == ANO_VALIDACAO]
    teste = [(i, p) for i, p in rotulados if p["ano"] == ANO_TESTE]
    print(f"PLs rotulados: treino {len(treino)}, validação {len(valid)}, teste {len(teste)}")
    if min(len(treino), len(valid), len(teste)) == 0:
        sys.exit("Algum conjunto ficou vazio: confira os arquivos da Câmara.")

    contagem: dict[str, int] = {}
    for i, _ in treino:
        for t in oficiais[i]:
            contagem[t] = contagem.get(t, 0) + 1
    temas = sorted(t for t, n in contagem.items() if n >= MIN_EXEMPLOS_TREINO)
    print(f"{len(temas)} temas no modelo; fora por terem poucos exemplos: {sorted(set(contagem) - set(temas))}")

    mlb = MultiLabelBinarizer(classes=temas)
    rot = lambda conj: mlb.fit_transform([[t for t in oficiais[i] if t in temas] for i, _ in conj])
    txt = lambda conj: [limpar(p["ementa"]) for _, p in conj]
    Y_tr, Y_va, Y_te = rot(treino), rot(valid), rot(teste)

    # Escolha de C e do limiar na validação
    vet = novo_vetorizador()
    X_tr = vet.fit_transform(txt(treino))
    X_va = vet.transform(txt(valid))
    melhor = (-1.0, None, None)
    for C in GRADE_C:
        prob_va = novo_modelo(C).fit(X_tr, Y_tr).predict_proba(X_va)
        for limiar in GRADE_LIMIAR:
            f1 = f1_score(Y_va, decidir(prob_va, limiar), average="micro", zero_division=0)
            if f1 > melhor[0]:
                melhor = (f1, C, limiar)
    f1_val, C, limiar = melhor
    print(f"Validação: C={C}, limiar={limiar}, F1 micro={f1_val:.3f}")

    # Modelo para o teste: treino + validação, avaliado uma única vez
    vet = novo_vetorizador()
    X = vet.fit_transform(txt(treino) + txt(valid))
    modelo = novo_modelo(C).fit(X, np.vstack([Y_tr, Y_va]))
    prob_te = modelo.predict_proba(vet.transform(txt(teste)))
    pred_m2 = decidir(prob_te, limiar)
    padroes = padroes_m1(temas)
    pred_m1 = mlb.transform(m1_prever([p["ementa"] for _, p in teste], padroes))

    _, _, f1_m1, sup = precision_recall_fscore_support(Y_te, pred_m1, zero_division=0)
    _, _, f1_m2, _ = precision_recall_fscore_support(Y_te, pred_m2, zero_division=0)
    avaliacao = {
        "modelo": MODELO,
        "anos_treino": f"{ANOS_TREINO[0]}-{ANOS_TREINO[-1]}",
        "ano_validacao": ANO_VALIDACAO,
        "ano_teste": ANO_TESTE,
        "parametros": {"C": C, "limiar": limiar, "ngram": "1-2", "min_df": 3, "temas": len(temas),
                       "f1_micro_validacao": round(f1_val, 4), "pls_treino": len(treino),
                       "pls_validacao": len(valid), "pls_teste": len(teste)},
        "metricas": {"m1_palavras_chave": metricas(Y_te, pred_m1), "m2_tfidf_logreg": metricas(Y_te, pred_m2, prob_te)},
        "por_tema": [{"tema": t, "pls_teste": int(n), "f1_m1": round(float(a), 3), "f1_m2": round(float(b), 3)}
                     for t, n, a, b in sorted(zip(temas, sup, f1_m1, f1_m2), key=lambda x: -x[1])],
    }
    print("Teste:", json.dumps(avaliacao["metricas"], ensure_ascii=False))

    # Modelo de produção: todos os anos rotulados até o teste
    vet = novo_vetorizador()
    X = vet.fit_transform(txt(treino) + txt(valid) + txt(teste))
    modelo = novo_modelo(C).fit(X, np.vstack([Y_tr, Y_va, Y_te]))
    return vet, modelo, temas, limiar, avaliacao


# ------------------------------------------------------------- aplicação

def previstos(vet, modelo, temas, limiar, ementas):
    if not ementas:
        return []
    prob = modelo.predict_proba(vet.transform([limpar(e) for e in ementas]))
    saida = []
    for k, linha in enumerate(decidir(prob, limiar)):
        idx = sorted(np.where(linha)[0], key=lambda j: -prob[k, j])
        saida.append({temas[j]: round(float(prob[k, j]), 3) for j in idx})
    return saida


def registro(casa, id_, ano, identificacao, ementa, data, temas, probabilidades, origem, agora):
    return {
        "casa": casa, "id": id_, "ano": ano, "identificacao": identificacao, "ementa": ementa,
        "data_apresentacao": data, "temas": temas, "tema_principal": temas[0],
        "probabilidades": probabilidades, "origem": origem,
        "modelo": MODELO if origem == "modelo" else None, "classificado_em": agora,
    }


# ------------------------------------------------------------- Supabase

def supabase(metodo: str, caminho: str, corpo=None, prefer="return=minimal"):
    chave = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    req = urllib.request.Request(
        base_supabase() + "/rest/v1/" + caminho,
        data=json.dumps(corpo).encode() if corpo is not None else None,
        method=metodo,
        headers={"apikey": chave, "Authorization": f"Bearer {chave}",
                 "Content-Type": "application/json", "Prefer": prefer},
    )
    try:
        with urllib.request.urlopen(req, timeout=120):
            pass
    except urllib.error.HTTPError as e:
        sys.exit(f"Supabase respondeu {e.code} em {metodo} {caminho.split('?')[0]}: {e.read()[:500]!r}")


def gravar(casa, registros, inicio):
    for i in range(0, len(registros), LOTE):
        supabase("POST", "pl_temas?on_conflict=casa,id", registros[i : i + LOTE],
                 prefer="resolution=merge-duplicates,return=minimal")
    # Remove o que não foi reclassificado nesta execução (ex.: PL que saiu do arquivo).
    anos = ",".join(map(str, ANOS_APLICACAO))
    supabase("DELETE", f"pl_temas?casa=eq.{casa}&ano=in.({anos})&classificado_em=lt.{urllib.parse.quote(inicio)}")
    print(f"{len(registros)} PLs de {casa} gravados em pl_temas")


def main():
    inicio = datetime.now(timezone.utc).isoformat()
    print("Baixando arquivos da Câmara")
    pls = pls_camara(ANOS_CSV)
    oficiais = temas_oficiais(ANOS_CSV, set(pls))
    vet, modelo, temas, limiar, avaliacao = treinar_e_avaliar(pls, oficiais)

    # Câmara: tema oficial quando a Câmara já indexou; senão, o previsto.
    camara = [(i, p) for i, p in pls.items() if p["ano"] in ANOS_APLICACAO]
    sem_tema = [(i, p) for i, p in camara if not oficiais.get(i)]
    prev = dict(zip([i for i, _ in sem_tema], previstos(vet, modelo, temas, limiar, [p["ementa"] for _, p in sem_tema])))
    agora = datetime.now(timezone.utc).isoformat()
    reg_camara = []
    for i, p in camara:
        ident = f"PL {p['numero']}/{p['ano']}" if p["numero"] else None
        if oficiais.get(i):
            reg_camara.append(registro("camara", i, p["ano"], ident, p["ementa"], p["data"], oficiais[i], None, "oficial", agora))
        else:
            reg_camara.append(registro("camara", i, p["ano"], ident, p["ementa"], p["data"], list(prev[i]), prev[i], "modelo", agora))
    print(f"Câmara {ANOS_APLICACAO[0]}–{ANO}: {len(camara)} PLs, {len(sem_tema)} sem tema oficial (classificados pelo modelo)")
    gravar("camara", reg_camara, inicio)

    # Senado: não publica temas no padrão da Câmara; todos recebem o previsto.
    try:
        processos = [p for ano in ANOS_APLICACAO for p in pls_senado(ano)]
    except Exception as e:
        print(f"API do Senado indisponível ({e}); temas do Senado não foram atualizados")
        processos = []
    if processos:
        prev_s = previstos(vet, modelo, temas, limiar, [p["ementa"] for p in processos])
        agora = datetime.now(timezone.utc).isoformat()
        reg_senado = [registro("senado", p["id"], int((p.get("dataApresentacao") or str(ANO))[:4]), p.get("identificacao"),
                               p["ementa"], (p.get("dataApresentacao") or "")[:10] or None, list(t), t, "modelo", agora)
                      for p, t in zip(processos, prev_s)]
        print(f"Senado {ANOS_APLICACAO[0]}–{ANO}: {len(reg_senado)} PLs classificados pelo modelo")
        gravar("senado", reg_senado, inicio)

    supabase("POST", "classificacao_avaliacao", avaliacao)
    print("Avaliação gravada em classificacao_avaliacao")


if __name__ == "__main__":
    main()
