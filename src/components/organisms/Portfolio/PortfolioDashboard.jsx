import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { db } from '../../../firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/* ─── Formatters ────────────────────────────────────────────── */
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const fmt = (v) => INR.format(v || 0);
const RADIAN = Math.PI / 180;

/* ════════════════════════════════════════════════════════════════
   AMIT SINGH — NSDL CAS Data (as on 31-May-2026)
   ════════════════════════════════════════════════════════════════ */
const AMIT = {
  name: 'AMIT SINGH',
  pan: 'DQXXXXX8H',
  dpName: 'ICICI BANK LIMITED',
  dpId: 'IN303028',
  clientId: '63571278',
  asOn: '31-May-2026',
  total: 5250016.11,
  color: '#9b2226',
  monthly: [
    { month: 'MAY 2025', value: 5128334.57, change: null,       pct: null   },
    { month: 'JUN 2025', value: 5329537.31, change: 201202.73,  pct: 3.92   },
    { month: 'JUL 2025', value: 5134212.41, change: -195324.90, pct: -3.66  },
    { month: 'AUG 2025', value: 5099675.15, change: -34537.26,  pct: -0.67  },
    { month: 'SEP 2025', value: 5241274.02, change: 141598.87,  pct: 2.78   },
    { month: 'OCT 2025', value: 5502179.97, change: 260905.95,  pct: 4.98   },
    { month: 'NOV 2025', value: 5567207.51, change: 65027.53,   pct: 1.18   },
    { month: 'DEC 2025', value: 5605865.89, change: 38658.39,   pct: 0.69   },
    { month: 'JAN 2026', value: 5511685.84, change: -94180.06,  pct: -1.68  },
    { month: 'FEB 2026', value: 5464986.99, change: -46698.85,  pct: -0.85  },
    { month: 'MAR 2026', value: 4848132.94, change: -616854.04, pct: -11.29 },
    { month: 'APR 2026', value: 5336213.56, change: 488080.61,  pct: 10.07  },
    { month: 'MAY 2026', value: 5250016.11, change: -86197.45,  pct: -1.62  },
  ],
  composition: [
    { assetClass: 'Equities (E)',               value: 2534280.84, pct: 48.27, color: '#9b2226' },
    { assetClass: 'Mutual Funds (M)',            value: 1006572.13, pct: 19.17, color: '#3a7d44' },
    { assetClass: 'Mutual Fund Folios (F)',      value: 1709163.14, pct: 32.56, color: '#264F8B' },
    { assetClass: 'Preference Shares (P)',       value: 0, pct: 0 },
    { assetClass: 'Specialized Fund (SD)',       value: 0, pct: 0 },
    { assetClass: 'Alternate Investment (A)',    value: 0, pct: 0 },
    { assetClass: 'Corporate Bonds (C)',         value: 0, pct: 0 },
    { assetClass: 'Sovereign Gold Bonds (SGB)',  value: 0, pct: 0 },
    { assetClass: 'National Pension System (N)', value: 0, pct: 0 },
  ],
};

/* ════════════════════════════════════════════════════════════════
   SWETA GUPTA — NSDL CAS Data (as on 30-Apr-2026)
   ════════════════════════════════════════════════════════════════ */
