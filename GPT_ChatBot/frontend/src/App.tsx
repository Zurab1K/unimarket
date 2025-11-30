import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';

const DEFAULT_API_URL = 'http://localhost:5000';

function App() {
  const apiUrl = useMemo(
    () => import.meta.env.VITE_API_URL?.toString().replace(/\/$/, '') ?? DEFAULT_API_URL,
    [],
  );
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? 'Unexpected error');
      }

      const data = (await response.json()) as { response?: string };
      setAnswer(data.response ?? 'No text returned');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <p className="eyebrow">Minimal GPT Wrapper</p>
        <h1>Using OpenAI API key</h1>
        <p className="subtitle">
          Demo for project quack.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="prompt-form">
        <label htmlFor="prompt">Enter a prompt/question</label>
        <textarea
          id="prompt"
          name="prompt"
          placeholder="e.g. What is Stony Brook Computing Society"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
        />
        <div className="form-actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send to ChatGPT'}
          </button>
          <span className="hint">Targets {apiUrl}/api/chat</span>
        </div>
      </form>

      <section className="response">
        <h2>Response</h2>
        {!answer && !error && <p className="muted">Ask something to see result.</p>}
        {error && <p className="error">⚠️ {error}</p>}
        {answer && <pre>{answer}</pre>}
      </section>
    </div>
  );
}

export default App;
