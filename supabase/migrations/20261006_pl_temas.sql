-- Temas dos PLs da Câmara e do Senado, gravados pelo job
-- jobs/classificacao_tematica.py (workflow "Classificação temática").
-- PL da Câmara já indexado: temas oficiais (origem 'oficial').
-- PL da Câmara sem indexação e todos os do Senado: temas previstos pelo
-- modelo TF-IDF + Regressão Logística (origem 'modelo').
create table if not exists pl_temas (
  casa              text not null check (casa in ('camara', 'senado')),
  id                bigint not null,          -- id na API da Casa
  ano               integer not null,
  identificacao     text,                     -- "PL 123/2026"
  ementa            text,
  data_apresentacao date,
  temas             text[] not null,          -- do mais para o menos relevante
  tema_principal    text not null,
  probabilidades    jsonb,                    -- só origem 'modelo': {tema: probabilidade}
  origem            text not null check (origem in ('oficial', 'modelo')),
  modelo            text,
  classificado_em   timestamptz not null default now(),
  primary key (casa, id)
);

create index if not exists pl_temas_ano_tema on pl_temas (ano, tema_principal);
create index if not exists pl_temas_temas on pl_temas using gin (temas);

-- Quantos PLs de cada Casa e ano têm cada tema como principal (gráficos).
create or replace view pl_temas_contagem as
  select casa, ano, tema_principal as tema, origem, count(*)::int as total
  from pl_temas
  group by casa, ano, tema_principal, origem;

-- Uma linha por execução do job: desempenho de M1 e M2 no ano de teste.
create table if not exists classificacao_avaliacao (
  id             bigserial primary key,
  executado_em   timestamptz not null default now(),
  modelo         text not null,
  anos_treino    text not null,
  ano_validacao  integer not null,
  ano_teste      integer not null,
  parametros     jsonb not null,
  metricas       jsonb not null,
  por_tema       jsonb not null
);

-- Só o service role (job e servidor do Next) acessa as tabelas.
alter table pl_temas enable row level security;
alter table classificacao_avaliacao enable row level security;
