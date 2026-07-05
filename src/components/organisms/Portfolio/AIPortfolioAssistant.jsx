import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCollection } from '../../../hooks/useCollection.js';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase.js';
import { askGemini } from '../../../services/geminiService.js';
import ReactMarkdown from 'react-markdown';

const SUGGESTIONS = [
  'What is my total investment?',
  'What is my current portfolio value?',
  'Which mutual fund has the highest return?',
  'Which stock has the highest return?',
  'Show underperforming investments.',
  'Suggest portfolio rebalancing.'
];

export default function AIPortfolioAssistant({ isAuthorized, user }) {
  const holdings = useCollection('holdings', [], user);
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Portfolio Assistant. I can help analyze your mutual funds, stock investments, performance metrics, and suggest rebalancing advice. Ask me anything!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!db || !user) return;
    const unsub = onSnapshot(doc(db, 'portfolioSummary', 'family_summary'), (snap) => {
      if (snap.exists()) setSummary(snap.data());
    }, (error) => {
      console.warn("AIPortfolioAssistant onSnapshot error:", error);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Construct structured data context for Gemini
  const contextData = useMemo(() => {
    let context = 'Investment Portfolio Status & Details:\n';

    if (summary) {
      context += `- Total Invested: ₹${summary.totalInvested || 0}\n`;
      context += `- Current Portfolio Value: ₹${summary.totalCurrent || 0}\n`;
      context += `- Overall Gain/Loss: ₹${summary.overallGainLoss || 0} (${(summary.absoluteReturn || 0).toFixed(2)}% absolute return)\n`;
      context += `- Portfolio CAGR: ${(summary.cagr || 0).toFixed(2)}%\n`;
      context += `- Portfolio XIRR: ${(summary.xirr || 0).toFixed(2)}%\n`;
      context += `- Total Invested in Mutual Funds: ₹${summary.totalMFInvestment || 0}\n`;
      context += `- Current Value of Mutual Funds: ₹${summary.totalMFCurrentValue || 0}\n`;
      context += `- Total Invested in Stocks: ₹${summary.totalStockInvestment || 0}\n`;
      context += `- Current Value of Stocks: ₹${summary.totalStockCurrentValue || 0}\n`;
    }

    if (holdings.items.length > 0) {
      context += '\nHolding details:\n';
      holdings.items.forEach(h => {
        if (h.type === 'mutualFund') {
          const invested = parseFloat(h.purchaseValue) || 0;
          const current = (parseFloat(h.units) || 0) * (parseFloat(h.nav) || 0);
          const returns = invested > 0 ? ((current - invested) / invested) * 100 : 0;
          context += `- Mutual Fund: ${h.schemeName}, Folio: ${h.folio}, Units: ${h.units}, NAV: ${h.nav}, Purchase Cost: ₹${invested}, Current Value: ₹${current.toFixed(2)}, Returns: ${returns.toFixed(2)}%\n`;
        } else if (h.type === 'stock') {
          const qty = parseFloat(h.quantity) || 0;
          const cost = qty * (parseFloat(h.averagePrice) || 0);
          const current = qty * (parseFloat(h.currentPrice) || 0);
          const returns = cost > 0 ? ((current - cost) / cost) * 100 : 0;
          context += `- Stock: ${h.company} (${h.symbol}), Shares: ${h.quantity}, Avg Price: ₹${h.averagePrice}, Current Price: ₹${h.currentPrice}, Purchase Cost: ₹${cost.toFixed(2)}, Current Value: ₹${current.toFixed(2)}, Returns: ${returns.toFixed(2)}%\n`;
        }
      });
    } else {
      context += '\nNo active holdings found in database. Please import NSDL CAS PDF statement first.\n';
    }

    return context;
  }, [summary, holdings.items]);

  const handleSend = async (text) => {
    if (!text.trim() || loading) return;
    
    const userQuery = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setLoading(true);

    try {
      const reply = await askGemini(userQuery, contextData, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Gemini error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '550px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
      
      {/* Messages area */}
      <div style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '75%',
            background: m.role === 'user' ? 'var(--teal)' : 'rgba(61, 63, 52, 0.04)',
            color: m.role === 'user' ? '#ffffff' : 'var(--ink)',
            padding: '10px 16px',
            borderRadius: m.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            fontSize: '0.88rem',
            lineHeight: 1.5
          }}>
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'rgba(61, 63, 52, 0.04)',
            color: 'var(--muted)',
            padding: '10px 16px',
            borderRadius: '16px 16px 16px 0',
            fontSize: '0.88rem',
            fontStyle: 'italic'
          }}>
            AI is thinking…
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input / controls area */}
      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#ffffff' }}>
        {/* Suggestion tags */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid var(--line)',
                background: 'rgba(61,63,52,0.02)',
                color: 'var(--ink)',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Text Input bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="search-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question about your portfolio here…"
            disabled={loading}
            style={{ width: '100%', margin: 0 }}
          />
          <button type="submit" className="btn btn--primary" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
