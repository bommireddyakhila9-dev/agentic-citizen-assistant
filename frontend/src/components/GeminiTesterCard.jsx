import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, AlertTriangle, CheckCircle2 } from './Icons';
import { getAiStatus, testGeminiPrompt } from '../services/api';

export default function GeminiTesterCard() {
  const [aiStatus, setAiStatus] = useState(null);
  const [prompt, setPrompt] = useState('How can an AI agent help a citizen file and track a municipal complaint?');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const res = await getAiStatus();
    if (res.success) {
      setAiStatus(res.data);
    }
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResponse(null);

    const res = await testGeminiPrompt(prompt);
    if (res.success) {
      setResponse(res.data);
    } else {
      setError(res.error || 'Failed to query Gemini API.');
    }
    setLoading(false);
  };

  return (
    <div className="health-card" style={{ maxWidth: '820px' }}>
      <div className="health-header">
        <div className="health-title-group">
          <div className="health-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
            <Bot size={22} />
          </div>
          <div>
            <h3 className="health-title">Phase 2: Google Gemini LLM Integration</h3>
            <p className="health-endpoint">Model: {aiStatus?.model || 'gemini-1.5-flash'} • LangChain Core</p>
          </div>
        </div>

        <div>
          {aiStatus?.api_key_configured ? (
            <span className="status-pill connected">
              <CheckCircle2 size={14} /> Key Configured
            </span>
          ) : (
            <span className="status-pill connecting">
              <AlertTriangle size={14} /> Key Not Set
            </span>
          )}
        </div>
      </div>

      {!aiStatus?.api_key_configured ? (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <h4 style={{ color: '#b45309', fontSize: '0.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Gemini API Key Required for Live Reasoning
          </h4>
          <p style={{ fontSize: '0.825rem', color: '#78350f', lineHeight: 1.5 }}>
            To enable live AI generation, paste your free Gemini API key into <code>backend/.env</code>:
            <br />
            <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginTop: '6px' }}>
              GEMINI_API_KEY="AIzaSy..."
            </code>
          </p>
        </div>
      ) : (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 14px', borderRadius: '8px', fontSize: '0.825rem', marginBottom: '16px' }}>
          ✓ Gemini API is linked and ready to process citizen queries.
        </div>
      )}

      {/* Interactive Prompt Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="Ask Gemini anything about citizen assistance..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
          disabled={loading || !aiStatus?.api_key_configured}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontFamily: 'inherit',
            fontSize: '0.9rem',
          }}
        />
        <button 
          className="btn-test"
          onClick={handleSendPrompt}
          disabled={loading || !aiStatus?.api_key_configured}
        >
          <Send size={16} />
          <span>{loading ? 'Thinking...' : 'Ask Gemini'}</span>
        </button>
      </div>

      {/* Response Box */}
      {response && (
        <div style={{ background: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '10px', fontSize: '0.875rem', lineHeight: 1.6, border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>
            <Sparkles size={14} /> Gemini Response ({response.model})
          </div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{response.response}</div>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
