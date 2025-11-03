/**
 * Conversation Memory
 * Handles storing and retrieving conversation history from KV
 */

import { Env, Message } from '../types';

/**
 * Get conversation history from KV
 */
export async function getConversationHistory(
  kv: KVNamespace,
  sessionId: string
): Promise<Message[]> {
  try {
    const data = await kv.get(sessionId);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as Message[];
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    return [];
  }
}

/**
 * Save conversation to KV
 * Keeps last 10 messages to prevent KV size limits
 */
export async function saveConversation(
  kv: KVNamespace,
  sessionId: string,
  query: string,
  response: string
): Promise<void> {
  try {
    // Get existing history
    const existing = await getConversationHistory(kv, sessionId);
    
    // Add new messages
    const updated: Message[] = [
      ...existing,
      { role: 'user', content: query },
      { role: 'assistant', content: response },
    ];

    // Keep last 10 messages (5 exchanges)
    const recentHistory = updated.slice(-10);

    // Save to KV with 24 hour expiration
    await kv.put(
      sessionId,
      JSON.stringify(recentHistory),
      { expirationTtl: 86400 } // 24 hours
    );
  } catch (error) {
    console.error('Error saving conversation:', error);
    // Don't throw - conversation memory is nice-to-have, not critical
  }
}


