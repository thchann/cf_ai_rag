/**
 * BM25 Retriever
 * Handles keyword-based sparse search using D1 database
 * Implements simplified BM25 scoring
 */

import { Env, Document } from '../types';

/**
 * Simplified BM25 scoring
 * In a production system, you'd want a full BM25 implementation
 * For now, we use keyword matching with frequency scoring
 */
function calculateBM25Score(
  document: string,
  queryTerms: string[],
  avgDocLength: number,
  k1: number = 1.2,
  b: number = 0.75
): number {
  let score = 0;
  const docLength = document.length;
  
  for (const term of queryTerms) {
    const termFreq = (document.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
    if (termFreq === 0) continue;
    
    // Simplified IDF (Inverse Document Frequency)
    // In production, you'd calculate IDF from corpus statistics
    const idf = Math.log(1 + termFreq);
    
    // BM25 formula
    const numerator = idf * termFreq * (k1 + 1);
    const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
    score += numerator / denominator;
  }
  
  return score;
}

export async function retrieveFromD1(
  query: string,
  env: Env
): Promise<Document[]> {
  try {
    // Step 1: Extract keywords from query
    const stopwords = new Set(['the','is','are','and','or','not','a','an','of','to','in','on','for','with','what','which','who','where','when','how','why']);
    const queryTerms = query
      .toLowerCase()
      .split(/\W+/)
      .filter(term => term.length > 2 && !stopwords.has(term)); // basic stopword removal

    if (queryTerms.length === 0) {
      return [];
    }

    // Step 2: Build SQL query for keyword search
    // Use OR to improve recall; ranking handled by BM25 score later
    const conditions = queryTerms.map(() => 'content LIKE ?').join(' OR ');
    const params = queryTerms.map(term => `%${term}%`);

    // Step 3: Fetch matching documents from D1
    let result: any;
    try {
      const stmt = env.DB.prepare(`
        SELECT id, content, source, metadata 
        FROM documents 
        WHERE ${conditions}
        LIMIT 50
      `);

      result = await stmt.bind(...params).all<{
        id: string;
        content: string;
        source: string;
        metadata: string;
      }>();
    } catch (dbError: any) {
      console.error('[D1] Query failed:', dbError);
      // If table doesn't exist, that's okay - we'll just have empty results
      if (dbError.message?.includes('no such table') || dbError.message?.includes('not found')) {
        console.warn('[D1] Documents table may not exist or be empty - you may need to run data migration');
      }
      return [];
    }

    if (!result || !result.results || result.results.length === 0) {
      console.log('[D1] No matching documents found');
      return [];
    }

    // Step 4: Score and rank documents using BM25
    const documents = result.results.map(doc => ({
      id: doc.id,
      content: doc.content,
      source: doc.source,
      metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
    }));

    // Calculate average document length for BM25
    const avgDocLength = documents.reduce((sum, doc) => sum + doc.content.length, 0) / documents.length;

    // Score and sort documents
    const scoredDocs = documents
      .map(doc => ({
        doc,
        score: calculateBM25Score(doc.content, queryTerms, avgDocLength),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8) // Top 8 results
      .map(item => item.doc);

    return scoredDocs;
  } catch (error) {
    console.error('Error in D1/BM25 retrieval:', error);
    return [];
  }
}