const SWETA = {
  name: 'SWETA GUPTA',
  pan: 'BQXXXXX9G',
  dpName: 'ICICI BANK LIMITED',
  dpId: 'IN303028',
  clientId: '71876999',
  asOn: '30-Apr-2026',
  total: 1432565.43,
  color: '#264F8B',
  monthly: [
    { month: 'APR 2025', value: 1075502.16, change: null,       pct: null   },
    { month: 'MAY 2025', value: 1216955.01, change: 141452.85,  pct: 13.15  },
    { month: 'JUN 2025', value: 1253589.47, change: 36634.46,   pct: 3.01   },
    { month: 'JUL 2025', value: 1196446.11, change: -57143.36,  pct: -4.56  },
    { month: 'AUG 2025', value: 1154043.70, change: -42402.41,  pct: -3.54  },
    { month: 'SEP 2025', value: 1202051.87, change: 48008.17,   pct: 4.16   },
    { month: 'OCT 2025', value: 1239383.34, change: 37331.47,   pct: 3.11   },
    { month: 'NOV 2025', value: 1240495.96, change: 1112.62,    pct: 0.09   },
    { month: 'DEC 2025', value: 1315446.30, change: 74950.34,   pct: 6.04   },
    { month: 'JAN 2026', value: 1399324.97, change: 83878.67,   pct: 6.38   },
    { month: 'FEB 2026', value: 1374722.14, change: -24602.83,  pct: -1.76  },
    { month: 'MAR 2026', value: 1280440.90, change: -94281.24,  pct: -6.86  },
    { month: 'APR 2026', value: 1432565.43, change: 152124.53,  pct: 11.88  },
  ],
  composition: [
    { assetClass: 'Equities (E)',               value: 497100.36,  pct: 34.70, color: '#9b2226' },
    { assetClass: 'Mutual Fund Folios (F)',      value: 935465.07,  pct: 65.30, color: '#264F8B' },
    { assetClass: 'Mutual Funds (M)',            value: 0, pct: 0 },
    { assetClass: 'Preference Shares (P)',       value: 0, pct: 0 },
    { assetClass: 'Specialized Fund (SD)',       value: 0, pct: 0 },
    { assetClass: 'Alternate Investment (A)',    value: 0, pct: 0 },
    { assetClass: 'Corporate Bonds (C)',         value: 0, pct: 0 },
    { assetClass: 'Sovereign Gold Bonds (SGB)',  value: 0, pct: 0 },
    { assetClass: 'National Pension System (N)', value: 0, pct: 0 },
  ],
};

/* ════════════════════════════════════════════════════════════════
   COMBINED OVERVIEW DATA
   ════════════════════════════════════════════════════════════════ */
const COMBINED_TOTAL = AMIT.total + SWETA.total; // 6,682,581.54

// Overlap months for combined trend (May 2025 – Apr 2026 both have data)
const OVERLAP_MONTHS = ['MAY 2025','JUN 2025','JUL 2025','AUG 2025','SEP 2025',
  'OCT 2025','NOV 2025','DEC 2025','JAN 2026','FEB 2026','MAR 2026','APR 2026'];

const COMBINED_TREND = OVERLAP_MONTHS.map(m => {
  const amitRow = AMIT.monthly.find(r => r.month === m);
  const swetaRow = SWETA.monthly.find(r => r.month === m);
  return {
    month: m,
    Amit: amitRow?.value || 0,
    Sweta: swetaRow?.value || 0,
    Combined: (amitRow?.value || 0) + (swetaRow?.value || 0),
  };
});

// Combined composition
const COMBINED_EQUITIES  = AMIT.composition[0].value + SWETA.composition[0].value; // 3,031,381.20
const COMBINED_MF        = AMIT.composition[1].value + 0;                           // 1,006,572.13
const COMBINED_MF_FOLIOS = AMIT.composition[2].value + SWETA.composition[1].value;  // 2,644,628.21

/* ─── Shared Donut Label ─────────────────────────────────────── */
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, assetClass }) => {
  const label = typeof name === 'string' ? name : (typeof assetClass === 'string' ? assetClass : '');
  if (!label) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  // Extract short letter from parentheses e.g. 'Equities (E)' → 'E', else last word
  const match = label.match(/\(([^)]+)\)$/);
  const shortName = match ? match[1] : label.split(' ').pop();
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {shortName}
    </text>
  );
};

/* ─── Bar Tooltip ────────────────────────────────────────────── */
const BarTip = ({ active, payload, label, data }) => {
  if (!active || !payload?.length) return null;
  const row = data?.find(r => r.month === label);
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,.1)', fontSize: '0.82rem', minWidth: 190 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 3 }}>
        <span style={{ color: '#64748b' }}>Portfolio Value</span>
        <strong>{fmt(payload[0]?.value)}</strong>
      </div>
      {row?.change != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
          <span style={{ color: '#64748b' }}>Monthly Change</span>
          <strong style={{ color: row.change >= 0 ? '#16a34a' : '#dc2626' }}>
            {row.change >= 0 ? '+' : ''}{fmt(row.change)} ({row.pct >= 0 ? '+' : ''}{row.pct}%)
          </strong>
        </div>
      )}
    </div>
  );
};


