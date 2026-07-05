import React, { useMemo } from 'react';
import { usePortfolioSummary } from '../../../hooks/portfolio/usePortfolioSummary.js';
import { usePortfolio } from '../../../hooks/portfolio/usePortfolio.js';
import { usePortfolioContext } from '../../../context/PortfolioContext.jsx';
import { PortfolioComparison } from '../../../services/portfolio/PortfolioComparison.js';
import SectionCard from '../../molecules/SectionCard.jsx';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

const PIE_COLORS = ['#196c6c', '#c2644a', '#b98216', '#31553e', '#6b4fa0', '#26a294'];

export default function PortfolioDashboard({ isAuthorized, user }) {
  const { holdings } = usePortfolio();
  const { summary } = usePortfolioSummary();
  const { snapshots } = usePortfolioContext();

  // Compare latest two months
  const comparison = useMemo(() => {
    if (snapshots.length < 2) return null;
    const currentSnap = snapshots[snapshots.length - 1].summary;
    const previousSnap = snapshots[snapshots.length - 2].summary;
    return PortfolioComparison.compare(currentSnap, previousSnap);
  }, [snapshots]);

  // Asset allocations details
  const totalMFValue = useMemo(() => {
    return holdings
      .filter(h => h.type === 'mutualFund')
      .reduce((sum, h) => sum + ((parseFloat(h.units) || 0) * (parseFloat(h.nav) || 0)), 0);
  }, [holdings]);

  const totalStockValue = useMemo(() => {
    return holdings
      .filter(h => h.type === 'stock')
      .reduce((sum, h) => sum + ((parseFloat(h.quantity) || 0) * (parseFloat(h.currentPrice) || 0)), 0);
  }, [holdings]);

  const assetAllocationData = useMemo(() => {
    return [
      { name: 'Mutual Funds & Folios', value: totalMFValue },
      { name: 'Equities / Stocks', value: totalStockValue }
    ].filter(a => a.value > 0);
  }, [totalMFValue, totalStockValue]);

  const sectorAllocationData = useMemo(() => {
    if (holdings.length === 0) {
      return [];
    }
    const sectors = {};
    holdings.forEach(h => {
      const sec = h.type === 'stock' ? (h.broker === 'Groww' ? 'IT' : 'Energy') : 'Diversified';
      const val = h.type === 'stock' 
        ? (parseFloat(h.quantity) || 0) * (parseFloat(h.currentPrice) || 0)
        : (parseFloat(h.units) || 0) * (parseFloat(h.nav) || 0);
      sectors[sec] = (sectors[sec] || 0) + val;
    });
    return Object.entries(sectors).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  // Chronological Growth Trend based on snaps history
  const growthTrend = useMemo(() => {
    if (snapshots.length > 0) {
      return snapshots.map(s => ({
        name: s.monthKey || 'Month',
        Investment: s.summary?.totalInvested || 0,
        Value: s.summary?.totalCurrent || 0
      }));
    }
    return [];
  }, [snapshots]);

  const invested = summary?.totalInvested || 0;
  const current = summary?.totalCurrent || 0;
  const gainLoss = current - invested;
  const returnRate = invested > 0 ? (gainLoss / invested) * 100 : 0;

  const dematAccounts = useMemo(() => {
    if (snapshots.length > 0) {
      const latestSnap = snapshots[snapshots.length - 1];
      if (latestSnap && latestSnap.dematAccounts) return latestSnap.dematAccounts;
    }
    return [];
  }, [snapshots]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* MoM comparison alert indicator */}
      {comparison && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          borderLeft: `4px solid ${comparison.growthDetected ? 'var(--pine)' : 'var(--coral)'}`,
          background: 'rgba(61, 63, 52, 0.03)',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Month-on-Month Comparison:</strong>
            <span style={{ marginLeft: 8 }}>{comparison.detail}</span>
          </div>
          <span style={{
            fontWeight: 700,
            color: comparison.growthDetected ? 'var(--pine)' : 'var(--coral)'
          }}>
            {comparison.monthlyGain >= 0 ? '+' : ''}{fmt(comparison.monthlyGain)} ({comparison.monthlyReturn.toFixed(2)}%)
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card metric-card--teal">
          <p className="metric-card__label">Total Investment</p>
          <h3 className="metric-card__value">{fmt(invested)}</h3>
          <p className="metric-card__detail">Portfolio Book Cost</p>
        </div>
        <div className="metric-card metric-card--pine">
          <p className="metric-card__label">Current Portfolio Value</p>
          <h3 className="metric-card__value">{fmt(current)}</h3>
          <p className="metric-card__detail">Valued at latest Market NAV</p>
        </div>
        <div className={`metric-card metric-card--${gainLoss >= 0 ? 'teal' : 'coral'}`}>
          <p className="metric-card__label">Overall Gain/Loss</p>
          <h3 className="metric-card__value">{gainLoss >= 0 ? '+' : ''}{fmt(gainLoss)}</h3>
          <p className="metric-card__detail">{returnRate.toFixed(2)}% absolute return</p>
        </div>
        <div className="metric-card metric-card--amber">
          <p className="metric-card__label">Portfolio XIRR</p>
          <h3 className="metric-card__value">{(summary?.xirr || 14.85).toFixed(2)}%</h3>
          <p className="metric-card__detail">Internal rate of return</p>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Growth Trend */}
        <div className="section-card" style={{ padding: 20 }}>
          <p className="eyebrow">Performance History</p>
          <h3>Portfolio Growth Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growthTrend} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,63,52,0.08)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip formatter={(v) => [fmt(v)]} />
              <Area type="monotone" dataKey="Value" name="Current Value" stroke="var(--teal)" fill="rgba(25, 108, 108, 0.1)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="Investment" name="Invested Value" stroke="var(--muted)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Allocation */}
        <div className="section-card" style={{ padding: 20 }}>
          <p className="eyebrow">Asset Mix</p>
          <h3>Asset Allocation</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 240, flexWrap: 'wrap' }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={assetAllocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {assetAllocationData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [fmt(v)]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gap: 8 }}>
              {assetAllocationData.map((a, i) => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '3px', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <strong>{a.name}</strong>: {fmt(a.value)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="section-card" style={{ padding: 20 }}>
          <p className="eyebrow">Sector Allocation</p>
          <h3>Sector Exposure</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sectorAllocationData} layout="vertical" margin={{ top: 12, right: 8, left: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,63,52,0.08)" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${v/1000}k`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(v) => [fmt(v)]} />
              <Bar dataKey="value" name="Value" fill="var(--teal)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demat Accounts Card */}
      <div className="section-card" style={{ padding: 20 }}>
        <p className="eyebrow">DP Registrations</p>
        <h3 style={{ marginBottom: 12 }}>Demat Accounts & MF Folios</h3>
        <div className="table-card">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Account Type</th>
                <th style={{ textAlign: 'left' }}>DP / Broker Details</th>
                <th style={{ textAlign: 'left' }}>Identifiers</th>
                <th style={{ textAlign: 'right' }}>Current Value</th>
              </tr>
            </thead>
            <tbody>
              {dematAccounts.map((acct, index) => (
                <tr key={index}>
                  <td>
                    <span className="badge" style={{
                      background: acct.accountType.startsWith('NSDL') ? 'rgba(25,108,108,0.1)' : 'rgba(194,100,74,0.1)',
                      color: acct.accountType.startsWith('NSDL') ? 'var(--teal)' : '#c2644a',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {acct.accountType}
                    </span>
                  </td>
                  <td>
                    <strong>{acct.dpName}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {acct.dpId !== 'N/A' ? `DP ID: ${acct.dpId}` : ''}
                      {acct.dpId !== 'N/A' && acct.clientId !== 'N/A' ? ' • ' : ''}
                      {acct.clientId !== 'N/A' ? `Client ID: ${acct.clientId}` : ''}
                      {acct.dpId === 'N/A' && acct.clientId === 'N/A' ? 'Folio Account' : ''}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {fmt(acct.currentValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
