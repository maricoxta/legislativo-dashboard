# Databricks notebook source
# MAGIC %md
# MAGIC # Classificação temática dos projetos de lei — Legislativo BR
# MAGIC
# MAGIC **Objetivo:** escolher e medir o método que classifica os projetos de lei (PLs) em temas.
# MAGIC
# MAGIC **Gabarito:** a própria Câmara indexa cada proposição em temas oficiais (arquivo `proposicoesTemas-{ano}.csv`).
# MAGIC Esses rótulos servem de "resposta certa" para medir dois métodos:
# MAGIC
# MAGIC | Método | Como funciona |
# MAGIC |---|---|
# MAGIC | **M1 – Regras por palavras-chave** | Um dicionário de radicais por tema; o PL recebe o tema se a ementa contém algum radical. É o que o site faz hoje no Monitoramento. |
# MAGIC | **M2 – TF-IDF + Regressão Logística** | Aprendizado de máquina supervisionado: transforma a ementa em vetor TF-IDF (palavras e pares de palavras) e treina um classificador por tema (one-vs-rest). |
# MAGIC
# MAGIC **Divisão temporal** (simula o uso real: treina no passado, prevê o futuro): treino 2019–2023, validação 2024, teste 2025.
# MAGIC
# MAGIC **Arquitetura medalhão** no Unity Catalog: `bronze` (arquivos crus) → `silver` (PLs com ementa e temas) → `gold` (temas previstos para Câmara e Senado).
# MAGIC
# MAGIC **Como rodar (Databricks Free Edition):** importe este arquivo em *Workspace → Import*, conecte em *Serverless* e rode *Run all*.
# MAGIC No fim, a célula **Resumo** imprime os números para o artigo.

# COMMAND ----------

# MAGIC %pip install -q scikit-learn
# MAGIC %restart_python

# COMMAND ----------

# Configuração
CATALOGO = "workspace"
SCHEMA = "legislativo"
VOLUME = f"/Volumes/{CATALOGO}/{SCHEMA}/brutos"

ANOS_TREINO = [2019, 2020, 2021, 2022, 2023]
ANO_VALIDACAO = 2024
ANO_TESTE = 2025
ANOS_APLICACAO = [2025, 2026]  # anos que recebem temas previstos (Câmara e Senado)
ANOS = sorted(set(ANOS_TREINO + [ANO_VALIDACAO, ANO_TESTE] + ANOS_APLICACAO))

MIN_EXEMPLOS_TREINO = 80  # temas com menos exemplos no treino ficam fora da avaliação
VERSAO_MODELO = "tfidf-logreg-v1"

spark.sql(f"CREATE SCHEMA IF NOT EXISTS {CATALOGO}.{SCHEMA}")
spark.sql(f"CREATE VOLUME IF NOT EXISTS {CATALOGO}.{SCHEMA}.brutos")
spark.sql(f"USE {CATALOGO}.{SCHEMA}")
print("Tabelas e arquivos em", f"{CATALOGO}.{SCHEMA}", "|", VOLUME)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1. Bronze — baixar os arquivos da Câmara para o Volume
# MAGIC Se o download falhar (rede bloqueada), baixe os CSVs no seu computador pelos links impressos
# MAGIC e envie para o Volume em *Catalog → workspace → legislativo → brutos → Upload*. Depois rode de novo.

# COMMAND ----------

import os, time, requests

URLS = {
    "proposicoes": "https://dadosabertos.camara.leg.br/arquivos/proposicoes/csv/proposicoes-{ano}.csv",
    "proposicoesTemas": "https://dadosabertos.camara.leg.br/arquivos/proposicoesTemas/csv/proposicoesTemas-{ano}.csv",
}

