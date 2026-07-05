import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase.js';

const PortfolioContext = createContext(null);



export function PortfolioProvider({ children, user }) {
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const triggerReload = () => setReloadKey(prev => prev + 1);

  useEffect(() => {
    if (!db || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Listen to Holdings
    const unsubHoldings = onSnapshot(collection(db, 'holdings'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHoldings(list);
    }, (error) => {
      console.warn("Holdings onSnapshot error:", error);
    });

    // 2. Listen to Transactions
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(list);
    }, (error) => {
      console.warn("Transactions onSnapshot error:", error);
    });

    // 3. Listen to Summary
    const unsubSummary = onSnapshot(doc(db, 'portfolioSummary', 'family_summary'), (snap) => {
      if (snap.exists()) {
        setSummary(snap.data());
      } else {
        setSummary(null);
      }
    }, (error) => {
      console.warn("Summary onSnapshot error:", error);
    });

    // 4. Listen to Snapshots
    const unsubSnaps = onSnapshot(collection(db, 'monthlySnapshots'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.monthKey || '').localeCompare(b.monthKey || ''));
      setSnapshots(list);
      setLoading(false);
    }, (error) => {
      console.warn("Snapshots onSnapshot error:", error);
      setLoading(false);
    });

    return () => {
      unsubHoldings();
      unsubTransactions();
      unsubSummary();
      unsubSnaps();
    };
  }, [user, reloadKey]);

  const value = {
    holdings,
    transactions,
    summary,
    snapshots,
    loading,
    triggerReload
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolioContext must be used within a PortfolioProvider');
  }
  return context;
}
