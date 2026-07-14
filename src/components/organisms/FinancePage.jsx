import React, { useState } from 'react';
import FinanceTracker from './FinanceTracker.jsx';

export default function FinancePage({ isAuthorized, user }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const activePerson = 'family';

  return (
    <div style={{ display: 'grid', gap: 20, position: 'relative' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Finance</p>
          <h1>Income & Expenses</h1>
          <p className="page-header__sub">
            Monthly cashflow tracker — income sources, expense ledger, and closing balance.
          </p>
        </div>
      </div>

      {/* Finance Tracker */}
      <FinanceTracker
        key={activePerson}
        person={activePerson}
        personLabel="Family"
        isAuthorized={isAuthorized}
        user={user}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}

