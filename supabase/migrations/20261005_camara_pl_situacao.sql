-- Situação atual de cada PL da Câmara, carregada todo dia pelo job
-- jobs/camara_situacao.py a partir do arquivo anual proposicoes-{ano}.csv.
create table if not exists camara_pl_situacao (
  id                 bigint primary key,      -- id da proposição na API da Câmara
  sigla_tipo         text not null,
  numero             integer not null,
  ano                integer not null,
  ementa             text,
  data_apresentacao  timestamptz,
  cod_situacao       integer,                 -- ultimoStatus_idSituacao (ver /referencias/proposicoes/codSituacao)
  descricao_situacao text,
  data_situacao      timestamptz,
  sigla_orgao        text,
  atualizado_em      timestamptz not null default now()
);

create index if not exists camara_pl_situacao_ano_sit on camara_pl_situacao (ano, cod_situacao);

-- Só o service role (job e servidor do Next) acessa a tabela.
alter table camara_pl_situacao enable row level security;
