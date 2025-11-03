"""
Export document chunks to JSON format for D1 migration
Run this from the parent directory: python migrations/export-docs-to-json.py
"""

import os
import sys
import json
import pickle
import hashlib

def export_docs_to_json():
    """Export document chunks to JSON for D1 import"""
    
    print("Loading document chunks...")
    
    if not os.path.exists("split_docs.pkl"):
        print("Error: split_docs.pkl not found")
        print("Make sure you're running from the LLM_RAG root directory")
        sys.exit(1)
    
    with open("split_docs.pkl", "rb") as f:
        split_docs = pickle.load(f)
    
    print(f"Found {len(split_docs)} document chunks")
    
    # Export to JSON format suitable for D1
    docs_data = []
    
    for i, doc in enumerate(split_docs):
        # Create unique ID from content hash
        content_hash = hashlib.md5(doc.page_content.encode()).hexdigest()
        doc_id = f"doc_{i}_{content_hash[:8]}"
        
        docs_data.append({
            "id": doc_id,
            "content": doc.page_content,
            "source": doc.metadata.get("source", "unknown"),
            "metadata": json.dumps(doc.metadata)
        })
        
        if (i + 1) % 100 == 0:
            print(f"Exported {i + 1}/{len(split_docs)} documents...")
    
    # Save to JSON
    output_file = "cloudflare-rag/migrations/documents_export.json"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_documents": len(docs_data),
            "documents": docs_data
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\nExport complete! Saved to {output_file}")
    print(f"Total documents: {len(docs_data)}")
    print("\nNext step: Import to D1 using import-d1.ts")

if __name__ == "__main__":
    export_docs_to_json()


