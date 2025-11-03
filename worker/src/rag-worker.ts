/**
 * Main RAG Worker
 * Handles HTTP requests and coordinates RAG pipeline
 */

import { Env, QueryRequest, QueryResponse } from './types';
import { retrieveFromVectorize } from './retrievers/vectorize-retriever';
import { retrieveFromD1 } from './retrievers/bm25-retriever';
import { ensembleRank } from './utils/ensemble-ranking';
import { buildRAGPrompt, extractSources } from './utils/prompt-builder';
import { getConversationHistory, saveConversation } from './utils/conversation-memory';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS for frontend
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Health check endpoint
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          service: 'RAG Worker',
          endpoints: ['POST /query']
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Handle /query endpoint
    if (url.pathname === '/query' || url.pathname === '/') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed. Use POST to query.', { 
          status: 405,
          headers: { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

      try {
        const body: QueryRequest = await request.json();
        const { query, sessionId = `session-${Date.now()}` } = body;

        if (!query || typeof query !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Missing or invalid query' }),
            { 
              status: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }

        // RAG Pipeline Implementation
        
        // Step 1: Parallel retrieval (Vectorize + D1/BM25)
        console.log(`[RAG] Processing query: "${query}"`);
        
        let vectorResults: any[] = [];
        let bm25Results: any[] = [];
        
        try {
          const results = await Promise.allSettled([
            retrieveFromVectorize(query, env),
            retrieveFromD1(query, env),
          ]);
          
          if (results[0].status === 'fulfilled') {
            vectorResults = results[0].value;
          } else {
            console.error('[RAG] Vectorize retrieval failed:', results[0].reason);
            vectorResults = [];
          }
          
          if (results[1].status === 'fulfilled') {
            bm25Results = results[1].value;
          } else {
            console.error('[RAG] D1/BM25 retrieval failed:', results[1].reason);
            bm25Results = [];
          }
        } catch (err) {
          console.error('[RAG] Retrieval error:', err);
          // Continue with empty results
        }

        console.log(`[RAG] Vectorize results: ${vectorResults.length}, BM25 results: ${bm25Results.length}`);

        // Step 2: Ensemble ranking (combine results with 50/50 weighting)
        const rankedDocs = ensembleRank(vectorResults, bm25Results, 0.5, 0.5);
        console.log(`[RAG] Combined results: ${rankedDocs.length} documents`);

        // Step 3: Get conversation history from KV
        let conversationHistory: any[] = [];
        try {
          conversationHistory = await getConversationHistory(env.CONVERSATIONS, sessionId);
        } catch (err) {
          console.error('[RAG] Failed to get conversation history:', err);
          conversationHistory = [];
        }
        console.log(`[RAG] Conversation history: ${conversationHistory.length} messages`);

        // Step 4: Build prompt with retrieved context
        const messages = buildRAGPrompt(rankedDocs, query, conversationHistory);
        console.log(`[RAG] Built prompt with ${messages.length} messages`);

        // Step 5: Call Workers AI LLM
        console.log(`[RAG] Calling Workers AI...`);
        
        // Check if Workers AI is available
        if (!env.AI) {
          const errorMsg = 'Workers AI is not available. Use "wrangler dev --remote" (NOT --local) or deploy to Cloudflare.';
          console.error('[RAG]', errorMsg);
          throw new Error(errorMsg);
        }
        
        let aiResponse: any;
        try {
          aiResponse = await env.AI.run(
            '@cf/meta/llama-3.1-8b-instruct',
            {
              messages: messages,
              stream: false,
            }
          );
        } catch (aiError: any) {
          console.error('[RAG] Workers AI error:', aiError);
          throw new Error(`Workers AI failed: ${aiError.message || String(aiError)}`);
        }

        // Extract response text
        // Note: Response format may vary - adjust based on actual Workers AI response
        let answer: string;
        try {
          if (typeof aiResponse === 'string') {
            answer = aiResponse;
          } else if (aiResponse.response || aiResponse.text) {
            answer = aiResponse.response || aiResponse.text;
          } else if (aiResponse.choices && aiResponse.choices[0]) {
            answer = aiResponse.choices[0].message?.content || JSON.stringify(aiResponse);
          } else {
            console.warn('[RAG] Unexpected AI response format:', JSON.stringify(aiResponse).substring(0, 200));
            answer = JSON.stringify(aiResponse);
          }
        } catch (parseError) {
          console.error('[RAG] Failed to parse AI response:', parseError);
          answer = 'Error: Failed to parse AI response. ' + JSON.stringify(aiResponse).substring(0, 200);
        }

        console.log(`[RAG] Generated answer (${answer.length} chars)`);

        // Step 6: Save conversation to KV (async, don't wait)
        saveConversation(env.CONVERSATIONS, sessionId, query, answer).catch(err => {
          console.error('[RAG] Error saving conversation:', err);
        });

        // Step 7: Extract sources for response
        const sources = extractSources(rankedDocs);

        const response: QueryResponse = {
          answer: answer,
          sources: sources,
        };

        return new Response(JSON.stringify(response), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });

      } catch (error) {
        console.error('[RAG] Error processing request:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
          }),
          { 
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
    }

    // 404 for unknown routes
    return new Response('Not found', { 
      status: 404,
      headers: { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      }
    });
  },
};

