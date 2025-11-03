"""
Export FAISS index to JSON format for Vectorize migration
Run this from the parent directory: python migrations/export-faiss-to-json.py
"""

import os
import sys
import json
import pickle

# Add parent directory to path to import from rag.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import faiss
    from langchain_ollama import OllamaEmbeddings
    from langchain_community.vectorstores import FAISS
    
    FAISS_AVAILABLE = True
except ImportError as e:
    print(f"Error: Missing dependencies. Install with: pip install faiss-cpu langchain-ollama")
    print(f"Import error: {e}")
    sys.exit(1)

def export_faiss_to_json():
    """Export FAISS vectors and metadata to JSON"""
    
    print("Loading FAISS index...")
    
    # Load embeddings model (needed to load FAISS)
    MODEL = "llama3.2"
    embeddings = OllamaEmbeddings(model=MODEL)
    
    # Load FAISS index
    faiss_path = "faiss_index"
    if not os.path.exists(faiss_path):
        print(f"Error: FAISS index not found at {faiss_path}")
        print("Make sure you're running from the LLM_RAG root directory")
        sys.exit(1)
    
    vectorstore = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True)
    
    # Get FAISS index
    index = vectorstore.index
    
    # Get document store (from FAISS)
    # Note: FAISS stores vectors, but we need to get the actual documents from split_docs.pkl
    print("Loading document chunks...")
    with open("split_docs.pkl", "rb") as f:
        split_docs = pickle.load(f)
    
    # Get all vectors from FAISS
    num_vectors = index.ntotal
    dimension = index.d
    
    print(f"Found {num_vectors} vectors with {dimension} dimensions")
    print(f"Found {len(split_docs)} document chunks")
    
    # Export vectors and documents
    vectors_data = []
    
    for i in range(min(num_vectors, len(split_docs))):
        # Get vector from FAISS
        vector = index.reconstruct(i)
        
        # Get corresponding document
        doc = split_docs[i]
        
        vectors_data.append({
            "id": f"doc_{i}",
            "vector": vector.tolist(),
            "metadata": {
                "content": doc.page_content,
                "source": doc.metadata.get("source", "unknown"),
                "chunk_index": i
            }
        })
        
        if (i + 1) % 100 == 0:
            print(f"Exported {i + 1}/{num_vectors} vectors...")
    
    # Save to JSON
    output_file = "cloudflare-rag/migrations/faiss_export.json"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, "w") as f:
        json.dump({
            "dimension": dimension,
            "total_vectors": len(vectors_data),
            "vectors": vectors_data
        }, f, indent=2)
    
    print(f"\nExport complete! Saved to {output_file}")
    print(f"Total vectors: {len(vectors_data)}")
    print(f"Dimension: {dimension}")
    print("\nNext step: Use this JSON to upload to Vectorize")

if __name__ == "__main__":
    export_faiss_to_json()


