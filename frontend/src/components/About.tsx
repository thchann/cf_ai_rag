import './Chat.css';

function About() {
  return (
    <div className="chat-container">
      <div className="messages" style={{ paddingTop: 28 }}>
        <div className="message assistant" style={{ maxWidth: '100%' }}>
          <div className="message-content">
            <div className="message-header"><strong>About this project</strong></div>
            <div className="message-text">
              <p><strong>What is retrieval?</strong></p>
              <p>
                Retrieval augments a language model by fetching relevant passages from a
                document store during question answering. Those passages are provided to
                the model as context, improving factual accuracy and grounding responses
                in your own data.
              </p>
              <p><strong>Why this project?</strong></p>
              <p>
                This app demonstrates a minimal Retrieval-Augmented Generation (RAG)
                pipeline on Cloudflare: a Worker coordinates retrieval from D1 (and
                optionally Vectorize) and calls Workers AI to generate answers. The
                frontend provides a simple chat interface.
              </p>
              <p><strong>What to ask</strong></p>
              <ul>
                <li>Definitions: "What is reinforcement learning?"</li>
                <li>Algorithms: "Explain A* search"</li>
                <li>Comparisons: "Contrast BFS and DFS"</li>
                <li>Concepts: "What is a Markov Decision Process?"</li>
                <li>Probability: "Explain Naive Bayes assumptions"</li>
              </ul>
              <p>
                Answers include sources when matching content is found in the imported
                documents. If you see answers without sources, import more documents
                into D1.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="input-area"/>
    </div>
  );
}

export default About;


