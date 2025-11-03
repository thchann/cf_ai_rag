-- Create D1 database schema for documents
-- Run with: wrangler d1 execute rag-documents --file=migrations/create-d1-schema.sql

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_source ON documents(source);

-- Verify
SELECT COUNT(*) as total_documents FROM documents;


