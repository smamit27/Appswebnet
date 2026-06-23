import React, { useState } from 'react';
import FinanceTracker from './FinanceTracker.jsx';

const PEOPLE = [
  { id: 'sweta', label: 'Sweta', emoji: '💼', color: 'var(--teal)' },
  { id: 'amit',  label: 'Amit',  emoji: '👔', color: 'var(--pine)' },
];

export default function FinancePage({ isAuthorized }) {
  const [activePerson, setActivePerson] = useState('sweta');
  const person = PEOPLE.find(p => p.id === activePerson);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Finance</p>
          <h1>Income & Expenses</h1>
          <p className="page-header__sub">
            Monthly cashflow tracker for Sweta & Amit — income sources, expense ledger, and closing balance.
          </p>
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
      />
    </div>
  );
}