def baixar(url: str, destino: str, tentativas: int = 4):
    if os.path.exists(destino) and os.path.getsize(destino) > 0:
        return "já existe"
    for i in range(tentativas):
        try:
            r = requests.get(url, timeout=300, headers={"User-Agent": "legislativo-br-tcc"})
            r.raise_for_status()
            with open(destino, "wb") as f:
                f.write(r.content)
            return f"{len(r.content)/1e6:.1f} MB"
        except Exception as e:
            erro = e
            time.sleep(2 ** (i + 1))
    return f"FALHOU ({erro}) — baixe manualmente: {url}"

for ano in ANOS:
    for nome, url in URLS.items():
        arq = f"{VOLUME}/{nome}-{ano}.csv"
        print(nome, ano, "→", baixar(url.format(ano=ano), arq))

# COMMAND ----------

from pyspark.sql import functions as F

def ler_csv(padrao: str):
    return (spark.read.option("header", True).option("sep", ";").option("quote", '"').option("escape", '"')
            .option("multiLine", True).option("encoding", "UTF-8").csv(padrao)
            .withColumn("arquivo", F.col("_metadata.file_name")))

bronze_prop = ler_csv(f"{VOLUME}/proposicoes-*.csv")
bronze_temas = ler_csv(f"{VOLUME}/proposicoesTemas-*.csv")
print("Colunas proposicoes:", bronze_prop.columns[:15], "...")
print("Colunas temas:", bronze_temas.columns)

bronze_prop.write.mode("overwrite").option("overwriteSchema", True).saveAsTable("bronze_camara_proposicoes")
bronze_temas.write.mode("overwrite").option("overwriteSchema", True).saveAsTable("bronze_camara_proposicoes_temas")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2. Silver — PLs com ementa e lista de temas oficiais

# COMMAND ----------

pls = (spark.table("bronze_camara_proposicoes")
       .where((F.col("siglaTipo") == "PL") & F.col("ementa").isNotNull())
       .select(F.col("id").cast("long").alias("id"), F.col("ano").cast("int").alias("ano"),
               F.trim("ementa").alias("ementa"), F.col("dataApresentacao").alias("data_apresentacao"))
       .where(F.col("ano").isin(ANOS))
       .dropDuplicates(["id"]))

temas = (spark.table("bronze_camara_proposicoes_temas")
         .withColumn("id", F.regexp_extract("uriProposicao", r"(\d+)$", 1).cast("long"))
         .select("id", F.trim("tema").alias("tema"),
                 F.col("relevancia").cast("double").alias("relevancia"))
         .where(F.col("tema").isNotNull())
         .dropDuplicates(["id", "tema"]))

temas_por_pl = (temas.groupBy("id")
                .agg(F.sort_array(F.collect_list(F.struct(-F.col("relevancia"), "tema"))).alias("ordenados"))
                .select("id", F.col("ordenados.tema").alias("temas")))

silver = (pls.join(temas_por_pl, "id", "left")
          .withColumn("temas", F.coalesce("temas", F.array().cast("array<string>")))
          .withColumn("tema_principal", F.element_at("temas", 1)))
silver.write.mode("overwrite").option("overwriteSchema", True).saveAsTable("silver_camara_pl_temas")

display(spark.table("silver_camara_pl_temas")
        .groupBy("ano").agg(F.count("*").alias("pls"),
                            F.round(100 * F.avg((F.size("temas") > 0).cast("int")), 1).alias("pct_com_tema"),
                            F.round(F.avg(F.when(F.size("temas") > 0, F.size("temas"))), 2).alias("temas_por_pl"))
        .orderBy("ano"))

# COMMAND ----------

import pandas as pd, numpy as np

df = spark.table("silver_camara_pl_temas").toPandas()
df["temas"] = df.temas.map(list)
rotulados = df[df.temas.map(len) > 0].copy()
treino = rotulados[rotulados.ano.isin(ANOS_TREINO)]
valid = rotulados[rotulados.ano == ANO_VALIDACAO]
teste = rotulados[rotulados.ano == ANO_TESTE]

