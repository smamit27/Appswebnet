import React, { useMemo } from 'react';
import { useStocks } from '../../../hooks/portfolio/useStocks.js';
import SectionCard from '../../molecules/SectionCard.jsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

export default function PortfolioStocks({ isAuthorized, user }) {
  const { stocks: stockItems, loading } = useStocks();

  const totalInvestment = useMemo(() => {
    return stockItems.reduce((sum, h) => {
      const q = parseFloat(h.quantity) || 0;
      const avg = parseFloat(h.averagePrice) || 0;
      return sum + (q * avg);
    }, 0);
  }, [stockItems]);

  const totalCurrentValue = useMemo(() => {
    return stockItems.reduce((sum, h) => {
      const q = parseFloat(h.quantity) || 0;
      const currentPrice = parseFloat(h.currentPrice) || 0;
      return sum + (q * currentPrice);
    }, 0);
  }, [stockItems]);

  const totalProfit = totalCurrentValue - totalInvestment;
  const overallReturn = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Metrics Row */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card metric-card--teal">
          <p className="metric-card__label">Invested in Equities / Stocks</p>
          <h3 className="metric-card__value">{fmt(totalInvestment)}</h3>
          <p className="metric-card__detail">{stockItems.length} companies owned</p>
        </div>
        <div className="metric-card metric-card--pine">
          <p className="metric-card__label">Current Market Value</p>
          <h3 className="metric-card__value">{fmt(totalCurrentValue)}</h3>
          <p className="metric-card__detail">Valued at latest market price</p>
        </div>
        <div className={`metric-card metric-card--${totalProfit >= 0 ? 'teal' : 'coral'}`}>
          <p className="metric-card__label">Absolute Return / Gain</p>
          <h3 className="metric-card__value">{totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}</h3>
          <p className="metric-card__detail">{overallReturn.toFixed(2)}% returns rate</p>
        </div>
      </div>

      {/* Stock Table Section */}
      <SectionCard
        badge="Equities Ledger"
        title="Stock Holdings"
        subtitle="Detailed list of stock holdings imported from NSDL CAS."
      >
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Ticker Symbol</th>
                <th>Shares Quantity</th>
                <th>Average Buy Price</th>
                <th>Current Price</th>
                <th>Invested Value</th>
                <th>Current Value</th>
                <th>Profit / Loss</th>
                <th>Return %</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.length > 0 ? stockItems.map((item, i) => {
                const qty = parseFloat(item.quantity) || 0;
                const avg = parseFloat(item.averagePrice) || 0;
                const currentPrice = parseFloat(item.currentPrice) || 0;
                const cost = qty * avg;
                const value = qty * currentPrice;
                const profit = value - cost;
                const returns = cost > 0 ? (profit / cost) * 100 : 0;

                return (
                  <tr key={item.id || i}>
                    <td>
                      <div>
                        <strong>{item.company}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                          ISIN: {item.isin || 'N/A'} • Demat: {item.dematAccount || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', padding: '4px 8px', borderRadius: 6 }}>{item.symbol}</span></td>
                    <td><strong>{qty}</strong></td>
                    <td>{fmt(avg)}</td>
                    <td>{fmt(currentPrice)}</td>
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
                <tr className="empty-row"><td colSpan="9">No stock holdings found. Upload NSDL CAS PDF to import.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
