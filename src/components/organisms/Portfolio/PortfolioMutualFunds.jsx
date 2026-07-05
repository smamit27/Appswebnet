import React, { useMemo } from 'react';
import { useMutualFunds } from '../../../hooks/portfolio/useMutualFunds.js';
import SectionCard from '../../molecules/SectionCard.jsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

export default function PortfolioMutualFunds({ isAuthorized, user }) {
  const { mutualFunds: mfItems, loading } = useMutualFunds();

  const totalInvestment = useMemo(() => {
    return mfItems.reduce((sum, h) => sum + (parseFloat(h.purchaseValue) || 0), 0);
  }, [mfItems]);

  const totalCurrentValue = useMemo(() => {
    return mfItems.reduce((sum, h) => {
      const u = parseFloat(h.units) || 0;
      const nav = parseFloat(h.nav) || 0;
      return sum + (u * nav);
    }, 0);
  }, [mfItems]);

  const totalProfit = totalCurrentValue - totalInvestment;
  const overallReturn = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Metrics Row */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card metric-card--teal">
          <p className="metric-card__label">Invested in Mutual Funds</p>
          <h3 className="metric-card__value">{fmt(totalInvestment)}</h3>
          <p className="metric-card__detail">{mfItems.length} active schemes</p>
        </div>
        <div className="metric-card metric-card--pine">
          <p className="metric-card__label">Current Market Value</p>
          <h3 className="metric-card__value">{fmt(totalCurrentValue)}</h3>
          <p className="metric-card__detail">Valued at latest NAV</p>
        </div>
        <div className={`metric-card metric-card--${totalProfit >= 0 ? 'teal' : 'coral'}`}>
          <p className="metric-card__label">Absolute Return / Gain</p>
          <h3 className="metric-card__value">{totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}</h3>
          <p className="metric-card__detail">{overallReturn.toFixed(2)}% returns rate</p>
        </div>
      </div>

      {/* MF Grid Section */}
      <SectionCard
        badge="Mutual Funds Ledger"
        title="Mutual Fund Schemes"
        subtitle="Detailed list of mutual fund holdings imported from NSDL CAS."
      >
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Folio</th>
                <th>Units</th>
                <th>Purchase Cost</th>
                <th>Current NAV</th>
                <th>Invested Amount</th>
                <th>Current Value</th>
                <th>Profit / Loss</th>
                <th>Return %</th>
              </tr>
            </thead>
            <tbody>
              {mfItems.length > 0 ? mfItems.map((item, i) => {
                const units = parseFloat(item.units) || 0;
                const cost = parseFloat(item.purchaseValue) || 0;
                const avgNav = units > 0 ? cost / units : 0;
                const currentNav = parseFloat(item.nav) || 0;
                const value = units * currentNav;
                const profit = value - cost;
                const returns = cost > 0 ? (profit / cost) * 100 : 0;

                const amc = item.schemeName.split(' ')[0] || 'Mutual Fund';

                return (
                  <tr key={item.id || i}>
                    <td>
                      <div>
                        <strong>{item.schemeName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                          AMC: {amc} • Category: Equity FlexiCap
                        </div>
                      </div>
                    </td>
                    <td>{item.folio || '—'}</td>
                    <td><strong>{units.toFixed(3)}</strong></td>
                    <td>{fmt(avgNav)}</td>
                    <td>{fmt(currentNav)}</td>
                    <td>{fmt(cost)}</td>
                    <td>{fmt(value)}</td>
                    <td style={{ color: profit >= 0 ? 'var(--pine)' : 'var(--coral)', fontWeight: 700 }}>
                      {profit >= 0 ? '+' : ''}{fmt(profit)}
                    </td>
                    <td>
                      <span className={`status-pill ${returns >= 0 ? 'status-pill--active' : 'status-pill--pending'}`} style={{
                        background: returns >= 0 ? '#e6f7ed' : '#fff3f3',
                        color: returns >= 0 ? '#26a294' : '#ef4444'
                      }}>
                        {returns >= 0 ? '+' : ''}{returns.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr className="empty-row"><td colSpan="9">No mutual fund holdings found. Upload NSDL CAS PDF to import.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
