import React, { useState } from 'react';
import FinanceTracker from './FinanceTracker.jsx';
import UploadStatementModal from './UploadStatementModal.jsx';

const PEOPLE = [
  { id: 'sweta', label: 'Sweta', emoji: '💼', color: 'var(--teal)' },
  { id: 'amit',  label: 'Amit',  emoji: '👔', color: 'var(--pine)' },
];

export default function FinancePage({ isAuthorized }) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div style={{ display: 'grid', gap: 20, position: 'relative' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Finance</p>
          <h1>Income & Expenses</h1>
          <p className="page-header__sub">
            Monthly cashflow tracker for the Family — income sources, expense ledger, and closing balance.
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

      {/* Finance Tracker for family */}
      <FinanceTracker
        key="family"
        person="family"
        personLabel="Family"
        isAuthorized={isAuthorized}
        refreshTrigger={refreshTrigger}
      />

      <UploadStatementModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        personId="family"
        onUploadComplete={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
}
