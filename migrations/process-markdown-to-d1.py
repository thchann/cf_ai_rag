"""
Process markdown files directly and export to D1 format
Quick way to populate D1 without needing split_docs.pkl
"""

import os
import sys
import json
import hashlib
from pathlib import Path

# Add parent directory to path to import langchain
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_core.documents import Document
except ImportError:
    print("Error: langchain-text-splitters not installed")
    print("Install with: pip install langchain-text-splitters")
    sys.exit(1)

def process_markdown_files():
    """Process markdown files and export to D1 format"""
    
    markdown_dir = Path(__file__).parent.parent.parent / "data" / "processed_markdown"
    
    if not markdown_dir.exists():
        print(f"Error: {markdown_dir} not found")
        print("Make sure you have markdown files in data/processed_markdown/")
        sys.exit(1)
    
    print(f"Loading markdown files from {markdown_dir}...")
    
    # Load all markdown files
    documents = []
    for md_file in markdown_dir.glob("*.md"):
        print(f"  Loading {md_file.name}...")
        with open(md_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Create Document object
        source_name = md_file.stem  # filename without extension
        doc = Document(
            page_content=content,
            metadata={"source": f"{source_name}.md"}
        )
        documents.append(doc)
    
    print(f"\nFound {len(documents)} markdown files")
    
    # Split into chunks
    print("Splitting documents into chunks...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len
    )
    split_docs = splitter.split_documents(documents)
    
    print(f"Created {len(split_docs)} document chunks")
    
    # Export to JSON format for D1
    docs_data = []
    for i, doc in enumerate(split_docs):
        # Create unique ID
        content_hash = hashlib.md5(doc.page_content.encode()).hexdigest()
        doc_id = f"doc_{i}_{content_hash[:8]}"
        
        docs_data.append({
            "id": doc_id,
            "content": doc.page_content,
            "source": doc.metadata.get("source", "unknown"),
            "metadata": json.dumps(doc.metadata)
        })
        
        if (i + 1) % 100 == 0:
            print(f"  Processed {i + 1}/{len(split_docs)} chunks...")
    
    # Save to JSON
    output_file = Path(__file__).parent / "documents_export.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_documents": len(docs_data),
            "documents": docs_data
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Export complete! Saved to {output_file}")
    print(f"   Total documents: {len(docs_data)}")
    print(f"\n📝 Next steps:")
    print(f"   1. Generate SQL: cd cloudflare-rag/migrations && npx tsx import-d1.ts")
    print(f"   2. Import to D1: cd cloudflare-rag/worker && wrangler d1 execute DB --file ../migrations/import-d1.sql --remote")

if __name__ == "__main__":
    process_markdown_files()

