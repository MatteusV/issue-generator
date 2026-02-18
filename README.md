# Generate Issues

Aplicação Next.js para criar GitHub Issues a partir de linguagem natural, com contexto do repositório via GitHub API e embeddings em Postgres (pgvector).  
O chat usa o **AI Gateway** da Vercel para gerar a issue; os **embeddings** usam OpenAI direto.

---

## Como funciona

1. **OAuth GitHub**: o usuário faz login e o app lista apenas os repositórios permitidos.
2. **Indexação**: ao indexar um repositório, o app lê arquivos via GitHub API, gera embeddings e salva no Postgres (pgvector).
3. **RAG**: ao gerar uma issue, o app busca trechos relevantes do repositório e monta o prompt.
4. **IA**: a geração da issue é feita via **AI Gateway** (`https://ai-gateway.vercel.sh/v1`).
5. **Revisão**: o usuário revisa e, se desejar, cria a issue no GitHub.

---

## Requisitos

- Node.js 18+
- pnpm
- Docker (para o Postgres com pgvector)
- Conta GitHub (OAuth App)
- Chave AI Gateway (Vercel)
- Chave OpenAI (embeddings)

---

## Como rodar

### 1) Instalar deps
```bash
pnpm install
```

### 2) Subir o Postgres com pgvector
```bash
docker compose up -d
```

### 3) Configurar variáveis de ambiente
Copie o `.env.example` para `.env` e preencha:
```bash
cp .env.example .env
```

### 4) Rodar o app
```bash
pnpm dev
```

Acesse: `http://localhost:3000`

---

## Variáveis de ambiente

Veja o arquivo `.env.example` para a lista completa.

Principais:

- `AI_GATEWAY_API_KEY` — usado para gerar issues via AI Gateway
- `OPENAI_API_KEY` — usado apenas para embeddings
- `AUTH_GITHUB_ID` e `AUTH_GITHUB_SECRET` — OAuth GitHub
- `AUTH_SECRET` e `AUTH_URL` — NextAuth
- `VECTOR_DB_URL` — conexão do Postgres (pgvector)

---

## Scripts úteis

```bash
pnpm dev     # roda em modo desenvolvimento
pnpm build   # build de produção
pnpm start   # start em produção
pnpm lint    # biome check
pnpm format  # biome format --write
```

---

## Estrutura relevante

- `src/server-actions/ai/*` — chamadas de IA e indexação
- `src/lib/vector-store.ts` — pgvector + embeddings
- `src/app/api/models/route.ts` — modelos via AI Gateway
- `src/contexts/model-context.tsx` — contexto global de modelos