contagem = treino.explode("temas").temas.value_counts()
TEMAS = sorted(contagem[contagem >= MIN_EXEMPLOS_TREINO].index)
fora = contagem[contagem < MIN_EXEMPLOS_TREINO]
print(f"PLs rotulados — treino {len(treino)}, validação {len(valid)}, teste {len(teste)}")
print(f"{len(TEMAS)} temas avaliados; {len(fora)} temas raros ficaram de fora: {list(fora.index)}")
display(contagem.rename("pls_no_treino").reset_index().rename(columns={"index": "tema"}))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3. Pré-processamento do texto
# MAGIC Minúsculas, sem acentos e sem números; remove palavras vazias do português e expressões que aparecem em quase toda ementa
# MAGIC ("dispõe sobre", "altera a Lei nº", "dá outras providências"), que não ajudam a separar temas.

# COMMAND ----------

import re, unicodedata

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

for d in (treino, valid, teste):
    d["texto"] = d.ementa.map(limpar)
print(treino[["ementa", "texto"]].head(3).to_string())

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4. M1 — Regras por palavras-chave
# MAGIC Cada tema oficial é ligado a uma lista de radicais. A ligação é feita pelo nome do tema (a célula imprime o de-para).
# MAGIC Temas sem dicionário nunca são previstos por este método, o que derruba o recall dele — isso faz parte do resultado.

# COMMAND ----------

# chave (trecho do nome do tema, sem acento) → radicais procurados na ementa
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

def chave_do_tema(tema: str):
    n = normalizar(tema)
    for chave in DICIONARIO:  # a ordem do dicionário resolve casos como "Direito Penal" vs "Direito Civil"
        if chave in n:
            return chave
    return None

DE_PARA = {t: chave_do_tema(t) for t in TEMAS}
display(pd.DataFrame({"tema_oficial": list(DE_PARA), "chave_dicionario": list(DE_PARA.values())}))
sem_dicionario = [t for t, c in DE_PARA.items() if c is None]
print("Temas sem dicionário (M1 nunca prevê):", sem_dicionario)

PADROES = {t: re.compile(r"\b(" + "|".join(map(re.escape, DICIONARIO[c])) + ")") for t, c in DE_PARA.items() if c}

def m1_prever(ementas):
    saida = []
    for e in ementas:
        n = normalizar(e)
        saida.append([t for t, p in PADROES.items() if p.search(n)])
    return saida

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5. M2 — TF-IDF + Regressão Logística (one-vs-rest)
# MAGIC Hiperparâmetros (força de regularização `C` e limiar de decisão) escolhidos na **validação 2024**; o **teste 2025** só é usado uma vez, no fim.
# MAGIC Todo PL recebe pelo menos o tema mais provável, mesmo abaixo do limiar.

# COMMAND ----------

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics import f1_score, precision_score, recall_score, hamming_loss, precision_recall_fscore_support

mlb = MultiLabelBinarizer(classes=TEMAS)
filtrar = lambda listas: [[t for t in l if t in TEMAS] for l in listas]
Y_tr = mlb.fit_transform(filtrar(treino.temas))
Y_va = mlb.transform(filtrar(valid.temas))
Y_te = mlb.transform(filtrar(teste.temas))

vetorizador = TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_df=0.5, sublinear_tf=True)
X_tr = vetorizador.fit_transform(treino.texto)
X_va = vetorizador.transform(valid.texto)
X_te = vetorizador.transform(teste.texto)
print("Vocabulário:", X_tr.shape[1], "termos")

def decidir(prob, limiar):
    Y = (prob >= limiar).astype(int)
    Y[np.arange(len(Y)), prob.argmax(1)] = 1  # garante ao menos 1 tema
    return Y

