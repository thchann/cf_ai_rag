# Cloudflare RAG

Minimal RAG application on Cloudflare: Worker (TypeScript) + Workers AI (LLM) + D1 (documents) + KV (conversation memory) + React frontend.

## Assignment mapping
- LLM: Workers AI (`@cf/meta/llama-3.1-8b-instruct`)
- Workflow/coordination: Cloudflare Worker (`worker/src/rag-worker.ts`)
- User input: React chat UI (`frontend/src`)
- Memory/state: KV (`CONVERSATIONS`) for conversation history

## Live demo

- API (Worker): https://rag-worker.tchan-efa.workers.dev
- Frontend (Pages): https://1815b1a4.rag-llm-aqj.pages.dev

## Data

This app returns sources when matching content exists in D1. If you fork this repo, load your documents into D1 using the scripts in `migrations/`.

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
