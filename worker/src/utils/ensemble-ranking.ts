/**
 * Ensemble Ranking
 * Combines results from Vectorize (dense) and D1/BM25 (sparse) retrievers
 * Similar to the original Python EnsembleRetriever with 50/50 weighting
 */

import { Document } from '../types';

export interface ScoredDocument {
  document: Document;
  score: number;
}

/**
 * Combine retrieval results using weighted ensemble ranking
 * @param vectorResults Results from Vectorize (dense retrieval)
 * @param bm25Results Results from D1/BM25 (sparse retrieval)
 * @param vectorWeight Weight for vector results (default: 0.5)
 * @param bm25Weight Weight for BM25 results (default: 0.5)
 * @returns Ranked documents sorted by combined score
 */
export function ensembleRank(
  vectorResults: Document[],
  bm25Results: Document[],
  vectorWeight: number = 0.5,
  bm25Weight: number = 0.5
): Document[] {
  // Combine documents with scores
  const allDocs = new Map<string, ScoredDocument>();

  // Add vector results with normalized scores
  // Assume Vectorize returns results in order (best first)
  vectorResults.forEach((doc, index) => {
    const normalizedScore = 1 - (index / vectorResults.length); // Invert rank to score
    const existing = allDocs.get(doc.id);
    
    if (existing) {
      existing.score += normalizedScore * vectorWeight;
    } else {
      allDocs.set(doc.id, {
        document: doc,
        score: normalizedScore * vectorWeight,
      });
    }
  });

  // Add BM25 results with normalized scores
  bm25Results.forEach((doc, index) => {
    const normalizedScore = 1 - (index / bm25Results.length); // Invert rank to score
    const existing = allDocs.get(doc.id);
    
    if (existing) {
      existing.score += normalizedScore * bm25Weight;
    } else {
      allDocs.set(doc.id, {
        document: doc,
        score: normalizedScore * bm25Weight,
      });
    }
  });

  // Sort by combined score and return top documents
  const ranked = Array.from(allDocs.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 8) // Top 8 combined results
    .map(item => item.document);

  return ranked;
}


