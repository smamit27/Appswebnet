import React, { createContext, useContext } from 'react';

// Portfolio is now static (NSDL CAS data hardcoded in PortfolioDashboard).
// This context is kept as a safe no-op stub so any stale imports don't crash.

const PortfolioContext = createContext({
  holdings: [],
  transactions: [],
  summary: null,
  snapshots: [],
  loading: false,
  triggerReload: () => {},
});

export function PortfolioProvider({ children }) {
  return (
    <PortfolioContext.Provider value={{
      holdings: [],
      transactions: [],
      summary: null,
      snapshots: [],
      loading: false,
      triggerReload: () => {},
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

// Safe hook — returns empty defaults instead of throwing
export function usePortfolioContext() {
  return useContext(PortfolioContext);
}
