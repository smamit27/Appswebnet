import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, MicOff } from 'lucide-react';
import { generateContextForQuery, getTabMetrics } from '../../services/ragService';
import { askGemini, parseTransactionWithAI, transcribeAudioWithAI } from '../../services/geminiService';
import ChatMessage from './ChatMessage';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const CHAT_TABS = [
  { id: 'general', label: '🏠 General', title: 'Dashboard Overview' },
  { id: 'finance', label: '💰 Finance', title: 'Income & Expenses' },
  { id: 'purchases', label: '🛍️ Shopping', title: 'Purchases Ledger' },
  { id: 'family', label: '👨‍👩‍👧 Family', title: 'Calendar & Fees' },
  { id: 'personal', label: '🏃‍♂️ Personal', title: 'Gym Activity' }
];

const SUGGESTIONS = {
  general: [
    "What are my recent monthly savings?",
    "How many calendar events are scheduled?",
    "What was my last shopping order?"
  ],
  finance: [
    "Show my total expenses for June 2026",
    "List all my income sources for July 2026",
    "How much did we save last month?"
  ],
  purchases: [
    "What did I buy from Amazon recently?",
    "List my shopping purchases paid by Amit",
    "Show all orders above ₹2000"
  ],
  family: [
    "What events do we have on the calendar?",
    "Check if Amishi's school fees are paid",
    "What are the unpaid school fee items?"
  ],
  personal: [
    "List the recent gym logs for Sweta",
    "Show Amit's recent gym activities",
    "What workouts did Sweta log recently?"
  ]
};

