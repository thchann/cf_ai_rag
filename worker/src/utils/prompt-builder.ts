/**
 * Prompt Builder
 * Constructs RAG prompts with retrieved context
 * Matches the original Python prompt template
 */

import { Document, Message } from '../types';

/**
 * Build RAG prompt with retrieved context
 */
export function buildRAGPrompt(
  documents: Document[],
  query: string,
  conversationHistory?: Message[]
): Message[] {
  // Format documents into context string
  const context = documents
    .map((doc, index) => {
      const source = doc.source || 'unknown';
      return `[Document ${index + 1} - Source: ${source}]\n${doc.content}`;
    })
    .join('\n\n---\n\n');

  // Build the RAG prompt template (matching original Python version)
  const systemPrompt = `You are an AI assistant built to answer questions strictly using the information from retrieved documents.

### Important Guidelines:
- Use only information found in the context above.
- Do not use prior knowledge or external information — only what is in the context.
- If multiple pieces of context conflict, acknowledge this in your response.
- If there is not enough information to answer, say so explicitly.
- No guessing or hallucinating.
- Be objective, accurate, and concise.
- Quote and cite the source if necessary.`;

  const userPrompt = `### Retrieved Context:
<context>
${context}
</context>

### User Query:
<query>
${query}
</query>

### How to Answer:
1. Use only information found in the context above.
2. Do not use prior knowledge or external information — only what is in the context.
3. If multiple pieces of context conflict, acknowledge this in your response.
4. If there is not enough information to answer, say so explicitly.

### Response Format:
<relevant_sources>
Summarize the exact parts of the retrieved context that are useful for answering the query.
List them in bullet point format.
</relevant_sources>

<response>
Write a clear, direct answer using only the information from the relevant_sources.
If the query cannot be answered, explain that and why.
</response>`;

  // Build message array for Workers AI
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history (last 5 messages for context)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-5);
    messages.push(...recentHistory);
  }

  // Add current query
  messages.push({ role: 'user', content: userPrompt });

  return messages;
}

/**
 * Format documents for display (extract sources)
 */
export function extractSources(documents: Document[]): Array<{ source: string; content: string }> {
  return documents.map(doc => ({
    source: doc.source || 'unknown',
    content: doc.content.substring(0, 200) + '...', // First 200 chars
  }));
}


