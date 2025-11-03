"""
Reduce vector dimensions from 3072 to 1536 using PCA
This makes vectors compatible with Vectorize (max 1536 dimensions)
"""

import json
import numpy as np
from sklearn.decomposition import PCA
import os

def reduce_dimensions():
    print("Loading FAISS export...")
    
    export_path = "cloudflare-rag/migrations/faiss_export.json"
    with open(export_path, "r") as f:
        data = json.load(f)
    
    vectors = np.array([vec["vector"] for vec in data["vectors"]])
    original_dim = vectors.shape[1]
    target_dim = 1536
    
    print(f"Original dimensions: {original_dim}")
    print(f"Target dimensions: {target_dim}")
    print(f"Number of vectors: {len(vectors)}")
    print("\nApplying PCA dimension reduction...")
    
    # Apply PCA to reduce dimensions
    pca = PCA(n_components=target_dim)
    reduced_vectors = pca.fit_transform(vectors)
    
    print(f"Reduced to {target_dim} dimensions")
    print(f"Explained variance: {pca.explained_variance_ratio_.sum():.2%}")
    
    # Update the export data with reduced vectors
    for i, vec in enumerate(data["vectors"]):
        vec["vector"] = reduced_vectors[i].tolist()
    
    data["dimension"] = target_dim
    
    # Save reduced export
    output_path = "cloudflare-rag/migrations/faiss_export_reduced.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"\nReduced export saved to: {output_path}")
    print("\nNext: Use faiss_export_reduced.json for Vectorize import")
    
    # Also update the original file (backup first)
    backup_path = "cloudflare-rag/migrations/faiss_export_original_3072.json"
    with open(backup_path, "w") as f:
        json.dump({
            "dimension": original_dim,
            "total_vectors": data["total_vectors"],
            "vectors": [{"id": v["id"], "vector": v["vector"], "metadata": v["metadata"]} 
                       for v in data["vectors"]]
        }, f, indent=2)
    
    # Update original file
    with open(export_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Original backup saved to: {backup_path}")
    print("Original file updated with reduced dimensions")

if __name__ == "__main__":
    try:
        from sklearn.decomposition import PCA
    except ImportError:
        print("Error: scikit-learn not installed")
        print("Install with: pip install scikit-learn")
        exit(1)
    
    reduce_dimensions()