busca = []
for C in [0.5, 1, 2, 4, 8]:
    modelo = OneVsRestClassifier(LogisticRegression(C=C, class_weight="balanced", max_iter=2000), n_jobs=-1).fit(X_tr, Y_tr)
    prob_va = modelo.predict_proba(X_va)
    for limiar in np.arange(0.3, 0.95, 0.05):
        busca.append({"C": C, "limiar": round(limiar, 2), "f1_micro_val": f1_score(Y_va, decidir(prob_va, limiar), average="micro", zero_division=0)})
busca = pd.DataFrame(busca).sort_values("f1_micro_val", ascending=False)
MELHOR_C, MELHOR_LIMIAR = busca.iloc[0].C, busca.iloc[0].limiar
print(f"Melhor na validação: C={MELHOR_C}, limiar={MELHOR_LIMIAR}, F1 micro={busca.iloc[0].f1_micro_val:.3f}")

# Modelo final: treino + validação, avaliado uma única vez no teste
X_final = vetorizador.fit_transform(pd.concat([treino.texto, valid.texto]))
Y_final = np.vstack([Y_tr, Y_va])
modelo = OneVsRestClassifier(LogisticRegression(C=MELHOR_C, class_weight="balanced", max_iter=2000), n_jobs=-1).fit(X_final, Y_final)
X_te = vetorizador.transform(teste.texto)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6. Avaliação no teste (PLs de 2025)

# COMMAND ----------

def metricas(Y_true, Y_pred, prob=None):
    acerto_top1 = None
    if prob is not None:
        top = prob.argmax(1)
        acerto_top1 = float(np.mean(Y_true[np.arange(len(Y_true)), top] == 1))
    return {
        "precisao_micro": precision_score(Y_true, Y_pred, average="micro", zero_division=0),
        "recall_micro": recall_score(Y_true, Y_pred, average="micro", zero_division=0),
        "f1_micro": f1_score(Y_true, Y_pred, average="micro", zero_division=0),
        "f1_macro": f1_score(Y_true, Y_pred, average="macro", zero_division=0),
        "f1_por_pl": f1_score(Y_true, Y_pred, average="samples", zero_division=0),
        "hamming_loss": hamming_loss(Y_true, Y_pred),
        "cobertura": float(np.mean(Y_pred.sum(1) > 0)),  # % de PLs com algum tema previsto
        "acerto_tema_principal": acerto_top1,  # tema mais provável está entre os oficiais
    }

t0 = time.perf_counter(); pred_m1 = mlb.transform(m1_prever(teste.ementa)); t_m1 = time.perf_counter() - t0
t0 = time.perf_counter(); prob_te = modelo.predict_proba(vetorizador.transform(teste.texto)); pred_m2 = decidir(prob_te, MELHOR_LIMIAR); t_m2 = time.perf_counter() - t0

res = pd.DataFrame({
    "M1 palavras-chave": metricas(Y_te, pred_m1),
    "M2 TF-IDF + LogReg": metricas(Y_te, pred_m2, prob_te),
})
res.loc["ms_por_1000_pls"] = [1000 * 1000 * t_m1 / len(teste), 1000 * 1000 * t_m2 / len(teste)]
display(res.round(3).reset_index().rename(columns={"index": "métrica"}))

# COMMAND ----------

p1, r1, f1_1, sup = precision_recall_fscore_support(Y_te, pred_m1, zero_division=0)
p2, r2, f1_2, _ = precision_recall_fscore_support(Y_te, pred_m2, zero_division=0)
por_tema = pd.DataFrame({"tema": TEMAS, "pls_teste": sup,
                         "precisao_M1": p1, "recall_M1": r1, "f1_M1": f1_1,
                         "precisao_M2": p2, "recall_M2": r2, "f1_M2": f1_2}).sort_values("pls_teste", ascending=False)
display(por_tema.round(3))
spark.createDataFrame(por_tema).write.mode("overwrite").option("overwriteSchema", True).saveAsTable("gold_avaliacao_por_tema")

# COMMAND ----------

