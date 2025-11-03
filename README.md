# Cloudflare RAG

Minimal RAG application on Cloudflare: Worker (TypeScript) + Workers AI (LLM) + D1 (documents) + KV (conversation memory) + React frontend.

## Assignment mapping
- LLM: Workers AI (`@cf/meta/llama-3.1-8b-instruct`)
- Workflow/coordination: Cloudflare Worker (`worker/src/rag-worker.ts`)
- User input: React chat UI (`frontend/src`)
- Memory/state: KV (`CONVERSATIONS`) for conversation history

## Run locally
Prereqs: Node 18+, Cloudflare account, Wrangler CLI

1) Start the Worker
```bash
cd worker
npm install
wrangler dev --remote
```

2) Start the frontend (new terminal)
```bash
cd ../frontend
npm install
# Create .env if missing
# VITE_WORKER_URL=http://localhost:8787
npm run dev
```

Open the printed Vite URL and chat.

## Data import (D1)
To load documents for retrieval (BM25 over D1):
```bash
# From repo root
pip install langchain-text-splitters
python cloudflare-rag/migrations/process-markdown-to-d1.py
cd cloudflare-rag/migrations
npx tsx import-d1.ts
cd ../worker
wrangler d1 execute DB --file ../migrations/import-d1.sql --remote
wrangler d1 execute DB --remote --command "SELECT COUNT(*) AS total FROM documents;"
```
Vectorize (semantic search) is optional and can be added later.

## Structure
```
cloudflare-rag/
├── worker/            # Cloudflare Worker API
│   ├── src/           # RAG pipeline
│   └── wrangler.toml  # Bindings (AI, D1, KV, Vectorize)
├── frontend/          # React chat UI
└── migrations/        # Import scripts
```

## Repository requirements
- Repository name must start with `cf_ai_`
- Include `PROMPTS.md` at repo root with prompts used
- Include this README with clear run instructions
