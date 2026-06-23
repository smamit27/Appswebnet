import React, { useState, useMemo, useCallback } from 'react';
import SectionCard from '../molecules/SectionCard.jsx';
import StatusPill from '../atoms/StatusPill.jsx';
import ProgressBar from '../atoms/ProgressBar.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

const INCOME_CATEGORIES  = ['Salary', 'Freelance', 'Rental Income', 'Business', 'Investment', 'Gift', 'Other Income'];
const EXPENSE_CATEGORIES = ['Groceries', 'Utilities', 'Rent / EMI', 'Medical', 'Education', 'Transport', 'Dining', 'Entertainment', 'Clothing', 'Household', 'Insurance', 'Subscriptions', 'Other Expense'];

const PIE_COLORS = ['#196c6c', '#c2644a', '#b98216', '#31553e', '#6b4fa0', '#c24a6b', '#26a294', '#e67e22'];

const EMPTY_FORM = { date: new Date().toISOString().slice(0, 10), type: 'Expense', category: 'Groceries', amount: '', note: '' };

export default function SwetaFinance({ items, isAuthorized, onAdd, onDelete }) {
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType]  = useState('All');
  const [search, setSearch]          = useState('');
  const [activeTab, setActiveTab]    = useState('table');

  const monthItems = useMemo(() =>
    items.filter(t => !filterMonth || (t.date || '').startsWith(filterMonth)),
    [items, filterMonth]
  );

  const filtered = useMemo(() => {
    let arr = monthItems;
    if (filterType !== 'All') arr = arr.filter(t => t.type === filterType);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(t =>
        [t.category, t.note, t.type, String(t.amount)].join(' ').toLowerCase().includes(q)
      );
    }
    return arr.sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
  }, [monthItems, filterType, search]);

  const totalIncome  = monthItems.filter(t => t.type === 'Income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = monthItems.filter(t => t.type === 'Expense').reduce((s, t) => s + (t.amount || 0), 0);
  const netSavings   = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category breakdown for pie chart
  const expenseByCat = useMemo(() => {
    const map = {};
    monthItems.filter(t => t.type === 'Expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + (t.amount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthItems]);

  // 6-month trend
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key   = d.toISOString().slice(0, 7);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const its = items.filter(t => (t.date || '').startsWith(key));
      months.push({
        month: label,
        Income:  its.filter(t => t.type === 'Income').reduce((s, t) => s + (t.amount || 0), 0),
        Expense: its.filter(t => t.type === 'Expense').reduce((s, t) => s + (t.amount || 0), 0),
      });
    }
    return months;
  }, [items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value) || '') : value,
      ...(name === 'type' ? { category: value === 'Income' ? 'Salary' : 'Groceries' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.date) return;
    setSaving(true);
    await onAdd(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  const handleExport = useCallback(() => {
    const data = filtered.map(t => ({
      Date: t.date, Type: t.type, Category: t.category, Amount: t.amount, Note: t.note || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `sweta-finance-${filterMonth || 'all'}.xlsx`);
  }, [filtered, filterMonth]);

  const categories = form.type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Finance</p>
          <h1>Sweta's Income & Expenses</h1>
          <p className="page-header__sub">Track your earnings, spending, and savings in one place.</p>
        </div>
        <div className="page-header__actions">
          {isAuthorized && (
            <button className="btn btn--primary" id="add-transaction-btn" onClick={() => setShowForm(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Transaction
            </button>
          )}
          <button className="btn btn--secondary" onClick={handleExport}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card metric-card--pine">
          <p className="metric-card__label">Total Income</p>
          <h3 className="metric-card__value">{fmt(totalIncome)}</h3>
          <p className="metric-card__detail">{monthItems.filter(t => t.type === 'Income').length} transactions</p>
        </div>
        <div className="metric-card metric-card--coral">
          <p className="metric-card__label">Total Expenses</p>
          <h3 className="metric-card__value">{fmt(totalExpense)}</h3>
          <p className="metric-card__detail">{monthItems.filter(t => t.type === 'Expense').length} transactions</p>
        </div>
        <div className={`metric-card metric-card--${netSavings >= 0 ? 'teal' : 'coral'}`}>
          <p className="metric-card__label">Net Savings</p>
          <h3 className="metric-card__value">{fmt(netSavings)}</h3>
          <p className="metric-card__detail">{savingsRate}% savings rate</p>
        </div>
        <div className="metric-card metric-card--amber">
          <p className="metric-card__label">Largest Expense</p>
          <h3 className="metric-card__value">
            {expenseByCat[0] ? fmt(expenseByCat[0].value) : '—'}
          </h3>
          <p className="metric-card__detail">{expenseByCat[0]?.name || 'No expenses yet'}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 16 }}>
        {/* Bar Chart */}
        <div className="section-card" style={{ padding: '20px 20px 12px' }}>
          <p className="eyebrow">6-Month Trend</p>
          <h3 style={{ marginBottom: 16 }}>Income vs Expenses</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,63,52,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5f665f' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#5f665f' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} width={48} />
                <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ borderRadius: 12, border: '1px solid rgba(61,63,52,0.12)', fontSize: 12 }} />
                <Bar dataKey="Income"  fill="#31553e" radius={[4,4,0,0]} />
                <Bar dataKey="Expense" fill="#c2644a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="section-card" style={{ padding: '20px' }}>
          <p className="eyebrow">This Month</p>
          <h3 style={{ marginBottom: 16 }}>Expense Breakdown</h3>
          {expenseByCat.length > 0 ? (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenseByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {expenseByCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [fmt(v)]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.85rem', marginTop: 40, textAlign: 'center' }}>
              No expense data for this month.
            </p>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <SectionCard
        badge="Transactions"
        title="All Transactions"
        subtitle="Filter by month, type, or search by category and note."
      >
        <div className="toolbar">
          <div className="toolbar__left">
            <input
              type="month"
              className="search-input"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
            />
            <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div className="toolbar__right">
            <input
              type="search"
              className="search-input"
              placeholder="Search transactions…"
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
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Note</th>
                {isAuthorized && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((t, i) => (
                <tr key={t.id || i}>
                  <td>{t.date || '—'}</td>
                  <td><StatusPill value={t.type} /></td>
                  <td>{t.category}</td>
                  <td className={t.type === 'Income' ? 'amount--income' : 'amount--expense'}>
                    {t.type === 'Income' ? '+' : '-'}{fmt(t.amount)}
                  </td>
                  <td><span className="sub">{t.note || '—'}</span></td>
                  {isAuthorized && (
                    <td>
                      <button
                        className="btn btn--danger btn--sm btn--icon"
                        onClick={() => onDelete(t.id)}
                        title="Delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr className="empty-row"><td colSpan={isAuthorized ? 6 : 5}>No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Budget Progress */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <ProgressBar label="Expenses vs Income" value={totalExpense} total={totalIncome || 1}
              tone={totalExpense > totalIncome ? 'coral' : 'teal'} />
          </div>
          <div>
            <ProgressBar label="Savings Rate" value={Math.max(0, netSavings)} total={totalIncome || 1} tone="pine" />
          </div>
        </div>
      </SectionCard>

      {/* Add Transaction Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Add Transaction</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid form-grid--2" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Category</label>
                  <select name="category" value={form.category} onChange={handleChange}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Amount (₹)</label>
                  <input type="number" name="amount" value={form.amount} onChange={handleChange}
                    placeholder="0" min="0" step="0.01" required />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Note (optional)</label>
                  <input type="text" name="note" value={form.note} onChange={handleChange} placeholder="e.g. Grocery run at D-Mart" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