import matplotlib.pyplot as plt

top = por_tema.head(15).iloc[::-1]
fig, ax = plt.subplots(figsize=(9, 7))
y = np.arange(len(top))
ax.barh(y - 0.2, top.f1_M1, height=0.4, color="#8da1e7", label="M1 – palavras-chave")
ax.barh(y + 0.2, top.f1_M2, height=0.4, color="#1f49a1", label="M2 – TF-IDF + Regressão Logística")
ax.set_yticks(y, top.tema, fontsize=9)
ax.set_xlim(0, 1); ax.set_xlabel("F1 no teste (PLs de 2025)")
ax.spines[["top", "right"]].set_visible(False); ax.grid(axis="x", color="#e2e8f0"); ax.set_axisbelow(True)
ax.legend(loc="lower right", frameon=False)
ax.set_title("F1 por tema — 15 temas mais frequentes", loc="left", fontsize=12)
plt.tight_layout()
fig.savefig(f"{VOLUME}/figura_f1_por_tema.png", dpi=200)
display(fig)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 7. Análise de erros
# MAGIC Quando o tema principal oficial não é o mais provável para o M2, qual tema o modelo escolheu? (pares mais frequentes)

# COMMAND ----------

teste = teste.assign(previsto_M2=[[TEMAS[j] for j in np.where(l)[0]] for l in pred_m2],
                     previsto_M1=[[TEMAS[j] for j in np.where(l)[0]] for l in pred_m1],
                     top1_M2=[TEMAS[j] for j in prob_te.argmax(1)])
erros = teste[[tp not in ts for tp, ts in zip(teste.top1_M2, teste.temas)]]
print(f"Tema mais provável fora dos oficiais em {len(erros)} de {len(teste)} PLs ({100*len(erros)/len(teste):.1f}%)")
display(erros.groupby(["tema_principal", "top1_M2"]).size().rename("pls").reset_index()
        .sort_values("pls", ascending=False).head(15))
display(erros[["ementa", "temas", "previsto_M2", "previsto_M1"]].sample(min(15, len(erros)), random_state=7))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 8. Registro no MLflow
# MAGIC Guarda parâmetros e métricas do experimento (aparece em *Experiments*).

# COMMAND ----------

try:
    import mlflow
    usuario = spark.sql("select current_user()").first()[0]
    mlflow.set_experiment(f"/Users/{usuario}/legislativo-br-classificacao")
    with mlflow.start_run(run_name=VERSAO_MODELO):
        mlflow.log_params({"C": MELHOR_C, "limiar": MELHOR_LIMIAR, "ngram": "1-2", "min_df": 3, "temas": len(TEMAS),
                           "anos_treino": f"{ANOS_TREINO[0]}-{ANO_VALIDACAO}", "ano_teste": ANO_TESTE})
        for metodo, col in [("m1", "M1 palavras-chave"), ("m2", "M2 TF-IDF + LogReg")]:
            for k, v in res[col].dropna().items():
                mlflow.log_metric(f"{metodo}_{k}", float(v))
        mlflow.log_artifact(f"{VOLUME}/figura_f1_por_tema.png")
    print("Registrado no MLflow")
except Exception as e:
    print("MLflow indisponível, seguindo sem registro:", e)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 9. Gold — aplicar o modelo nos PLs de 2025–2026 da Câmara e do Senado
# MAGIC O Senado não publica temas no mesmo padrão da Câmara; o modelo treinado com a Câmara dá a ele a mesma régua de temas.
# MAGIC A API `/processo` do Senado não pagina, então percorremos o ano em janelas de 7 dias (como o site faz).

# COMMAND ----------

from datetime import date, timedelta

