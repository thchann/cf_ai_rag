/**
 * Import vectors from JSON export into Cloudflare Vectorize
 * 
 * Usage:
 * 1. First run: python migrations/export-faiss-to-json.py
 * 2. Then run: wrangler vectorize insert rag-embeddings --file=migrations/vectorize-import.jsonl
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface VectorData {
  id: string;
  vector: number[];
  metadata: {
    content: string;
    source: string;
    chunk_index: number;
  };
}

interface Export {
  dimension: number;
  total_vectors: number;
  vectors: VectorData[];
}

function convertToVectorizeFormat() {
  console.log('Loading FAISS export...');
  
  const exportPath = join(__dirname, 'faiss_export.json');
  const exportData: Export = JSON.parse(readFileSync(exportPath, 'utf-8'));
  
  console.log(`Found ${exportData.total_vectors} vectors`);
  console.log(`Dimension: ${exportData.dimension}`);
  
  // Convert to Vectorize JSONL format
  const jsonlLines: string[] = [];
  
  for (const vec of exportData.vectors) {
    const vectorizeEntry = {
      id: vec.id,
      values: vec.vector,
      metadata: vec.metadata
    };
    
    jsonlLines.push(JSON.stringify(vectorizeEntry));
  }
  
  // Write JSONL file
  const outputPath = join(__dirname, 'vectorize-import.jsonl');
  writeFileSync(outputPath, jsonlLines.join('\n'));
  
  console.log(`\nVectorize import file created: ${outputPath}`);
  console.log(`\nTo import, run:`);
  console.log(`  wrangler vectorize insert rag-embeddings --file=${outputPath}`);
  console.log(`\nNote: Vectorize may have limits on batch size.`);
  console.log(`If import fails, split the file into smaller batches.`);
}

convertToVectorizeFormat();