export default function AIChatWindow({ isOpen, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am your Family Dashboard AI Assistant. Ask me anything about your finance, purchases, school fees, gym sessions, or calendar!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [metrics, setMetrics] = useState([]);
  const messagesEndRef = useRef(null);
  
  const suggestions = SUGGESTIONS[activeTab] || [];

  const {
    isSupported,
    isRecording,
    transcript,
    error: speechError,
    isFallbackActive,
    audioBase64,
    mimeType,
    startRecording,
    stopRecording,
    setTranscript
  } = useSpeechRecognition();

  // Reset speech states on window open/close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setTranscript('');
    }
  }, [isOpen]);

  // Handle native Web Speech API real-time input
  useEffect(() => {
    if (isRecording && transcript) {
      setInput(transcript);
    }
  }, [transcript, isRecording]);

  // Handle fallback audio transcription via Gemini
  useEffect(() => {
    async function transcribe() {
      if (isFallbackActive && !isRecording && audioBase64) {
        setIsTyping(true);
        try {
          const text = await transcribeAudioWithAI(audioBase64, mimeType);
          if (text) {
            setInput(text);
          }
        } catch (err) {
          console.error("Fallback audio transcription failed:", err);
        } finally {
          setIsTyping(false);
        }
      }
    }
    transcribe();
  }, [audioBase64, isRecording, isFallbackActive, mimeType]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    async function loadMetrics() {
      if (isOpen) {
        const data = await getTabMetrics(activeTab);
        setMetrics(data);
      }
    }
    loadMetrics();
  }, [activeTab, isOpen]);

  const saveTransactionDirectly = async (parsed) => {
    if (!db || !user) throw new Error('Database or user authentication is not available.');
    
    const [y, m, d] = parsed.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getDate() >= 25) {
      dateObj.setMonth(dateObj.getMonth() + 1);
    }
    const cycleMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    const collectionId = 'financeMonthly_family';
    const recordId = `family_${cycleMonth}`;
    const docRef = doc(db, collectionId, recordId);
    
    const snap = await getDoc(docRef);
    let incomeList = [];
    let expenseList = [];
    
    if (snap.exists()) {
      const data = snap.data();
      incomeList = data.income || [];
      expenseList = data.expenses || [];
    }
    
    const type = parsed.transactionType === 'income' ? 'income' : 'expense';
    const rowData = {
      date: parsed.date,
      amount: parsed.amount,
      category: parsed.category,
      type,
    };
    
    if (type === 'income') {
      rowData.source = parsed.entity || '';
      rowData.remark = parsed.details || '';
      rowData.creditedTo = parsed.paymentMethod || 'Amit HDFC Bank';
      incomeList.push(rowData);
    } else {
      rowData.vendor = parsed.entity || '';
      rowData.purpose = parsed.details || '';
      rowData.paymentMode = parsed.paymentMethod || 'Amit HDFC Bank';
      rowData.refNo = '';
      expenseList.push(rowData);
    }
    
    await setDoc(docRef, {
      person: 'family',
      month: cycleMonth,
      income: incomeList,
      expenses: expenseList,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    window.dispatchEvent(new CustomEvent('finance-transaction-saved'));
  };

  const handleSend = async (text) => {
    if (!text.trim() || isTyping) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsTyping(true);

    if (isRecording) {
      stopRecording();
    }

    // Intercept transaction queries
    const looksLikeTransaction = /(spent|spent\b|received|salary|income|expense|rupees|rs\.|rs\b|earned|paid|bought|purchase|starbucks|amazon|hdfc|sbi|pluxee|cash|credit card)/i.test(text);
    if (looksLikeTransaction) {
      try {
        const parsed = await parseTransactionWithAI(text, false);
        if (parsed && parsed.amount && parsed.category) {
          await saveTransactionDirectly(parsed);
          
          const typeLabel = parsed.transactionType === 'income' ? 'Income' : 'Expense';
          const entityLabel = parsed.transactionType === 'income' ? 'Source' : 'Vendor';
          const methodLabel = parsed.transactionType === 'income' ? 'Credited To' : 'Payment Method';
          const detailLabel = parsed.transactionType === 'income' ? 'Remark' : 'Purpose';
          
          const successMsg = `✅ **Transaction Saved Automatically!**

* **Type**: ${typeLabel}
* **Amount**: ₹${parsed.amount}
* **${entityLabel}**: ${parsed.entity || '—'}
* **Category**: ${parsed.category}
* **${methodLabel}**: ${parsed.paymentMethod || 'Amit HDFC Bank'}
* **${detailLabel}**: ${parsed.details || '—'}
* **Date**: ${parsed.date}

Saved to your finance dashboard successfully.`;

          setMessages(prev => [...prev, { role: 'assistant', content: successMsg }]);
          setIsTyping(false);
          return;
        }
      } catch (err) {
        console.warn("Spoken/text input did not parse as a transaction, falling back to general query...", err);
      }
    }

    try {
      // Step 1: Generate RAG Context from Firestore
      let context = await generateContextForQuery(text);
      
      // If intent parser doesn't find anything, try using activeTab context
      if (!context) {
        let fallbackQuery = "";
        if (activeTab === 'finance') fallbackQuery = "finance";
        else if (activeTab === 'purchases') fallbackQuery = "purchases";
        else if (activeTab === 'family') fallbackQuery = "calendar";
        else if (activeTab === 'personal') fallbackQuery = "gym";
        
        if (fallbackQuery) {
          context = await generateContextForQuery(fallbackQuery);
        }
      }

      if (!context) {
        setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't find any relevant data or match your query to the database." }]);
        setIsTyping(false);
        return;
      }

      // Step 2: Query Gemini
      const historyToPass = messages.slice(1);
      const answer = await askGemini(text, context, historyToPass);
      
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      console.error(error);
      const displayMsg = error.message || "Sorry, I encountered an error while retrieving or processing that information.";
      setMessages(prev => [...prev, { role: 'assistant', content: displayMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className={`ai-chat-window ${isOpen ? 'ai-chat-window--open' : ''}`}>
      <div className="ai-chat-header">
        <div className="ai-chat-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#10b981" />
            <h3>Family AI Assistant</h3>
          </div>
          <p>Ask anything about personal finance, activities, or events</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="ai-chat-tabs">
        {CHAT_TABS.map(tab => (
          <button
            key={tab.id}
            className={`ai-chat-tab-btn ${activeTab === tab.id ? 'ai-chat-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="ai-chat-messages">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        ))}
        {isTyping && <ChatMessage role="assistant" isTyping={true} />}
        
        {messages.length === 1 && (
          <>
            {/* Visual Metrics aggregate widgets */}
            {metrics && metrics.length > 0 && (
              <div className="ai-chat-metrics-container">
                <div className="ai-chat-metrics-header">
                  {CHAT_TABS.find(t => t.id === activeTab)?.title} Summary
                </div>
                <div className="ai-chat-metrics-grid">
                  {metrics.map((m, idx) => (
                    <div key={idx} className="ai-chat-metric-card">
                      <span className="ai-chat-metric-val" style={{ color: m.accent }}>{m.value}</span>
                      <span className="ai-chat-metric-lbl">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ai-chat-suggestions">
              <p className="ai-chat-suggestions-title">Suggested Questions</p>
              <div className="ai-chat-suggestions-list">
                {suggestions.map((suggestion, idx) => (
                  <button 
                    key={idx} 
                    className="ai-chat-suggestion-chip"
                    onClick={() => handleSend(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-container">
        <form onSubmit={handleSubmit} className="ai-chat-input-wrapper">
          <input
            type="text"
            placeholder={isRecording ? "Listening..." : "Type your question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isRecording}
          />
          <button
            type="button"
            className={`ai-chat-mic-btn ${isRecording ? 'ai-chat-mic-btn--active' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? "Stop recording" : "Record voice"}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isRecording ? '#8b5cf6' : '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 8px',
              transition: 'all 0.2s ease',
              transform: isRecording ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {isRecording ? <MicOff size={18} style={{ color: '#ef4444' }} /> : <Mic size={18} />}
          </button>
          <button type="submit" disabled={!input.trim() || isRecording} aria-label="Send message">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