def senado_pls(ano: int):
    vistos, ini = {}, date(ano, 1, 1)
    fim_ano = min(date(ano, 12, 31), date.today())
    while ini <= fim_ano:
        fim = min(ini + timedelta(days=6), fim_ano)
        r = requests.get("https://legis.senado.leg.br/dadosabertos/processo",
                         params={"sigla": "PL", "dataInicioApresentacao": ini.isoformat(), "dataFimApresentacao": fim.isoformat()},
                         headers={"Accept": "application/json"}, timeout=60)
        r.raise_for_status()
        for p in r.json() or []:
            vistos[p["id"]] = p
        ini = fim + timedelta(days=1)
        time.sleep(0.15)  # a API do Senado limita a 10 requisições por segundo
    return pd.DataFrame([{"id": p["id"], "identificacao": p.get("identificacao"), "ementa": p.get("ementa"), "ano": ano}
                         for p in vistos.values() if p.get("ementa")])

partes = []
camara_aplic = df[df.ano.isin(ANOS_APLICACAO)][["id", "ano", "ementa"]].assign(casa="Câmara", identificacao=None)
partes.append(camara_aplic)
for ano in ANOS_APLICACAO:
    try:
        s = senado_pls(ano)
        print(f"Senado {ano}: {len(s)} PLs")
        partes.append(s.assign(casa="Senado"))
    except Exception as e:
        print(f"Senado {ano} indisponível: {e}")

aplic = pd.concat(partes, ignore_index=True)
prob = modelo.predict_proba(vetorizador.transform(aplic.ementa.map(limpar)))
pred = decidir(prob, MELHOR_LIMIAR)
linhas = [{"casa": c, "id": int(i), "ano": int(a), "identificacao": idf, "tema": TEMAS[j], "probabilidade": float(prob[k, j]),
           "principal": bool(j == prob[k].argmax()), "metodo": VERSAO_MODELO}
          for k, (c, i, a, idf) in enumerate(zip(aplic.casa, aplic.id, aplic.ano, aplic.identificacao.fillna(""))) for j in np.where(pred[k])[0]]
gold = spark.createDataFrame(pd.DataFrame(linhas)).withColumn("classificado_em", F.current_timestamp())
gold.write.mode("overwrite").option("overwriteSchema", True).saveAsTable("gold_pl_temas_previstos")

display(spark.table("gold_pl_temas_previstos").where("principal")
        .groupBy("casa", "tema").count()
        .groupBy("tema").pivot("casa").sum("count").fillna(0).orderBy(F.desc("Câmara")))

# COMMAND ----------

# MAGIC %md
# MAGIC ## Resumo — copie e mande para o Claude
# MAGIC (números usados no artigo)

# COMMAND ----------

import json
anos_df = df.assign(com_tema=df.temas.map(len) > 0).groupby("ano").agg(pls=("id", "size"), pct_com_tema=("com_tema", "mean"))
dist = spark.table("gold_pl_temas_previstos").where("principal").groupBy("casa").count().toPandas()
resumo = {
    "pls_por_ano": {int(a): {"pls": int(r.pls), "pct_com_tema": round(100 * r.pct_com_tema, 1)} for a, r in anos_df.iterrows()},
    "tamanhos": {"treino": len(treino), "validacao": len(valid), "teste": len(teste)},
    "temas_avaliados": len(TEMAS), "temas_fora": list(fora.index), "temas_sem_dicionario_M1": sem_dicionario,
    "vocabulario": int(X_final.shape[1]), "melhor_C": float(MELHOR_C), "melhor_limiar": float(MELHOR_LIMIAR),
    "teste": res.round(4).to_dict(),
    "por_tema": por_tema.round(3).to_dict(orient="records"),
    "erros_top_pares": {f"{a} → {b}": int(n) for (a, b), n in erros.groupby(["tema_principal", "top1_M2"]).size().sort_values(ascending=False).head(10).items()},
    "aplicacao_pls_classificados": dict(zip(dist.casa, dist["count"].astype(int))),
}
print(json.dumps(resumo, ensure_ascii=False, default=str))
