import React, { useMemo } from 'react';
import { useCollection } from '../../../hooks/useCollection.js';
import SectionCard from '../../molecules/SectionCard.jsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

export default function PortfolioAnalytics({ isAuthorized, user }) {
  const holdings = useCollection('holdings', [], user);

  // Asset allocations details
  const stats = useMemo(() => {
    let mfInvested = 0;
    let mfCurrent = 0;
    let stockInvested = 0;
    let stockCurrent = 0;

    holdings.items.forEach(h => {
      if (h.type === 'mutualFund') {
        const cost = parseFloat(h.purchaseValue) || 0;
        const current = (parseFloat(h.units) || 0) * (parseFloat(h.nav) || 0);
        mfInvested += cost;
        mfCurrent += current;
      } else if (h.type === 'stock') {
        const cost = (parseFloat(h.quantity) || 0) * (parseFloat(h.averagePrice) || 0);
        const current = (parseFloat(h.quantity) || 0) * (parseFloat(h.currentPrice) || 0);
        stockInvested += cost;
        stockCurrent += current;
      }
    });

    const totalInvested = mfInvested + stockInvested || 1;
    const mfRatio = (mfCurrent / (mfCurrent + stockCurrent || 1)) * 100;
    const stockRatio = (stockCurrent / (mfCurrent + stockCurrent || 1)) * 100;

    return {
      mfInvested,
      mfCurrent,
      stockInvested,
      stockCurrent,
      totalInvested,
      totalCurrent: mfCurrent + stockCurrent,
      mfRatio,
      stockRatio
    };
  }, [holdings.items]);

  // Sub-metrics chart breakdown
  const comparisonData = [
    { name: 'Mutual Funds', Invested: stats.mfInvested, Current: stats.mfCurrent },
    { name: 'Stocks', Invested: stats.stockInvested, Current: stats.stockCurrent }
  ];

  // Rebalancing suggestion
  const rebalancingAdvice = useMemo(() => {
    if (stats.stockRatio > 65) {
      return {
        type: 'WARNING',
        text: 'Your portfolio is heavily skewed towards Equities (Stocks) at ' + stats.stockRatio.toFixed(1) + '%. Consider shifting 15% towards stable Mutual Funds/Debt to reduce exposure risks.',
        color: 'var(--coral)'
      };
    }
    if (stats.mfRatio > 80) {
      return {
        type: 'TIP',
        text: 'Your portfolio is predominantly Mutual Funds (' + stats.mfRatio.toFixed(1) + '%). Consider adding blue-chip dividend stocks (e.g. TCS, Reliance) to boost overall CAGR yields.',
        color: 'var(--amber)'
      };
    }
    return {
      type: 'OK',
      text: 'Your portfolio allocation is well balanced (approx. ' + stats.mfRatio.toFixed(0) + '% Mutual Funds and ' + stats.stockRatio.toFixed(0) + '% Stocks). Maintain current SIPs.',
      color: 'var(--pine)'
    };
  }, [stats]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Performance Comparison Chart */}
        <div className="section-card" style={{ padding: 20 }}>
          <p className="eyebrow">Asset Class Performance</p>
          <h3>Mutual Funds vs Stocks Value</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comparisonData} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,63,52,0.08)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip formatter={v => [fmt(v)]} />
              <Legend />
              <Bar dataKey="Invested" name="Invested Amount" fill="#6b7280" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Current" name="Current Value" fill="var(--teal)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio Rebalancing advisor */}
        <div className="section-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p className="eyebrow">Advisor Engine</p>
            <h3>Allocation & Rebalancing</h3>
            <p className="sub" style={{ marginTop: 8, marginBottom: 16 }}>
              Automated rebalancing advisory checking equity ratios against standard target allocations (60/40 Equity-to-MF split).
            </p>

            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(61, 63, 52, 0.04)', display: 'grid', gap: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mutual Funds Share:</span>
                <strong>{stats.mfRatio.toFixed(1)}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Equities / Stocks Share:</span>
                <strong>{stats.stockRatio.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          <div style={{
            padding: 12,
            borderRadius: 8,
            borderLeft: `4px solid ${rebalancingAdvice.color}`,
            background: 'var(--card)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <strong style={{ fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: rebalancingAdvice.color, display: 'block', marginBottom: 4 }}>
              Recommendation ({rebalancingAdvice.type})
            </strong>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.4, color: 'var(--ink)' }}>{rebalancingAdvice.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
