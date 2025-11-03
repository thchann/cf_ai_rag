/**
 * Vectorize Retriever
 * Handles dense vector similarity search using Cloudflare Vectorize
 */

import { Env, Document } from '../types';

export async function retrieveFromVectorize(
  query: string,
  env: Env
): Promise<Document[]> {
  try {
    // Step 1: Generate embedding for the query using Workers AI
    // Try different embedding models that might be available
    let embedding: number[] | null = null;
    
    // Check if Workers AI is available
    if (!env.AI) {
      console.warn('[Vectorize] Workers AI not available - skipping vector search');
      return [];
    }
    
    // Use OpenAI-compatible embedding model that matches 1536-dim Vectorize index
    // @cf/openai/text-embedding-3-small -> 1536 dimensions
    try {
      const embeddingResponse = await env.AI.run(
        '@cf/openai/text-embedding-3-small',
        {
          input: [query],
        }
      );

      // Expected format: { data: [ { embedding: number[] } ] }
      if (embeddingResponse && Array.isArray(embeddingResponse.data) && embeddingResponse.data[0]?.embedding) {
        embedding = embeddingResponse.data[0].embedding as number[];
      }
    } catch (err) {
      console.warn('[Vectorize] Failed to generate embeddings:', err);
      return [];
    }

    // Ensure we have a valid numeric vector matching the index dimension (1536)
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 1536 || !embedding.every(v => typeof v === 'number')) {
      console.warn('[Vectorize] No valid numeric embedding generated, skipping Vectorize search');
      return [];
    }

    // Step 2: Query Vectorize index
    let vectorizeResults: any;
    try {
      // With a bound Vectorize index in wrangler.toml, do not pass index name
      // Use the bound index directly with an options object
      vectorizeResults = await env.VECTORIZE.query({
        vector: embedding as unknown as number[],
        topK: 8,
        returnValues: true,
        returnMetadata: true,
      });
    } catch (queryError: any) {
      console.error('[Vectorize] Query failed:', queryError);
      // If index doesn't exist or is empty, that's okay - we'll use BM25 only
      if (queryError.message?.includes('index') || queryError.message?.includes('not found')) {
        console.warn('[Vectorize] Index may not exist or be empty - continuing with BM25 only');
      }
      return [];
    }

    if (!vectorizeResults || !vectorizeResults.matches || vectorizeResults.matches.length === 0) {
      console.log('[Vectorize] No matches found');
      return [];
    }

    // Step 3: Fetch full documents from D1 using IDs from Vectorize results
    // Vectorize returns IDs, we need to get the actual content from D1
    const documentIds = vectorizeResults.matches.map(m => m.id);
    
    const documents: Document[] = [];
    for (const id of documentIds) {
      try {
        const result = await env.DB.prepare(
          'SELECT id, content, source, metadata FROM documents WHERE id = ?'
        )
          .bind(id)
          .first<{ id: string; content: string; source: string; metadata: string }>();

        if (result) {
          documents.push({
            id: result.id,
            content: result.content,
            source: result.source,
            metadata: result.metadata ? JSON.parse(result.metadata) : {},
          });
        }
      } catch (err) {
        console.error(`Error fetching document ${id}:`, err);
      }
    }

    return documents;
  } catch (error) {
    console.error('Error in Vectorize retrieval:', error);
    // Fallback: return empty array, let BM25 handle it
    return [];
  }
}

