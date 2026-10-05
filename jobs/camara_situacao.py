"""Carrega a situação atual dos PLs da Câmara no Supabase.

A API /proposicoes da Câmara não filtra por situação e a lista não traz a
situação de cada PL. O arquivo anual proposicoes-{ano}.csv (atualizado
diariamente pela Câmara) traz o último status de cada proposição. Este job
baixa o arquivo, fica só com os PLs do ano e faz upsert na tabela
camara_pl_situacao.

Uso: python jobs/camara_situacao.py [ano ...]   (padrão: ano corrente e anterior)
Variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

import csv
import io
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import date, datetime, timezone

ARQUIVO = "https://dadosabertos.camara.leg.br/arquivos/proposicoes/csv/proposicoes-{ano}.csv"
TABELA = "camara_pl_situacao"
LOTE = 1000

# Colunas do CSV usadas pelo job. Se a Câmara mudar o layout, o job falha
# mostrando o cabeçalho recebido, em vez de gravar dados errados.
COLUNAS = {
    "id": "id",
    "siglaTipo": "sigla_tipo",
    "numero": "numero",
    "ano": "ano",
    "ementa": "ementa",
    "dataApresentacao": "data_apresentacao",
    "ultimoStatus_idSituacao": "cod_situacao",
    "ultimoStatus_descricaoSituacao": "descricao_situacao",
    "ultimoStatus_dataHora": "data_situacao",
    "ultimoStatus_siglaOrgao": "sigla_orgao",
}


def inteiro(v: str):
    v = (v or "").strip()
    return int(float(v)) if v else None


def texto(v: str):
    v = (v or "").strip()
    return v or None


def baixar_linhas(ano: int):
    url = ARQUIVO.format(ano=ano)
    print(f"Baixando {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "legislativo-dashboard-job"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        conteudo = resp.read().decode("utf-8-sig")
    print(f"{len(conteudo) / 1e6:.1f} MB recebidos")
    leitor = csv.DictReader(io.StringIO(conteudo), delimiter=";")
    faltando = [c for c in COLUNAS if c not in (leitor.fieldnames or [])]
    if faltando:
        sys.exit(f"Colunas ausentes no CSV: {faltando}\nCabeçalho recebido: {leitor.fieldnames}")
    return leitor


def pls_do_ano(ano: int):
    agora = datetime.now(timezone.utc).isoformat()
    for linha in baixar_linhas(ano):
        if linha["siglaTipo"].strip() != "PL" or inteiro(linha["ano"]) != ano:
            continue
        yield {
            "id": inteiro(linha["id"]),
            "sigla_tipo": "PL",
            "numero": inteiro(linha["numero"]),
            "ano": ano,
            "ementa": texto(linha["ementa"]),
            "data_apresentacao": texto(linha["dataApresentacao"]),
            "cod_situacao": inteiro(linha["ultimoStatus_idSituacao"]),
            "descricao_situacao": texto(linha["ultimoStatus_descricaoSituacao"]),
            "data_situacao": texto(linha["ultimoStatus_dataHora"]),
            "sigla_orgao": texto(linha["ultimoStatus_siglaOrgao"]),
            "atualizado_em": agora,
        }


def base_supabase() -> str:
    # Aceita a Project URL com ou sem "/rest/v1" no final.
    base = os.environ["SUPABASE_URL"].strip().rstrip("/")
    base = base.removesuffix("/rest/v1")
    if not base.startswith("https://") or "supabase.com/dashboard" in base:
        sys.exit("SUPABASE_URL deve ser a Project URL, no formato https://<id>.supabase.co")
    return base


def upsert(registros: list[dict]):
    url = base_supabase() + f"/rest/v1/{TABELA}?on_conflict=id"
    chave = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    req = urllib.request.Request(
        url,
        data=json.dumps(registros).encode(),
        method="POST",
        headers={
            "apikey": chave,
            "Authorization": f"Bearer {chave}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            if resp.status >= 300:
                sys.exit(f"Supabase respondeu {resp.status}: {resp.read()[:500]!r}")
    except urllib.error.HTTPError as e:
        # O corpo da resposta do PostgREST explica o erro (ex.: tabela não encontrada).
        sys.exit(f"Supabase respondeu {e.code}: {e.read()[:500]!r}")


def main():
    anos = [int(a) for a in sys.argv[1:]] or [date.today().year, date.today().year - 1]
    for ano in anos:
        registros = [r for r in pls_do_ano(ano) if r["id"] is not None]
        if not registros:
            sys.exit(f"Nenhum PL de {ano} no arquivo: nada foi gravado.")
        sem_situacao = sum(r["cod_situacao"] is None for r in registros)
        print(f"{len(registros)} PLs de {ano} ({sem_situacao} sem código de situação)")
        for i in range(0, len(registros), LOTE):
            upsert(registros[i : i + LOTE])
        print(f"Upsert concluído em {TABELA}")


if __name__ == "__main__":
    main()
