import React, { useMemo } from 'react';
import MetricCard from '../molecules/MetricCard.jsx';
import ProgressBar from '../atoms/ProgressBar.jsx';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { MOCK_ORDERS } from './PurchasesTracker.jsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getMonthName(date = new Date()) {
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export default function OverviewDashboard({ financeItems, gymItems, activityItems, calendarItems }) {
  const thisMonth = new Date().toISOString().slice(0, 7);

  const monthFinance = useMemo(() =>
    financeItems.filter(t => (t.date || '').startsWith(thisMonth)),
    [financeItems, thisMonth]
  );
  const purchasesTotal = useMemo(() => {
    let total = 0;
    for (const order of MOCK_ORDERS) {
      const d = new Date(order.date);
      if (d.getDate() >= 25) d.setMonth(d.getMonth() + 1);
      const cycleMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (cycleMonth === thisMonth) {
        total += (order.totalAmount || 0);
      }
    }
    return total;
  }, [thisMonth]);

  const totalIncome  = monthFinance.filter(t => t.type === 'Income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpenseRaw = monthFinance.filter(t => t.type === 'Expense').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = totalExpenseRaw + purchasesTotal;
  const netSavings   = totalIncome - totalExpense;

  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const gymThisWeek = gymItems.filter(g => {
    const d = new Date(g.date);
    return d >= thisWeekStart;
  }).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActivity = activityItems.find(a => a.date === todayStr);
  const habitsDone = todayActivity?.habits?.filter(h => h.done).length || 0;
  const habitsTotal = todayActivity?.habits?.length || 5;

  // Upcoming events (next 3)
  const now = new Date();
  const upcoming = calendarItems
    .filter(e => e.date && new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // Last 6 months finance trend
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const items = financeItems.filter(t => (t.date || '').startsWith(key));
      const income  = items.filter(t => t.type === 'Income').reduce((s, t) => s + (t.amount || 0), 0);
      const expense = items.filter(t => t.type === 'Expense').reduce((s, t) => s + (t.amount || 0), 0);
      months.push({ month: label, Income: income, Expense: expense });
    }
    return months;
  }, [financeItems]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Welcome Banner */}
      <div className="welcome-card">
        <p className="welcome-card__greeting">
          {getGreeting()}, Amit, Sweta & Amishi! 🌿
        </p>
        <p className="welcome-card__sub">{getMonthName()} — AppsWebNet Dashboard Overview</p>
        <div className="welcome-stats">
          <div className="welcome-stat">
            <div className="welcome-stat__num">{fmt(netSavings)}</div>
            <div className="welcome-stat__label">Net Savings this month</div>
          </div>
          <div className="welcome-stat">
            <div className="welcome-stat__num">{gymThisWeek}</div>
            <div className="welcome-stat__label">Gym sessions this week</div>
          </div>
          <div className="welcome-stat">
            <div className="welcome-stat__num">{habitsDone}/{habitsTotal}</div>
            <div className="welcome-stat__label">Habits today</div>
          </div>
          <div className="welcome-stat">
            <div className="welcome-stat__num">{upcoming.length}</div>
            <div className="welcome-stat__label">Upcoming events</div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <MetricCard
          label="Income this Month"
          value={fmt(totalIncome)}
          detail={`${monthFinance.filter(t => t.type === 'Income').length} transactions`}
          icon="💰"
          tone="pine"
        />
        <MetricCard
          label="Expenses this Month"
          value={fmt(totalExpense)}
          detail={`${monthFinance.filter(t => t.type === 'Expense').length} transactions`}
          icon="🛒"
          tone="coral"
        />
        <MetricCard
          label="Net Savings"
          value={fmt(netSavings)}
          detail={totalIncome > 0 ? `${Math.round((netSavings / totalIncome) * 100)}% savings rate` : 'No income data'}
          icon="🏦"
          tone={netSavings >= 0 ? 'teal' : 'coral'}
        />
        <MetricCard
          label="Gym Sessions"
          value={`${gymThisWeek} this week`}
          detail={`${gymItems.length} total logged`}
          icon="🏋️"
          tone="amber"
        />
      </div>

      {/* Finance Trend + Upcoming Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 16 }}>
        {/* Finance Trend Chart */}
        <div className="section-card" style={{ padding: '20px 20px 12px' }}>
          <p className="eyebrow">6-Month Finance Trend</p>
          <h3 style={{ marginBottom: 16 }}>Income vs Expenses</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#31553e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#31553e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c2644a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#c2644a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,63,52,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5f665f' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#5f665f' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} width={48} />
                <Tooltip
                  formatter={(v, n) => [fmt(v), n]}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgba(61,63,52,0.12)', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="Income"  stroke="#31553e" strokeWidth={2} fill="url(#gIncome)" />
                <Area type="monotone" dataKey="Expense" stroke="#c2644a" strokeWidth={2} fill="url(#gExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="section-card" style={{ padding: '20px' }}>
          <p className="eyebrow">Upcoming Events</p>
          <h3 style={{ marginBottom: 14 }}>Family Calendar</h3>
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No upcoming events. Add one in the Family Calendar!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map((ev, i) => (
                <div key={i} style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid var(--line)',
                  display: 'flex', gap: 12, alignItems: 'center'
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: ev.tag === 'amishi' ? 'var(--amber-soft)' : ev.tag === 'sweta' ? 'var(--teal-soft)' : 'var(--pine-soft)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)'
                  }}>
                    <span style={{ fontSize: '1rem' }}>
                      {ev.tag === 'amishi' ? '🌟' : ev.tag === 'sweta' ? '💼' : '🏠'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ev.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                      {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {ev.time ? ` · ${ev.time}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Budget Progress */}
      <div className="snapshot-grid">
        <div className="snapshot-panel">
          <p className="eyebrow">Finance Health</p>
          <h3>Budget Overview</h3>
          <ProgressBar
            label="Expenses vs Income"
            value={totalExpense}
            total={totalIncome || 1}
            tone={totalExpense > totalIncome ? 'coral' : 'teal'}
          />
          <ProgressBar
            label="Savings Rate"
            value={Math.max(0, netSavings)}
            total={totalIncome || 1}
            tone="pine"
          />
        </div>

        <div className="snapshot-panel">
          <p className="eyebrow">Activity This Week</p>
          <h3>Amishi's Progress</h3>
          <ProgressBar
            label="Gym Goal (4 sessions/week)"
            value={gymThisWeek}
            total={4}
            tone="amber"
          />
          <ProgressBar
            label={`Daily Habits (${habitsDone}/${habitsTotal})`}
            value={habitsDone}
            total={habitsTotal}
            tone="teal"
          />
        </div>
      </div>
    </div>
  );
}
