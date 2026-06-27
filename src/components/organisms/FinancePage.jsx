import React, { useState } from 'react';
import FinanceTracker from './FinanceTracker.jsx';
import UploadStatementModal from './UploadStatementModal.jsx';

const PEOPLE = [
  { id: 'sweta', label: 'Sweta', emoji: '💼', color: 'var(--teal)' },
  { id: 'amit',  label: 'Amit',  emoji: '👔', color: 'var(--pine)' },
];

export default function FinancePage({ isAuthorized }) {
  const [activePerson, setActivePerson] = useState('sweta');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const person = PEOPLE.find(p => p.id === activePerson);

  return (
    <div style={{ display: 'grid', gap: 20, position: 'relative' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Finance</p>
          <h1>Income & Expenses</h1>
          <p className="page-header__sub">
            Monthly cashflow tracker for Sweta & Amit — income sources, expense ledger, and closing balance.
          </p>
        </div>
        <div className="page-header__actions">
          {isAuthorized && (
            <button className="btn btn--secondary" onClick={() => setIsUploadModalOpen(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload Statement
            </button>
          )}
        </div>
      </div>

      {/* Person Selector */}
      <div className="person-tabs" style={{ marginBottom: 0 }}>
        {PEOPLE.map(p => (
          <button
            key={p.id}
            className={`person-tab ${activePerson === p.id ? 'person-tab--active' : ''}`}
            onClick={() => setActivePerson(p.id)}
            id={`finance-tab-${p.id}`}
          >
            <span style={{ fontSize: '1.1rem' }}>{p.emoji}</span>
            {p.label}
            {activePerson === p.id && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: p.color, display: 'inline-block', marginLeft: 2
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Finance Tracker for selected person */}
      <FinanceTracker
        key={activePerson}
        person={activePerson}
        personLabel={person.label}
        isAuthorized={isAuthorized}
        refreshTrigger={refreshTrigger}
      />

      <UploadStatementModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}
