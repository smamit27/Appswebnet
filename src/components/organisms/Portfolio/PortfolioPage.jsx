import React, { useState } from 'react';
import PortfolioDashboard from './PortfolioDashboard.jsx';
import PortfolioMutualFunds from './PortfolioMutualFunds.jsx';
import PortfolioStocks from './PortfolioStocks.jsx';
import PortfolioTransactions from './PortfolioTransactions.jsx';
import PortfolioAnalytics from './PortfolioAnalytics.jsx';
import PortfolioReports from './PortfolioReports.jsx';
import PortfolioSettings from './PortfolioSettings.jsx';
import AIPortfolioAssistant from './AIPortfolioAssistant.jsx';
import { PortfolioProvider } from '../../../context/PortfolioContext.jsx';

export default function PortfolioPage({ isAuthorized, user }) {
  return (
    <PortfolioProvider user={user}>
      <PortfolioInner isAuthorized={isAuthorized} user={user} />
    </PortfolioProvider>
  );
}

function PortfolioInner({ isAuthorized, user }) {
  const [subTab, setSubTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'mutual_funds', label: '📈 Mutual Funds' },
    { id: 'stocks', label: '💼 Stocks' },
    { id: 'transactions', label: '📝 Transactions' },
    { id: 'analytics', label: '⚙️ Analytics' },
    { id: 'reports', label: '📥 Reports' },
    { id: 'ai_assistant', label: '🤖 AI Assistant' },
    { id: 'settings', label: '📁 Upload CAS' }
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Sub-Navigation Tabs */}
      <div className="portfolio-subnav" style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '6px',
        background: 'rgba(61, 63, 52, 0.04)',
        borderRadius: '12px',
        border: '1px solid var(--line)'
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              background: subTab === t.id ? '#ffffff' : 'transparent',
              color: subTab === t.id ? 'var(--ink)' : 'var(--muted)',
              boxShadow: subTab === t.id ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Render Sub-Tab Component */}
      <div className="portfolio-content" style={{ animation: 'rise-in 0.3s ease-out' }}>
        {subTab === 'dashboard' && <PortfolioDashboard isAuthorized={isAuthorized} user={user} />}
        {subTab === 'mutual_funds' && <PortfolioMutualFunds isAuthorized={isAuthorized} user={user} />}
        {subTab === 'stocks' && <PortfolioStocks isAuthorized={isAuthorized} user={user} />}
        {subTab === 'transactions' && <PortfolioTransactions isAuthorized={isAuthorized} user={user} />}
        {subTab === 'analytics' && <PortfolioAnalytics isAuthorized={isAuthorized} user={user} />}
        {subTab === 'reports' && <PortfolioReports isAuthorized={isAuthorized} user={user} />}
        {subTab === 'ai_assistant' && <AIPortfolioAssistant isAuthorized={isAuthorized} user={user} />}
        {subTab === 'settings' && <PortfolioSettings isAuthorized={isAuthorized} user={user} />}
      </div>
    </div>
  );
}
