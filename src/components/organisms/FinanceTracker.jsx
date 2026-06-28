import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db, isFirebaseConfigured } from '../../firebase.js';
import { MOCK_ORDERS } from './PurchasesTracker.jsx';
import '../../finance.css';

/* ── Helpers ─────────────────────────────────────────────────────── */
const FINANCIAL_YEAR_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() - 5 + i, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

function getCurrentMonth() {
  const d = new Date();
  if (d.getDate() >= 25) {
    d.setMonth(d.getMonth() + 1);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthTab(mv) {
  const [y, m] = mv.split('-').map(Number);
  const curr = new Date(y, m - 1, 1);
  const prev = new Date(y, m - 2, 1);
  const shortPrev = prev.toLocaleString('en-US', { month: 'short' });
  const shortCurr = curr.toLocaleString('en-US', { month: 'short' });
  const yy = curr.toLocaleString('en-US', { year: '2-digit' });
  return `25 ${shortPrev} - 24 ${shortCurr} '${yy}`;
}
function formatMonthFull(mv) {
  const [y, m] = mv.split('-').map(Number);
  const curr = new Date(y, m - 1, 1);
  const prev = new Date(y, m - 2, 1);
  const longPrev = prev.toLocaleString('en-US', { month: 'long' });
  const longCurr = curr.toLocaleString('en-US', { month: 'long' });
  const yyyy = curr.getFullYear();
  return `25 ${longPrev} - 24 ${longCurr} ${yyyy}`;
}

const toNum  = (v) => parseFloat(v) || 0;
const fmtAmt = (v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SAVE_STATUS_STYLE = {
  idle:    { color: '#6b7280', icon: '●' },
  pending: { color: '#f59e0b', icon: '⏳' },
  saving:  { color: '#3b82f6', icon: '↑'  },
  saved:   { color: '#10b981', icon: '✓'  },
  error:   { color: '#ef4444', icon: '✗'  },
};

const EMPTY_INCOME  = () => ({ date: '', source: '', amount: '', remark: '', category: '', creditedTo: '' });
const EMPTY_EXPENSE = () => ({ date: '', vendor: '', amount: '', purpose: '', category: '', paymentMode: '', refNo: '' });

const CATEGORY_FILTERS = [
  { label: '🍔 Swiggy',       keyword: 'swiggy' },
  { label: '🍕 Zomato',       keyword: 'zomato' },
  { label: '📈 Mutual Fund',  keyword: 'mutual fund' },
  { label: '📦 Amazon',       keyword: 'amazon' },
  { label: '🛒 Flipkart',     keyword: 'flipkart' },
  { label: '🏬 DMart',        keyword: 'dmart' },
  { label: '🏦 Axis Bank',    keyword: 'axis' },
  { label: '🚗 Car Cleaner',  keyword: 'car cleaner' },
  { label: '📺 Netflix',      keyword: 'netflix' },
  { label: '📱 Airtel',       keyword: 'airtel' },
];

/**
 * @param {string} person   - 'sweta' | 'amit'
 * @param {string} personLabel - 'Sweta' | 'Amit'
 * @param {boolean} isAuthorized
 */
export default function FinanceTracker({ person, personLabel, isAuthorized, refreshTrigger }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [income,   setIncome]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMsg, setSaveMsg]   = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeViewTab, setActiveViewTab] = useState('compare');

  const isLoadedRef  = useRef(false);
  const autoSaveRef  = useRef(null);
  const collectionId = `financeMonthly_${person}`;       // e.g. financeMonthly_sweta
  const recordId     = `${person}_${selectedMonth}`;     // e.g. sweta_2026-06

  /* ── Load from Firestore ──────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    isLoadedRef.current = false;
    setSaveStatus('idle');
    setSaveMsg('');

    async function load() {
      setIsLoading(true);
      if (!isFirebaseConfigured || !db) {
        setIsLoading(false);
        isLoadedRef.current = true;
        setIncome([]);
        setExpenses([]);
        setSaveMsg(`Preview mode — ${formatMonthFull(selectedMonth)}`);
        return;
      }
      try {
        const snap = await getDoc(doc(db, collectionId, recordId));
        if (!cancelled) {
          if (snap.exists()) {
            const data = snap.data();
            setIncome(data.income || []);
            setExpenses(data.expenses || []);
            setSaveMsg(`${formatMonthFull(selectedMonth)}`);
          } else {
            setIncome([]);
            setExpenses([]);
            setSaveMsg(`New record — ${formatMonthFull(selectedMonth)}`);
          }
        }
      } catch (err) {
        console.error('Finance load error:', err);
        if (!cancelled) setSaveMsg('Load failed.');
      } finally {
        if (!cancelled) { setIsLoading(false); isLoadedRef.current = true; }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [recordId, collectionId, selectedMonth]);

  /* ── Save to Firestore ────────────────────────────────────────── */
  const saveToFirestore = useCallback(async (inc, exp) => {
    setSaveStatus('saving');
    if (!isFirebaseConfigured || !db) { setSaveStatus('saved'); return; }
    try {
      await setDoc(doc(db, collectionId, recordId), {
        person,
        month: selectedMonth,
        income: inc,
        expenses: exp,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaveStatus('saved');
      setSaveMsg('All changes saved ✓');
    } catch (err) {
      console.error('Finance save error:', err);
      setSaveStatus('error');
      setSaveMsg('Save failed — check connection.');
    }
  }, [collectionId, recordId, person, selectedMonth]);

  const triggerAutoSave = (inc, exp) => {
    if (!isLoadedRef.current || !isAuthorized) return;
    clearTimeout(autoSaveRef.current);
    setSaveStatus('pending');
    setSaveMsg('Unsaved changes…');
    autoSaveRef.current = setTimeout(() => saveToFirestore(inc, exp), 1500);
  };

  /* ── Income Row Ops ───────────────────────────────────────────── */
  const addIncomeRow = () => {
    const next = [...income, EMPTY_INCOME()];
    setIncome(next);
    triggerAutoSave(next, expenses);
  };
  const updateIncome = (i, field, val) => {
    const next = income.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    setIncome(next);
    triggerAutoSave(next, expenses);
  };
  const removeIncome = (i) => {
    const next = income.filter((_, idx) => idx !== i);
    setIncome(next);
    triggerAutoSave(next, expenses);
  };

  /* ── Expense Row Ops ──────────────────────────────────────────── */
  const addExpenseRow = () => {
    const next = [...expenses, EMPTY_EXPENSE()];
    setExpenses(next);
    triggerAutoSave(income, next);
  };
  const updateExpense = (i, field, val) => {
    const next = expenses.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
    setExpenses(next);
    triggerAutoSave(income, next);
  };
  const removeExpense = (i) => {
    const next = expenses.filter((_, idx) => idx !== i);
    setExpenses(next);
    triggerAutoSave(income, next);
  };

  /* ── Totals (filtered dynamically by search term) ───────────────── */
  const getFilteredIncome = () => {
    return income.filter(row => {
      return !searchTerm || 
        (row.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.source || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (row.remark || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.amount || '').includes(searchTerm);
    });
  };

  const getFilteredExpenses = () => {
    return expenses.filter(row => {
      return !searchTerm || 
        (row.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (row.purpose || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.amount || '').includes(searchTerm);
    });
  };

  const cyclePurchases = useMemo(() => {
    return MOCK_ORDERS.filter(order => {
      const d = new Date(order.date);
      if (d.getDate() >= 25) d.setMonth(d.getMonth() + 1);
      const cycleMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return cycleMonth === selectedMonth;
    });
  }, [selectedMonth]);

  const purchasesTotal = cyclePurchases.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  const totalIncome  = getFilteredIncome().reduce((s, r)  => s + toNum(r.amount), 0);
  const totalExpense = getFilteredExpenses().reduce((s, r) => s + toNum(r.amount), 0) + purchasesTotal;
  const balance      = totalIncome - totalExpense;

  /* ── Excel Export ─────────────────────────────────────────────── */
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const incSheet = XLSX.utils.json_to_sheet(income.map(i => ({ Date: i.date, Source: i.source, Amount: i.amount, Type: i.remark })));
    const expSheet = XLSX.utils.json_to_sheet(expenses.map(e => ({ Date: e.date, Vendor: e.vendor, Amount: e.amount, Purpose: e.purpose })));
    XLSX.utils.book_append_sheet(wb, incSheet, 'Income');
    XLSX.utils.book_append_sheet(wb, expSheet, 'Expenses');
    XLSX.writeFile(wb, `${personLabel}_Finance_${selectedMonth}.xlsx`);
  };

  const handleManualSave = () => {
    clearTimeout(autoSaveRef.current);
    saveToFirestore(income, expenses);
  };

  const statusStyle = SAVE_STATUS_STYLE[saveStatus];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Month Tabs ── */}
      <div className="table-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="finance-month-tabs" role="tablist">
          {FINANCIAL_YEAR_MONTHS.map(mv => (
            <button
              key={mv}
              role="tab"
              aria-selected={selectedMonth === mv}
              className={`finance-month-tab ${selectedMonth === mv ? 'finance-month-tab--active' : ''}`}
              onClick={() => setSelectedMonth(mv)}
            >
              {formatMonthTab(mv)}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="finance-module-header">
          <div>
            <p className="eyebrow">Monthly Cashflow Tracker</p>
            <h3>Income & Expenses — {formatMonthFull(selectedMonth)}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div className="save-status" style={{ color: statusStyle.color }}>
              <span>{statusStyle.icon}</span>
              <span>{isLoading ? 'Loading…' : saveMsg || 'Ready'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {isAuthorized && (
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={handleManualSave}
                  disabled={isLoading || saveStatus === 'saving'}
                >
                  💾 Save
                </button>
              )}
              <button className="btn btn--secondary btn--sm" onClick={handleExport}>
                ⬇ Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="finance-summary-grid">
        <div className="finance-summary-card" style={{ borderLeftColor: 'var(--teal)', background: 'var(--teal-soft)' }}>
          <span>Total Income</span>
          <strong style={{ color: 'var(--teal)' }}>₹{fmtAmt(totalIncome)}</strong>
        </div>
        <div className="finance-summary-card" style={{ borderLeftColor: 'var(--coral)', background: 'var(--coral-soft)' }}>
          <span>Total Expenses</span>
          <strong style={{ color: 'var(--coral)' }}>₹{fmtAmt(totalExpense)}</strong>
        </div>
        <div
          className="finance-summary-card"
          style={{
            borderLeftColor: balance >= 0 ? 'var(--teal-mid)' : 'var(--rose)',
            background: balance >= 0 ? 'var(--pine-soft)' : 'var(--rose-soft)'
          }}
        >
          <span>Closing Balance</span>
          <strong style={{ color: balance >= 0 ? 'var(--pine)' : 'var(--rose)' }}>₹{fmtAmt(balance)}</strong>
        </div>
      </div>

      {/* ── Quick Category Filters ── */}
      <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => setSearchTerm('')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: !searchTerm ? '2.5px solid var(--teal)' : '1px solid var(--line)',
            background: !searchTerm ? 'var(--teal-soft)' : 'var(--surface-strong)',
            color: !searchTerm ? 'var(--teal)' : 'var(--muted)',
            fontWeight: !searchTerm ? 700 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          🏷️ All
        </button>
        {CATEGORY_FILTERS.map(cat => {
          const isActive = searchTerm.toLowerCase() === cat.keyword.toLowerCase();
          return (
            <button
              key={cat.keyword}
              onClick={() => setSearchTerm(isActive ? '' : cat.keyword)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: isActive ? '2.5px solid var(--teal)' : '1px solid var(--line)',
                background: isActive ? 'var(--teal-soft)' : 'var(--surface-strong)',
                color: isActive ? 'var(--teal)' : 'var(--muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── View Tabs & Search/Filter Row (Merged to save space) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--line)', paddingBottom: 0, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            onClick={() => setActiveViewTab('income')}
            style={{
              padding: '8px 16px',
              fontWeight: activeViewTab === 'income' ? 700 : 500,
              color: activeViewTab === 'income' ? 'var(--teal)' : 'var(--muted)',
              borderBottom: activeViewTab === 'income' ? '3px solid var(--teal)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
          >
            Income
          </button>
          <button 
            onClick={() => setActiveViewTab('expense')}
            style={{
              padding: '8px 16px',
              fontWeight: activeViewTab === 'expense' ? 700 : 500,
              color: activeViewTab === 'expense' ? 'var(--coral)' : 'var(--muted)',
              borderBottom: activeViewTab === 'expense' ? '3px solid var(--coral)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
          >
            Expenses
          </button>
          <button 
            onClick={() => setActiveViewTab('compare')}
            style={{
              padding: '8px 16px',
              fontWeight: activeViewTab === 'compare' ? 700 : 500,
              color: activeViewTab === 'compare' ? 'var(--purple)' : 'var(--muted)',
              borderBottom: activeViewTab === 'compare' ? '3px solid var(--purple)' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
          >
            Compare
          </button>
        </div>

        <div style={{ paddingBottom: 6 }}>
          <input 
            type="search" 
            className="finance-register-input" 
            placeholder="🔍 Search transactions (e.g. Swiggy)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', minWidth: '240px', maxWidth: '350px', background: '#fff', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* ── Tables ── */}
      <div style={{ display: 'grid', gridTemplateColumns: activeViewTab === 'compare' ? 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))' : '1fr', gap: 20 }}>

        {/* Income Table */}
        {(activeViewTab === 'income' || activeViewTab === 'compare') && (
          <div className="table-card" style={{ height: 'fit-content', overflow: 'hidden' }}>
            <div className="finance-table-section-header" style={{ borderBottom: '1px solid var(--line)' }}>
              <h4 style={{ color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📥</span> Income Details
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--muted)' }}>
                  (₹{fmtAmt(totalIncome)})
                </span>
              </h4>
              {isAuthorized && (
                <button className="btn btn--secondary btn--sm" onClick={addIncomeRow}>+ Add Row</button>
              )}
            </div>
            <div className="mq-table-wrap">
              <table className="mq-table">
                <thead>
                  <tr>
                    <th className="mq-col-index">#</th>
                    <th>DETAILS</th>
                    <th>CATEGORY</th>
                    <th>CREDITED TO</th>
                    <th>DATE</th>
                    <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {income.map((row, i) => {
                    const isMatch = !searchTerm || 
                      (row.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (row.source || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (row.remark || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      String(row.amount || '').includes(searchTerm);
                    
                    if (!isMatch) return null;

                    return (
                      <tr key={i}>
                        <td className="mq-col-index">{i + 1}</td>
                        <td style={{ minWidth: 200 }}>
                          <div className="mq-details-cell">
                            <input
                              className="mq-input-title"
                              value={row.source}
                              onChange={e => updateIncome(i, 'source', e.target.value)}
                              placeholder="Income Source"
                              readOnly={!isAuthorized}
                            />
                            <input
                              className="mq-input-subtitle"
                              value={row.remark}
                              onChange={e => updateIncome(i, 'remark', e.target.value)}
                              placeholder="Type / Remark"
                              readOnly={!isAuthorized}
                            />
                          </div>
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <input
                            className="mq-input-normal"
                            value={row.category || ''}
                            onChange={e => updateIncome(i, 'category', e.target.value)}
                            placeholder="Category"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <input
                            className="mq-input-normal"
                            value={row.creditedTo || ''}
                            onChange={e => updateIncome(i, 'creditedTo', e.target.value)}
                            placeholder="Bank / Wallet"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <input
                            className="mq-input-normal"
                            value={row.date || ''}
                            onChange={e => updateIncome(i, 'date', e.target.value)}
                            placeholder="DD/MM/YYYY"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td>
                          <input
                            className="mq-input-amount"
                            value={row.amount}
                            onChange={e => updateIncome(i, 'amount', e.target.value)}
                            placeholder="0.00"
                            type="number"
                            min="0"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isAuthorized && (
                            <button onClick={() => removeIncome(i)} className="finance-remove-btn" title="Remove row">✕</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: 'var(--teal-soft)', fontWeight: 700 }}>
                    <td></td>
                    <td colSpan={3} style={{ color: 'var(--teal)', borderTop: '1px solid var(--line)' }}>TOTAL INCOME</td>
                    <td style={{ borderTop: '1px solid var(--line)' }}></td>
                    <td style={{ textAlign: 'right', color: 'var(--teal)', borderTop: '1px solid var(--line)' }}>₹{fmtAmt(totalIncome)}</td>
                    <td style={{ borderTop: '1px solid var(--line)' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expense Table */}
        {(activeViewTab === 'expense' || activeViewTab === 'compare') && (
          <div className="table-card" style={{ height: 'fit-content', overflow: 'hidden' }}>
            <div className="finance-table-section-header" style={{ borderBottom: '1px solid var(--line)' }}>
              <h4 style={{ color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📤</span> Expense Details
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--muted)' }}>
                  (₹{fmtAmt(totalExpense)})
                </span>
              </h4>
              {isAuthorized && (
                <button className="btn btn--secondary btn--sm" onClick={addExpenseRow}>+ Add Row</button>
              )}
            </div>
            <div className="mq-table-wrap">
              <table className="mq-table">
                <thead>
                  <tr>
                    <th className="mq-col-index">#</th>
                    <th>DETAILS</th>
                    <th>CATEGORY</th>
                    <th>PAYMENT MODE</th>
                    <th>REF NO</th>
                    <th>DATE</th>
                    <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((row, i) => {
                    const isMatch = !searchTerm || 
                      (row.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (row.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (row.purpose || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      String(row.amount || '').includes(searchTerm);
                    
                    if (!isMatch) return null;

                    return (
                      <tr key={i}>
                        <td className="mq-col-index">{i + 1}</td>
                        <td style={{ minWidth: 200 }}>
                          <div className="mq-details-cell">
                            <input
                              className="mq-input-title"
                              value={row.vendor}
                              onChange={e => updateExpense(i, 'vendor', e.target.value)}
                              placeholder="Vendor / Payee"
                              readOnly={!isAuthorized}
                            />
                            <input
                              className="mq-input-subtitle"
                              value={row.purpose}
                              onChange={e => updateExpense(i, 'purpose', e.target.value)}
                              placeholder="Purpose"
                              readOnly={!isAuthorized}
                            />
                          </div>
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <input
                            className="mq-input-normal"
                            value={row.category || ''}
                            onChange={e => updateExpense(i, 'category', e.target.value)}
                            placeholder="Category"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <input
                            className="mq-input-normal"
                            value={row.paymentMode || ''}
                            onChange={e => updateExpense(i, 'paymentMode', e.target.value)}
                            placeholder="e.g. UPI, CC"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td style={{ minWidth: 100 }}>
                          <input
                            className="mq-input-normal"
                            value={row.refNo || ''}
                            onChange={e => updateExpense(i, 'refNo', e.target.value)}
                            placeholder="Ref / Bill No"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <input
                            className="mq-input-normal"
                            value={row.date || ''}
                            onChange={e => updateExpense(i, 'date', e.target.value)}
                            placeholder="DD/MM/YYYY"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td>
                          <input
                            className="mq-input-amount"
                            value={row.amount}
                            onChange={e => updateExpense(i, 'amount', e.target.value)}
                            placeholder="0.00"
                            type="number"
                            min="0"
                            readOnly={!isAuthorized}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isAuthorized && (
                            <button onClick={() => removeExpense(i)} className="finance-remove-btn" title="Remove row">✕</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {cyclePurchases.map((order, i) => {
                    const isMatch = !searchTerm || 
                      (order.date || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (order.seller || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      String(order.totalAmount || '').includes(searchTerm);
                    
                    if (!isMatch) return null;

                    return (
                      <tr key={`purchase-${i}`} style={{ backgroundColor: 'var(--rose-soft)' }}>
                        <td className="mq-col-index">{expenses.length + i + 1}</td>
                        <td style={{ minWidth: 200 }}>
                          <div className="mq-details-cell" style={{ marginLeft: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#18181b' }}>{order.seller}</span>
                              <span className="mq-pill red">Purchases</span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#71717a' }}>{order.items ? `${order.items.length} items` : 'Order'}</span>
                          </div>
                        </td>
                        <td style={{ color: '#a1a1aa', fontSize: '13px' }}>—</td>
                        <td style={{ color: '#a1a1aa', fontSize: '13px' }}>—</td>
                        <td style={{ color: '#a1a1aa', fontSize: '13px' }}>—</td>
                        <td style={{ minWidth: 140, color: '#3f3f46', paddingLeft: '8px' }}>
                          {order.date}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '14px', color: '#18181b', paddingRight: '8px' }}>
                          ₹{order.totalAmount}
                        </td>
                        <td></td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: 'var(--coral-soft)', fontWeight: 700 }}>
                    <td></td>
                    <td colSpan={4} style={{ color: 'var(--coral)', borderTop: '1px solid var(--line)' }}>TOTAL EXPENSES</td>
                    <td style={{ borderTop: '1px solid var(--line)' }}></td>
                    <td style={{ textAlign: 'right', color: 'var(--coral)', borderTop: '1px solid var(--line)' }}>₹{fmtAmt(totalExpense)}</td>
                    <td style={{ borderTop: '1px solid var(--line)' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Closing Balance Footer (Styled compactly) ── */}
      <div className="finance-balance-footer" style={{
        padding: '12px 20px',
        borderRadius: '12px',
        border: '1px solid var(--line)',
        background: balance >= 0 ? 'var(--pine-soft)' : 'var(--rose-soft)'
      }}>
        <div style={{ textAlign: 'right', width: '100%' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>
            Closing Balance ({formatMonthFull(selectedMonth)})
          </span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: balance >= 0 ? 'var(--pine)' : 'var(--rose)' }}>
            ₹{fmtAmt(balance)}
          </h3>
        </div>
      </div>

    </div>
  );
}
