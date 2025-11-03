/**
 * API utilities for communicating with the RAG Worker
 */

interface QueryResponse {
  answer: string;
  sources?: Array<{
    source: string;
    content: string;
  }>;
  error?: string;
  details?: string;
}

// Production Worker URL (deployed)
// For local dev, set VITE_WORKER_URL=http://localhost:8787 in .env file
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://rag-worker.tchan-efa.workers.dev';

//

export async function sendQuery(
  query: string,
  sessionId: string
): Promise<QueryResponse> {
  const response = await fetch(`${WORKER_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      sessionId: sessionId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.details 
      ? `${errorData.error || 'Error'}: ${errorData.details}`
      : errorData.error || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  const data: QueryResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

