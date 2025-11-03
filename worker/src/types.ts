/**
 * Type definitions for the RAG Worker
 */

export interface Env {
  // Workers AI (automatically available)
  AI: any; // Workers AI binding
  
  // Vectorize index for dense vector search
  VECTORIZE: Vectorize;
  
  // D1 Database for document storage and BM25
  DB: D1Database;
  
  // KV for conversation memory
  CONVERSATIONS: KVNamespace;
}

export interface Document {
  id: string;
  content: string;
  source: string;
  metadata: Record<string, any>;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface QueryRequest {
  query: string;
  sessionId?: string;
}

export interface QueryResponse {
  answer: string;
  sources?: Array<{
    source: string;
    content: string;
  }>;
}


