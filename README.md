# Legislativo BR

Painel para acompanhamento de proposições legislativas da **Câmara dos Deputados** e do **Senado Federal**. Busque, filtre e monitore temas de interesse em tempo real.

---

## O que o projeto faz

| Tela | Descrição |
|---|---|
| **Dashboard** | KPIs do ano corrente, 3 gráficos (situação, tendência, tema) e últimas proposições |
| **Proposições Câmara** | Lista paginada por tipo (PL, PEC, MPV…) com filtros de tema, partido, UF e situação |
| **Proposições Senado** | Mesma experiência para matérias do Senado |
| **Busca avançada** | Filtros combinados; histórico salvo automaticamente para usuários logados |
| **Detalhes** | Drawer lateral com tramitações, autores, relatores e votações sem sair da página |
| **Monitoramento por Temas** | Proposições da Câmara e do Senado por palavras-chave; temas e palavras ficam salvos no navegador |
| **Agenda** | Próximos eventos e votações das comissões |

---

## Stack

- **Next.js 16** (App Router, Server Components, API Routes)
- **TypeScript 5** + **Tailwind CSS v4**
- **Supabase** — PostgreSQL (cache de API e situação dos PLs da Câmara)
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

> Sem Supabase configurado o app abre normalmente; só os indicadores e as listas por situação da Câmara ficam sem dados.

### Banco de dados (Supabase SQL Editor)

```sql
create table api_cache (
  cache_key  text primary key,
  data       jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
```

### Situação dos PLs da Câmara (job diário)

A API da Câmara não filtra proposições por situação. Os indicadores e as listas
por status da Câmara leem a tabela `camara_pl_situacao`, carregada todo dia pelo
workflow `.github/workflows/camara-situacao.yml` (script `jobs/camara_situacao.py`)
a partir do arquivo anual `proposicoes-{ano}.csv` da Câmara.

1. Rode `supabase/migrations/20261005_camara_pl_situacao.sql` no SQL Editor do Supabase.
2. Em GitHub → Settings → Secrets and variables → Actions, crie `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
3. Na aba Actions, rode "Situação dos PLs da Câmara" uma vez (depois ele roda sozinho às 6h).

### Iniciar

```bash
npm run dev
```

Acesse 'https://legislativo-dashboard.vercel.app/'.

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
