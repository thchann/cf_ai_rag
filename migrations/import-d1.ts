/**
 * Import documents from JSON export into Cloudflare D1
 * 
 * Usage:
 * 1. First run: python migrations/export-docs-to-json.py
 * 2. Then run this script with: wrangler d1 execute rag-documents --file=migrations/import-d1.sql
 *    OR use the Node.js version: npm run import-d1
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface Document {
  id: string;
  content: string;
  source: string;
  metadata: string;
}

interface Export {
  total_documents: number;
  documents: Document[];
}

async function importToD1() {
  console.log('Loading documents export...');
  
  const exportPath = join(__dirname, 'documents_export.json');
  const exportData: Export = JSON.parse(readFileSync(exportPath, 'utf-8'));
  
  console.log(`Found ${exportData.total_documents} documents to import`);
  
  // Generate SQL statements
  const sqlStatements: string[] = [];
  
  // Create table if it doesn't exist
  sqlStatements.push(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      source TEXT NOT NULL,
      metadata TEXT
    );
  `);
  
  sqlStatements.push(`
    CREATE INDEX IF NOT EXISTS idx_source ON documents(source);
  `);
  
  // Insert documents
  for (const doc of exportData.documents) {
    const escapedContent = doc.content.replace(/'/g, "''");
    const escapedMetadata = doc.metadata.replace(/'/g, "''");
    
    sqlStatements.push(`
      INSERT OR REPLACE INTO documents (id, content, source, metadata)
      VALUES ('${doc.id}', '${escapedContent}', '${doc.source}', '${escapedMetadata}');
    `);
  }
  
  // Write SQL file
  const sqlPath = join(__dirname, 'import-d1.sql');
  require('fs').writeFileSync(sqlPath, sqlStatements.join('\n'));
  
  console.log(`SQL file generated: ${sqlPath}`);
  console.log(`\nTo import, run:`);
  console.log(`  wrangler d1 execute rag-documents --file=${sqlPath}`);
  console.log(`\nOr execute manually in batches if the file is too large.`);
}

// If running directly
if (require.main === module) {
  importToD1().catch(console.error);
}

export { importToD1 };


