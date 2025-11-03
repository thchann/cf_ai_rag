import { useState, useRef, useEffect } from 'react';
import { sendQuery } from '../utils/api';
import './Chat.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ source: string; content: string }>;
  id: string;
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create session ID
  const getSessionId = (): string => {
    let sessionId = localStorage.getItem('rag-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rag-session-id', sessionId);
    }
    return sessionId;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      id: `msg-${Date.now()}-user`,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendQuery(input.trim(), getSessionId());
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        id: `msg-${Date.now()}-assistant`,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorText = error instanceof Error 
        ? `Error: ${error.message}` 
        : 'Sorry, I encountered an error. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content: errorText,
        id: `msg-${Date.now()}-error`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>Welcome! Ask me anything about your course notes.</p>
            <p className="examples">
              Try: "What is reinforcement learning?" or "Explain A* search"
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-content">
              <div className="message-header">
                <strong>{msg.role === 'user' ? 'You' : 'Assistant'}</strong>
              </div>
              <div className="message-text">{msg.content}</div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="sources">
                  <strong>Sources:</strong>
                  <ul>
                    {msg.sources.map((source, idx) => (
                      <li key={idx}>
                        <span className="source-name">{source.source}</span>
                        <span className="source-preview">{source.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about your course notes..."
          rows={1}
          disabled={loading}
          className="input-field"
        />
        <button 
          onClick={handleSend} 
          disabled={loading || !input.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;

