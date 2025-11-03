import { useState } from 'react';
import Chat from './components/Chat';
import About from './components/About';
import './App.css';

function App() {
  const [tab, setTab] = useState<'chat' | 'about'>('chat');
  return (
    <div className="app">
      <header className="app-header">
        <h1>Course Notes RAG Assistant</h1>
        <p>Ask questions about your course materials</p>
      </header>
      <nav className="app-nav">
        <button
          className={tab === 'chat' ? 'active' : ''}
          onClick={() => setTab('chat')}
        >
          Chat
        </button>
        <button
          className={tab === 'about' ? 'active' : ''}
          onClick={() => setTab('about')}
        >
          About
        </button>
      </nav>
      {tab === 'chat' ? <Chat /> : <About />}
    </div>
  );
}

export default App;