/* ─── Person Bar Chart with tooltip ─────────────────────────── */
function PersonChart({ monthlyData, color }) {
  const barData = monthlyData.map(m => ({ month: m.month, value: m.value, change: m.change, pct: m.pct }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={barData} margin={{ top: 8, right: 10, left: 0, bottom: 44 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 9.5, fill: '#64748b' }} angle={-40} textAnchor="end" interval={0} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} axisLine={false} tickLine={false} />
        <Tooltip content={({ active, payload, label }) => <BarTip active={active} payload={payload} label={label} data={barData} />} cursor={{ fill: `${color}15` }} />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={38}>
          {barData.map((entry, i) => (
            <Cell key={i} fill={entry.pct === null ? color : entry.pct >= 0 ? '#3a7d44' : '#c2644a'} opacity={0.88} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Donut + Legend ─────────────────────────────────────────── */
function CompositionDonut({ pieData, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
      <ResponsiveContainer width={190} height={190}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="assetClass" labelLine={false} label={renderLabel}>
            {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v, name) => [fmt(v), name]} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'grid', gap: 10 }}>
        {pieData.map(d => (
          <div key={d.assetClass} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.83rem' }}>
            <span style={{ width: 13, height: 13, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>{d.assetClass}</div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{fmt(d.value)} · {((d.value / total) * 100).toFixed(2)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Monthly Table ──────────────────────────────────────────── */
function MonthlyTable({ data, accentColor }) {
  return (
    <div className="table-card" style={{ fontSize: '0.8rem' }}>
      <table style={{ width: '100%' }}>
        <thead>
          <tr style={{ fontSize: '0.8rem' }}>
            <th style={{ textAlign: 'left' }}>Month</th>
            <th style={{ textAlign: 'right' }}>Value</th>
            <th style={{ textAlign: 'right' }}>MoM Change</th>
            <th style={{ textAlign: 'right' }}>% Change</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.month} style={{ background: i === data.length - 1 ? `${accentColor}08` : undefined, fontSize: '0.8rem' }}>
              <td style={{ fontWeight: i === data.length - 1 ? 700 : 500 }}>
                {row.month}
                {i === data.length - 1 && (
                  <span style={{ marginLeft: 6, fontSize: '0.62rem', background: accentColor, color: '#fff', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>LATEST</span>
                )}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{fmt(row.value)}</td>
              <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: row.change === null ? '#94a3b8' : row.change >= 0 ? '#16a34a' : '#dc2626' }}>
                {row.change === null ? 'NA' : `${row.change >= 0 ? '+' : ''}${fmt(row.change)}`}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600, color: row.pct === null ? '#94a3b8' : row.pct >= 0 ? '#16a34a' : '#dc2626' }}>
                {row.pct === null ? 'NA' : `${row.pct >= 0 ? '+' : ''}${row.pct}%`}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--line)', background: `${accentColor}08`, fontSize: '0.8rem' }}>
            <td colSpan={3} style={{ fontWeight: 700, color: accentColor, paddingTop: 10 }}>Current Total Value</td>
            <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: accentColor }}>
              {fmt(data[data.length - 1]?.value)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─── Composition Table ──────────────────────────────────────── */
function CompositionTable({ rows, total, accentColor }) {
  return (
    <div className="table-card" style={{ fontSize: '0.8rem' }}>
      <table style={{ width: '100%' }}>
        <thead>
          <tr style={{ fontSize: '0.8rem' }}>
            <th style={{ textAlign: 'left' }}>Asset Class</th>
            <th style={{ textAlign: 'right' }}>Value</th>
            <th style={{ textAlign: 'right' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.assetClass} style={{ opacity: row.value === 0 ? 0.4 : 1, fontSize: '0.8rem' }}>
              <td style={{ fontWeight: row.value > 0 ? 600 : 400 }}>
                {row.assetClass}
                {row.value > 0 && <span style={{ marginLeft: 6, width: 8, height: 8, borderRadius: '50%', background: row.color || accentColor, display: 'inline-block', verticalAlign: 'middle' }} />}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{row.value > 0 ? fmt(row.value) : '0.00'}</td>
              <td style={{ textAlign: 'right', color: row.value > 0 ? 'inherit' : '#94a3b8' }}>{row.pct.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--line)', fontWeight: 800, fontSize: '0.8rem' }}>
            <td>TOTAL</td>
            <td style={{ textAlign: 'right', fontFamily: 'monospace', color: accentColor }}>{fmt(total)}</td>
            <td style={{ textAlign: 'right', color: accentColor }}>100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ─── Account Info Card ──────────────────────────────────────── */
function AccountCard({ person, accentColor }) {
  const fields = [
    { label: 'Account Holder', value: person.name, highlight: true },
    { label: 'PAN Number', value: person.pan },
    { label: 'Depository', value: 'NSDL · Technology, Trust & Reach' },
    { label: 'Depository Participant', value: person.dpName },
    { label: 'DP ID', value: person.dpId },
    { label: 'Client ID', value: person.clientId },
    { label: 'Statement Date', value: `As on ${person.asOn}` },
    { label: 'Account Type', value: 'NSDL Demat Account' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      {fields.map(f => (
        <div key={f.label} style={{ padding: '12px 16px', background: f.highlight ? `${accentColor}0a` : 'rgba(61,63,52,0.03)', borderRadius: 10, border: `1px solid ${f.highlight ? `${accentColor}25` : 'var(--line)'}` }}>
          <div style={{ fontSize: '0.71rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>{f.label}</div>
          <div style={{ fontWeight: f.highlight ? 800 : 600, fontSize: f.highlight ? '0.97rem' : '0.88rem', color: f.highlight ? accentColor : 'var(--ink)' }}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Header Banner ──────────────────────────────────────────── */
function HeaderBanner({ name, total, asOn, momChange, momPct, dpName, dpId, clientId, gradient, momLabel }) {
  return (
    <div style={{ background: gradient, borderRadius: 16, padding: '26px 30px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.75, textTransform: 'uppercase', marginBottom: 6 }}>
          NSDL Consolidated Portfolio · {name}
        </div>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {fmt(total)}
        </div>
        <div style={{ marginTop: 8, fontSize: '0.84rem', opacity: 0.8 }}>Holdings as on {asOn}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
        {momChange !== undefined && (
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 16px', backdropFilter: 'blur(8px)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: 2 }}>MoM Change ({momLabel})</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: momChange < 0 ? '#fca5a5' : '#86efac' }}>
              {momChange >= 0 ? '+' : ''}{fmt(momChange)}
            </div>
            <div style={{ fontSize: '0.78rem', color: momChange < 0 ? '#fca5a5' : '#86efac' }}>
              {momPct >= 0 ? '+' : ''}{momPct}%
            </div>
          </div>
        )}
        {dpName && (
          <div style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 10, padding: '8px 16px', textAlign: 'right', fontSize: '0.78rem', opacity: 0.85 }}>
            <div style={{ fontWeight: 700 }}>{dpName}</div>
            <div style={{ opacity: 0.75 }}>DP: {dpId} · Client: {clientId}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ════════════════════════════════════════════════════════════════ */
function OverviewTab({ amitTotal, swetaTotal, combinedTotal, combinedPie }) {
  return (
    <div style={{ display: 'grid', gap: 22 }}>

      {/* Combined header */}
      <HeaderBanner
        name="Amit + Sweta (Family)"
        total={combinedTotal}
        asOn="Apr–May 2026"
        gradient="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
      />

      {/* Side-by-side metric cards */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #9b2226 0%, #b5451b 100%)', color: '#fff', border: 'none' }}>
          <p className="metric-card__label" style={{ color: 'rgba(255,255,255,0.75)' }}>Amit's Portfolio</p>
          <h3 className="metric-card__value" style={{ color: '#fff' }}>{fmt(amitTotal)}</h3>
          <p className="metric-card__detail" style={{ color: 'rgba(255,255,255,0.65)' }}>as on {AMIT.asOn}</p>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #264F8B 0%, #1d3a6e 100%)', color: '#fff', border: 'none' }}>
          <p className="metric-card__label" style={{ color: 'rgba(255,255,255,0.75)' }}>Sweta's Portfolio</p>
          <h3 className="metric-card__value" style={{ color: '#fff' }}>{fmt(swetaTotal)}</h3>
          <p className="metric-card__detail" style={{ color: 'rgba(255,255,255,0.65)' }}>as on {SWETA.asOn}</p>
        </div>
        <div className="metric-card" style={{ background: 'linear-gradient(135deg, #0f3460 0%, #533483 100%)', color: '#fff', border: 'none' }}>
          <p className="metric-card__label" style={{ color: 'rgba(255,255,255,0.75)' }}>Combined Family Total</p>
          <h3 className="metric-card__value" style={{ color: '#fff' }}>{fmt(combinedTotal)}</h3>
          <p className="metric-card__detail" style={{ color: 'rgba(255,255,255,0.65)' }}>Amit + Sweta</p>
        </div>
        <div className="metric-card metric-card--teal">
          <p className="metric-card__label">Amit's Share</p>
          <h3 className="metric-card__value">{combinedTotal > 0 ? ((amitTotal / combinedTotal) * 100).toFixed(1) : 0}%</h3>
          <p className="metric-card__detail">of family portfolio</p>
        </div>
        <div className="metric-card metric-card--pine">
          <p className="metric-card__label">Sweta's Share</p>
          <h3 className="metric-card__value">{combinedTotal > 0 ? ((swetaTotal / combinedTotal) * 100).toFixed(1) : 0}%</h3>
          <p className="metric-card__detail">of family portfolio</p>
        </div>
      </div>

      {/* Combined line chart */}
      <div className="section-card" style={{ padding: 24 }}>
        <p className="eyebrow">Combined Performance History</p>
        <h3 style={{ marginBottom: 4 }}>Family Portfolio Monthly Trend</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 20 }}>May 2025 – Apr 2026 · Amit &amp; Sweta overlapping period</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={COMBINED_TREND} margin={{ top: 10, right: 16, left: 0, bottom: 44 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9.5, fill: '#64748b' }} angle={-40} textAnchor="end" interval={0} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v, name) => [fmt(v), name]} />
            <Legend wrapperStyle={{ paddingTop: 50, fontSize: '0.82rem' }} />
            <Line type="monotone" dataKey="Amit" stroke="#9b2226" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Sweta" stroke="#264F8B" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Combined" stroke="#7c3aed" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 4, fontSize: '0.78rem', color: '#64748b' }}>
          <span><span style={{ display: 'inline-block', width: 20, height: 3, background: '#9b2226', marginRight: 5, verticalAlign: 'middle', borderRadius: 2 }} />Amit</span>
          <span><span style={{ display: 'inline-block', width: 20, height: 3, background: '#264F8B', marginRight: 5, verticalAlign: 'middle', borderRadius: 2 }} />Sweta</span>
          <span><span style={{ display: 'inline-block', width: 20, height: 3, background: '#7c3aed', marginRight: 5, verticalAlign: 'middle', borderRadius: 2, opacity: 0.7 }} />Combined</span>
        </div>
      </div>

      {/* Combined composition row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="section-card" style={{ padding: 24 }}>
          <p className="eyebrow">Asset Mix</p>
          <h3 style={{ marginBottom: 4 }}>Combined Portfolio Composition</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16 }}>Amit + Sweta combined holdings</p>
          <CompositionDonut pieData={combinedPie} total={combinedTotal} />
        </div>
        <div className="section-card" style={{ padding: 24 }}>
          <p className="eyebrow">Family Asset Breakdown</p>
          <h3 style={{ marginBottom: 16 }}>Combined Asset Class Table</h3>
          <CompositionTable rows={combinedPie} total={combinedTotal} accentColor="#7c3aed" />
        </div>
      </div>

      {/* Side-by-side mini summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="section-card" style={{ padding: 20, borderTop: `3px solid #9b2226` }}>
          <p className="eyebrow" style={{ color: '#9b2226' }}>Amit Singh</p>
          <h4 style={{ marginBottom: 10, fontSize: '0.9rem' }}>Latest Statement Summary</h4>
          {[
            { label: 'Total Value', value: fmt(amitTotal), bold: true },
            { label: 'Equities', value: fmt(AMIT.composition[0].value) },
            { label: 'Mutual Funds', value: fmt(AMIT.composition[1].value) },
            { label: 'MF Folios', value: fmt(AMIT.composition[2].value) },
            { label: 'As on', value: AMIT.asOn },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: '0.84rem' }}>
              <span style={{ color: '#64748b' }}>{r.label}</span>
              <strong style={{ color: r.bold ? '#9b2226' : 'var(--ink)' }}>{r.value}</strong>
            </div>
          ))}
        </div>
        <div className="section-card" style={{ padding: 20, borderTop: `3px solid #264F8B` }}>
          <p className="eyebrow" style={{ color: '#264F8B' }}>Sweta Gupta</p>
          <h4 style={{ marginBottom: 10, fontSize: '0.9rem' }}>Latest Statement Summary</h4>
          {[
            { label: 'Total Value', value: fmt(swetaTotal), bold: true },
            { label: 'Equities', value: fmt(SWETA.composition[0].value) },
            { label: 'Mutual Funds', value: '₹0.00' },
            { label: 'MF Folios', value: fmt(SWETA.composition[1].value) },
            { label: 'As on', value: SWETA.asOn },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: '0.84rem' }}>
              <span style={{ color: '#64748b' }}>{r.label}</span>
              <strong style={{ color: r.bold ? '#264F8B' : 'var(--ink)' }}>{r.value}</strong>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ─── Custom Assets Editor ─────────────────────────────────────── */
function CustomAssetsEditor({ personName, personKey, assets, onSave, isAuthorized }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    ppf: assets?.ppf || 0,
    epf: assets?.epf || 0,
    nps: assets?.nps || 0,
    fd: assets?.fd || 0
  });

  const handleSave = async () => {
    await onSave(personKey, formData);
    setEditing(false);
  };

  return (
    <div className="section-card" style={{ padding: 24, borderTop: '3px solid var(--primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <p className="eyebrow" style={{ color: 'var(--primary)' }}>Retirement &amp; Fixed Income</p>
          <h3 style={{ margin: 0 }}>Planned Assets (PPF, EPF, NPS, FD)</h3>
        </div>
        {isAuthorized && !editing && (
          <button className="btn btn--sm btn--primary" onClick={() => {
            setFormData({ ppf: assets?.ppf || 0, epf: assets?.epf || 0, nps: assets?.nps || 0, fd: assets?.fd || 0 });
            setEditing(true);
          }}>
            ✏️ Edit Balances
          </button>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { key: 'ppf', label: 'PPF (Public Provident Fund)' },
            { key: 'epf', label: 'EPF (Employee Provident Fund)' },
            { key: 'nps', label: 'NPS (National Pension System)' },
            { key: 'fd', label: 'FD (Fixed Deposits)' }
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{f.label}</label>
              <input
                type="number"
                value={formData[f.key] === 0 ? '' : formData[f.key]}
                onChange={e => setFormData({ ...formData, [f.key]: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn btn--sm btn--secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn--sm btn--primary" onClick={handleSave}>Save Balances</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { key: 'ppf', label: 'PPF Balance', val: assets?.ppf || 0, color: '#e67e22', icon: '🏦' },
            { key: 'epf', label: 'EPF Balance', val: assets?.epf || 0, color: '#d35400', icon: '💼' },
            { key: 'nps', label: 'NPS Balance', val: assets?.nps || 0, color: '#1abc9c', icon: '🪙' },
            { key: 'fd', label: 'Fixed Deposits', val: assets?.fd || 0, color: '#2ecc71', icon: '💵' }
          ].map(f => (
            <div key={f.key} style={{ padding: '14px 18px', background: 'rgba(61,63,52,0.03)', borderRadius: 12, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: '1.6rem', color: f.color }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{f.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>{fmt(f.val)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PERSON TAB (shared for Amit and Sweta)
   ════════════════════════════════════════════════════════════════ */
function PersonTab({ person, gradient, personKey, assets, onSave, isAuthorized }) {
  const latest = person.monthly[person.monthly.length - 1];
  const accentColor = person.color;
  const activePie = person.composition.filter(c => c.value > 0);

  return (
    <div style={{ display: 'grid', gap: 22 }}>

      {/* Header */}
      <HeaderBanner
        name={person.name}
        total={person.total}
        asOn={person.asOn}
        momChange={latest.change}
        momPct={latest.pct}
        momLabel={latest.month}
        dpName={person.dpName}
        dpId={person.dpId}
        clientId={person.clientId}
        gradient={gradient}
      />

      {/* Custom Assets planning */}
      <CustomAssetsEditor
        personName={person.name}
        personKey={personKey}
        assets={assets}
        onSave={onSave}
        isAuthorized={isAuthorized}
      />

      {/* Bar Chart */}
      <div className="section-card" style={{ padding: 24 }}>
        <p className="eyebrow">Performance History</p>
        <h3 style={{ marginBottom: 4 }}>Consolidated Portfolio Value — Monthly Trend</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 16 }}>
          {person.monthly[0].month} – {latest.month} · Source: NSDL CAS Statement
        </p>
        <PersonChart monthlyData={person.monthly} color={accentColor} />
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 6, fontSize: '0.78rem', color: '#64748b' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#3a7d44', marginRight: 4, verticalAlign: 'middle' }} />Positive</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#c2644a', marginRight: 4, verticalAlign: 'middle' }} />Negative</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: accentColor, marginRight: 4, verticalAlign: 'middle' }} />Base</span>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="section-card" style={{ padding: 24 }}>
        <p className="eyebrow">Statement Data</p>
        <h3 style={{ marginBottom: 16 }}>Month-wise Consolidated Portfolio Value</h3>
        <MonthlyTable data={person.monthly} accentColor={accentColor} />
      </div>

      {/* Composition */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="section-card" style={{ padding: 24 }}>
          <p className="eyebrow">Asset Mix</p>
          <h3 style={{ marginBottom: 4 }}>Portfolio Composition</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16 }}>Summary of value of holdings of {person.name}</p>
          <CompositionDonut pieData={activePie} total={person.total} />
        </div>
        <div className="section-card" style={{ padding: 24 }}>
          <p className="eyebrow">Portfolio Composition</p>
          <h3 style={{ marginBottom: 16 }}>Asset Class Breakdown</h3>
          <CompositionTable rows={person.composition} total={person.total} accentColor={accentColor} />
        </div>
      </div>

      {/* Account Details */}
      <div className="section-card" style={{ padding: 24 }}>
        <p className="eyebrow">Account Information</p>
        <h3 style={{ marginBottom: 20 }}>Demat Account &amp; Holder Details</h3>
        <AccountCard person={person} accentColor={accentColor} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function PortfolioDashboard({ isAuthorized }) {
  const [tab, setTab] = useState('overview');
  const [customAssets, setCustomAssets] = useState({
    amit: { ppf: 0, epf: 0, nps: 0, fd: 0 },
    sweta: { ppf: 0, epf: 0, nps: 0, fd: 0 }
  });

  // Load from Firestore
  useEffect(() => {
    const fetchCustomAssets = async () => {
      try {
        const docRef = doc(db, 'portfolio', 'custom_assets');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setCustomAssets({
            amit: { ppf: 0, epf: 0, nps: 0, fd: 0, ...data.amit },
            sweta: { ppf: 0, epf: 0, nps: 0, fd: 0, ...data.sweta }
          });
        }
      } catch (err) {
        console.error("Error fetching custom portfolio assets:", err);
      }
    };
    fetchCustomAssets();
  }, []);

  // Save to Firestore
  const handleSaveCustomAssets = async (personKey, fields) => {
    try {
      const nextAssets = {
        ...customAssets,
        [personKey]: {
          ...customAssets[personKey],
          ...fields
        }
      };
      setCustomAssets(nextAssets);
      const docRef = doc(db, 'portfolio', 'custom_assets');
      await setDoc(docRef, nextAssets);
      console.log("Custom portfolio assets saved successfully!");
    } catch (err) {
      console.error("Error saving custom portfolio assets:", err);
      alert("Failed to save custom assets. Please check permissions / login state.");
    }
  };

  // Calculations
  const amitPPF = Number(customAssets.amit.ppf || 0);
  const amitEPF = Number(customAssets.amit.epf || 0);
  const amitNPS = Number(customAssets.amit.nps || 0);
  const amitFD  = Number(customAssets.amit.fd || 0);
  const amitTotal = AMIT.total + amitPPF + amitEPF + amitNPS + amitFD;

  const swetaPPF = Number(customAssets.sweta.ppf || 0);
  const swetaEPF = Number(customAssets.sweta.epf || 0);
  const swetaNPS = Number(customAssets.sweta.nps || 0);
  const swetaFD  = Number(customAssets.sweta.fd || 0);
  const swetaTotal = SWETA.total + swetaPPF + swetaEPF + swetaNPS + swetaFD;

  const combinedTotal = amitTotal + swetaTotal;

  // Dynamic Composition lists
  const amitComposition = [
    { assetClass: 'Equities (E)',          value: AMIT.composition[0].value, pct: 0, color: '#9b2226' },
    { assetClass: 'Mutual Funds (M)',       value: AMIT.composition[1].value, pct: 0, color: '#3a7d44' },
    { assetClass: 'Mutual Fund Folios (F)', value: AMIT.composition[2].value, pct: 0, color: '#264F8B' },
    { assetClass: 'PPF (PPF)',              value: amitPPF,                  pct: 0, color: '#e67e22' },
    { assetClass: 'EPF (EPF)',              value: amitEPF,                  pct: 0, color: '#d35400' },
    { assetClass: 'NPS (NPS)',              value: amitNPS,                  pct: 0, color: '#1abc9c' },
    { assetClass: 'Fixed Deposits (FD)',   value: amitFD,                   pct: 0, color: '#2ecc71' },
  ].filter(c => c.value > 0 || c.assetClass.includes('Equities') || c.assetClass.includes('Mutual Fund'));
  
  amitComposition.forEach(c => {
    c.pct = amitTotal > 0 ? (c.value / amitTotal) * 100 : 0;
  });

  const swetaComposition = [
    { assetClass: 'Equities (E)',          value: SWETA.composition[0].value, pct: 0, color: '#9b2226' },
    { assetClass: 'Mutual Fund Folios (F)', value: SWETA.composition[1].value, pct: 0, color: '#264F8B' },
    { assetClass: 'PPF (PPF)',              value: swetaPPF,                  pct: 0, color: '#e67e22' },
    { assetClass: 'EPF (EPF)',              value: swetaEPF,                  pct: 0, color: '#d35400' },
    { assetClass: 'NPS (NPS)',              value: swetaNPS,                  pct: 0, color: '#1abc9c' },
    { assetClass: 'Fixed Deposits (FD)',   value: swetaFD,                   pct: 0, color: '#2ecc71' },
  ].filter(c => c.value > 0 || c.assetClass.includes('Equities') || c.assetClass.includes('Mutual Fund'));
  
  swetaComposition.forEach(c => {
    c.pct = swetaTotal > 0 ? (c.value / swetaTotal) * 100 : 0;
  });

  const combinedComposition = [
    { assetClass: 'Equities (E)',          value: COMBINED_EQUITIES,  pct: 0, color: '#9b2226' },
    { assetClass: 'Mutual Fund Folios (F)', value: COMBINED_MF_FOLIOS, color: '#264F8B', pct: 0 },
    { assetClass: 'Mutual Funds (M)',       value: COMBINED_MF,        color: '#3a7d44', pct: 0 },
    { assetClass: 'PPF (PPF)',              value: amitPPF + swetaPPF, pct: 0, color: '#e67e22' },
    { assetClass: 'EPF (EPF)',              value: amitEPF + swetaEPF, pct: 0, color: '#d35400' },
    { assetClass: 'NPS (NPS)',              value: amitNPS + swetaNPS, pct: 0, color: '#1abc9c' },
    { assetClass: 'Fixed Deposits (FD)',   value: amitFD + swetaFD,   pct: 0, color: '#2ecc71' },
  ].filter(c => c.value > 0 || c.assetClass.includes('Equities') || c.assetClass.includes('Mutual Fund'));
  
  combinedComposition.forEach(c => {
    c.pct = combinedTotal > 0 ? (c.value / combinedTotal) * 100 : 0;
  });

  const amitDynamic = {
    ...AMIT,
    total: amitTotal,
    composition: amitComposition
  };

  const swetaDynamic = {
    ...SWETA,
    total: swetaTotal,
    composition: swetaComposition
  };

  const compactFmt = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
    return fmt(v);
  };

  const tabs = [
    { id: 'overview', label: '🏠 Overview', desc: `Combined: ${compactFmt(combinedTotal)}` },
    { id: 'amit',     label: '👨 Amit',    desc: compactFmt(amitTotal) },
    { id: 'sweta',    label: '👩 Sweta',   desc: compactFmt(swetaTotal) },
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>

      {/* ── Tab Bar ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.04)', borderRadius: 14, padding: 6, border: '1px solid var(--line)', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: '1 1 auto',
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === t.id
                ? t.id === 'overview' ? 'linear-gradient(135deg, #0f3460, #7c3aed)'
                : t.id === 'amit' ? 'linear-gradient(135deg, #9b2226, #b5451b)'
                : 'linear-gradient(135deg, #264F8B, #1d3a6e)'
                : '#fff',
              color: tab === t.id ? '#fff' : '#64748b',
              boxShadow: tab === t.id ? '0 4px 14px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.05)',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.8rem' }}>{t.label}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: 1 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────── */}
      <div style={{ animation: 'rise-in 0.25s ease-out' }}>
        {tab === 'overview' && (
          <OverviewTab
            amitTotal={amitTotal}
            swetaTotal={swetaTotal}
            combinedTotal={combinedTotal}
            combinedPie={combinedComposition}
          />
        )}
        {tab === 'amit' && (
          <PersonTab
            person={amitDynamic}
            gradient="linear-gradient(135deg, #6b2737 0%, #9b2226 40%, #b5451b 100%)"
            personKey="amit"
            assets={customAssets.amit}
            onSave={handleSaveCustomAssets}
            isAuthorized={isAuthorized}
          />
        )}
        {tab === 'sweta' && (
          <PersonTab
            person={swetaDynamic}
            gradient="linear-gradient(135deg, #1d3a6e 0%, #264F8B 50%, #3b5fc0 100%)"
            personKey="sweta"
            assets={customAssets.sweta}
            onSave={handleSaveCustomAssets}
            isAuthorized={isAuthorized}
          />
        )}
      </div>
    </div>
  );
}
