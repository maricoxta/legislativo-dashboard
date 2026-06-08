# Legislativo BR

Painel para acompanhamento de proposições legislativas da **Câmara dos Deputados** e do **Senado Federal**. Busque, filtre, salve favoritos e monitore temas de interesse em tempo real.

---

## O que o projeto faz

| Tela | Descrição |
|---|---|
| **Dashboard** | KPIs do ano corrente, 3 gráficos (situação, tendência, tema) e últimas proposições |
| **Proposições Câmara** | Lista paginada por tipo (PL, PEC, MPV…) com filtros de tema, partido, UF e situação |
| **Proposições Senado** | Mesma experiência para matérias do Senado |
| **Busca avançada** | Filtros combinados; histórico salvo automaticamente para usuários logados |
| **Detalhes** | Drawer lateral com tramitações, autores, relatores e votações sem sair da página |
| **Monitoramento** | Crie alertas por palavras-chave; temas persistem na conta Supabase |
| **Agenda** | Próximos eventos e votações das comissões |

---

## Stack

- **Next.js 16** (App Router, Server Components, API Routes)
- **TypeScript 5** + **Tailwind CSS v4**
- **Supabase** — auth (email + Google OAuth), PostgreSQL, cache de API
- **Recharts** para visualizações
- **React 19**

---

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- Conta Supabase (opcional — o dashboard funciona sem ela)

### Instalação

```bash
git clone https://github.com/maricoxta/legislativo-dashboard
cd legislativo-dashboard
npm install
```

### Variáveis de ambiente

Edite o arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Sem Supabase configurado o app abre normalmente — dashboard, busca e proposições funcionam. Auth, monitoramento e favoritos ficam desabilitados.

### Banco de dados (Supabase SQL Editor)

```sql
create table temas_monitorados (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users not null,
  nome       text not null,
  emoji      text default '🔍',
  cor        text default 'blue',
  keywords   text[] not null,
  created_at timestamptz default now()
);

create table proposicoes_salvas (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users not null,
  proposicao_id text not null,
  source        text check (source in ('camara','senado')) not null,
  sigla         text not null,
  ementa        text,
  saved_at      timestamptz default now(),
  unique(user_id, proposicao_id)
);

create table api_cache (
  cache_key  text primary key,
  data       jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table historico_buscas (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users not null,
  termo           text not null,
  filtros         jsonb,
  resultado_count integer,
  searched_at     timestamptz default now()
);

alter table temas_monitorados  enable row level security;
alter table proposicoes_salvas enable row level security;
alter table historico_buscas   enable row level security;

create policy "own rows" on temas_monitorados  using (user_id = auth.uid());
create policy "own rows" on proposicoes_salvas using (user_id = auth.uid());
create policy "own rows" on historico_buscas   using (user_id = auth.uid());
```

### Iniciar

```bash
npm run dev
```

Acesse `http://localhost:3000`.

> **Windows + OneDrive:** o build é gerado em `%TEMP%\legislativo-next-build` para evitar conflito de bloqueio de arquivo (configurado em `next.config.ts`).

---

## Scripts

```bash
npm run dev    # desenvolvimento (Turbopack)
npm run build  # build de produção
npm run start  # servidor de produção
npm run lint   # ESLint
```

---

## Deploy

Conecte o repositório na **Vercel** e adicione as variáveis do `.env.local` nas configurações do projeto. O deploy é automático a cada push na `main`.

```bash
npx vercel --prod
```

---

## APIs utilizadas

As chamadas nunca saem direto do browser — passam pelas API routes do Next.js que adicionam cache e resolvem CORS.

- `https://dadosabertos.camara.leg.br/api/v2` — dados abertos da Câmara
- `https://legis.senado.leg.br/dadosabertos` — dados abertos do Senado

Cache: 30 min para listagens, 60 min para detalhes de proposições.
