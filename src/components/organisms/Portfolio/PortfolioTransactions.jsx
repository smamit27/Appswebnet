import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../../hooks/portfolio/useTransactions.js';
import SectionCard from '../../molecules/SectionCard.jsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

export default function PortfolioTransactions({ isAuthorized, user }) {
  const { transactions, loading } = useTransactions();
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');

  const filteredTx = useMemo(() => {
    let list = [...transactions];
    if (filterType !== 'All') {
      list = list.filter(t => t.assetType === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => 
        (t.name || '').toLowerCase().includes(q) ||
        (t.isin || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, filterType, search]);

  const txPillStyle = (type) => {
    switch (type) {
      case 'BUY': return { bg: '#e6f7ed', color: '#26a294', border: '#c2ebd0' };
      case 'SELL': return { bg: '#fff3f3', color: '#ef4444', border: '#fca5a5' };
      case 'SIP': return { bg: '#e8f4fd', color: '#1d4ed8', border: '#bfdbfe' };
      case 'DIVIDEND': return { bg: '#fffbe6', color: '#b98216', border: '#fef08a' };
      default: return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <SectionCard
        badge="Transaction History"
        title="Portfolio Transactions"
        subtitle="Log of all historical stock trades, mutual fund SIP allocations, dividends, and redemptions."
      >
        <div className="toolbar">
          <div className="toolbar__left">
            <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="All">All Asset Types</option>
              <option value="mutualFund">Mutual Funds</option>
              <option value="stock">Stocks</option>
            </select>
          </div>
          <div className="toolbar__right">
            <input
              type="search"
              className="search-input"
              placeholder="Search scheme or stock symbol…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Asset Type</th>
                <th>Asset Name</th>
                <th>Tx Type</th>
                <th>Units / Qty</th>
                <th>Price per Unit</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length > 0 ? filteredTx.map((tx, i) => {
                const style = txPillStyle(tx.type);
                return (
                  <tr key={tx.id || i}>
                    <td>{tx.date || '—'}</td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem' }}>
                        {tx.assetType === 'mutualFund' ? '📈 Mutual Fund' : '💼 Stock'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{tx.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>
                          ISIN: {tx.isin || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td><strong>{parseFloat(tx.units || 0).toFixed(3)}</strong></td>
                    <td>{fmt(tx.price)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{fmt(tx.amount)}</td>
                  </tr>
                );
              }) : (
                <tr className="empty-row"><td colSpan="7">No transaction logs available. Import a PDF CAS statement to begin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
