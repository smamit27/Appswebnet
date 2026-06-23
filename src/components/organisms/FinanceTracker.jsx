import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db, isFirebaseConfigured } from '../../firebase.js';
import '../../finance.css';

/* ── Helpers ─────────────────────────────────────────────────────── */
const FINANCIAL_YEAR_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() - 5 + i, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthTab(mv) {
  const [y, m] = mv.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(new Date(y, m - 1, 1));
}
function formatMonthFull(mv) {
  const [y, m] = mv.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
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

const EMPTY_INCOME  = () => ({ source: '', amount: '', remark: '' });
const EMPTY_EXPENSE = () => ({ vendor: '', amount: '', purpose: '' });

/**
 * @param {string} person   - 'sweta' | 'amit'
 * @param {string} personLabel - 'Sweta' | 'Amit'
 * @param {boolean} isAuthorized
 */
export default function FinanceTracker({ person, personLabel, isAuthorized }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [income,   setIncome]   = useState([EMPTY_INCOME()]);
  const [expenses, setExpenses] = useState([EMPTY_EXPENSE()]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMsg, setSaveMsg]   = useState('');

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
        setIncome([EMPTY_INCOME()]);
        setExpenses([EMPTY_EXPENSE()]);
        setSaveMsg(`Preview mode — ${formatMonthFull(selectedMonth)}`);
        return;
      }
      try {
        const snap = await getDoc(doc(db, collectionId, recordId));
        if (!cancelled) {
          if (snap.exists()) {
            const data = snap.data();
            setIncome((data.income?.length  ? data.income  : [EMPTY_INCOME()]));
            setExpenses((data.expenses?.length ? data.expenses : [EMPTY_EXPENSE()]));
            setSaveMsg(`${formatMonthFull(selectedMonth)}`);
          } else {
            setIncome([EMPTY_INCOME()]);
            setExpenses([EMPTY_EXPENSE()]);
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
    const safe = next.length ? next : [EMPTY_INCOME()];
    setIncome(safe);
    triggerAutoSave(safe, expenses);
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
    const safe = next.length ? next : [EMPTY_EXPENSE()];
    setExpenses(safe);
    triggerAutoSave(income, safe);
  };

  /* ── Totals ───────────────────────────────────────────────────── */
  const totalIncome  = income.reduce((s, r)  => s + toNum(r.amount), 0);
  const totalExpense = expenses.reduce((s, r) => s + toNum(r.amount), 0);
  const balance      = totalIncome - totalExpense;

  /* ── Excel Export ─────────────────────────────────────────────── */
  const handleExport = () => {
    const rows = [
      ...income.map(r => ({
        Category: 'Income',
        'Source / Vendor': r.source,
        'Amount (₹)': toNum(r.amount),
        'Remark / Purpose': r.remark || '',
      })),
      { Category: '— TOTAL INCOME —', 'Source / Vendor': '', 'Amount (₹)': totalIncome, 'Remark / Purpose': '' },
      ...expenses.map(r => ({
        Category: 'Expense',
        'Source / Vendor': r.vendor,
        'Amount (₹)': toNum(r.amount),
        'Remark / Purpose': r.purpose || '',
      })),
      { Category: '— TOTAL EXPENSES —', 'Source / Vendor': '', 'Amount (₹)': totalExpense, 'Remark / Purpose': '' },
      { Category: '— CLOSING BALANCE —', 'Source / Vendor': '', 'Amount (₹)': balance, 'Remark / Purpose': '' },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${personLabel} Finance`);
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
        <div className="finance-summary-card" style={{ borderLeftColor: '#10b981' }}>
          <span>Total Income</span>
          <strong style={{ color: '#059669' }}>₹{fmtAmt(totalIncome)}</strong>
        </div>
        <div className="finance-summary-card" style={{ borderLeftColor: '#ef4444' }}>
          <span>Total Expenses</span>
          <strong style={{ color: '#dc2626' }}>₹{fmtAmt(totalExpense)}</strong>
        </div>
        <div
          className="finance-summary-card"
          style={{
            borderLeftColor: balance >= 0 ? '#3b82f6' : '#f97316',
            background: balance < 0 ? '#fff7ed' : undefined
          }}
        >
          <span>Closing Balance</span>
          <strong style={{ color: balance >= 0 ? '#2563eb' : '#ea580c' }}>₹{fmtAmt(balance)}</strong>
        </div>
      </div>

      {/* ── Tables ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 20 }}>

        {/* Income Table */}
        <div className="table-card" style={{ height: 'fit-content', overflow: 'hidden' }}>
          <div className="finance-table-section-header">
            <h4 style={{ color: '#059669' }}>
              📥 Income Details&nbsp;
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                (₹{fmtAmt(totalIncome)})
              </span>
            </h4>
            {isAuthorized && (
              <button className="btn btn--secondary btn--sm" onClick={addIncomeRow}>+ Add Row</button>
            )}
          </div>
          <div className="finance-table-wrap">
            <table className="finance-table">
              <thead>
                <tr style={{ background: '#ecfdf5' }}>
                  <th style={{ color: '#059669' }}>Source / Amount Received</th>
                  <th style={{ color: '#059669', textAlign: 'right', width: 130 }}>Amount (₹)</th>
                  <th style={{ color: '#059669', width: 160 }}>Remark</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {income.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        className="finance-register-input"
                        value={row.source}
                        onChange={e => updateIncome(i, 'source', e.target.value)}
                        placeholder="e.g. Salary, Rental income…"
                        readOnly={!isAuthorized}
                      />
                    </td>
                    <td>
                      <input
                        className="finance-register-input right"
                        value={row.amount}
                        onChange={e => updateIncome(i, 'amount', e.target.value)}
                        placeholder="0.00"
                        type="number"
                        min="0"
                        readOnly={!isAuthorized}
                      />
                    </td>
                    <td>
                      <input
                        className="finance-register-input"
                        value={row.remark}
                        onChange={e => updateIncome(i, 'remark', e.target.value)}
                        placeholder="Remark"
                        readOnly={!isAuthorized}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isAuthorized && (
                        <button
                          onClick={() => removeIncome(i)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.4, fontSize: '1rem', padding: '2px 4px' }}
                          title="Remove row"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ background: 'rgba(236,253,245,0.7)', fontWeight: 700 }}>
                  <td style={{ color: '#059669', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Income
                  </td>
                  <td style={{ textAlign: 'right', color: '#059669', fontSize: '1rem' }}>
                    ₹{fmtAmt(totalIncome)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Table */}
        <div className="table-card" style={{ height: 'fit-content', overflow: 'hidden' }}>
          <div className="finance-table-section-header">
            <h4 style={{ color: '#dc2626' }}>
              📤 Expense Details&nbsp;
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                (₹{fmtAmt(totalExpense)})
              </span>
            </h4>
            {isAuthorized && (
              <button className="btn btn--secondary btn--sm" onClick={addExpenseRow}>+ Add Row</button>
            )}
          </div>
          <div className="finance-table-wrap">
            <table className="finance-table">
              <thead>
                <tr style={{ background: '#fff1f2' }}>
                  <th style={{ color: '#dc2626' }}>Vendor / Payee</th>
                  <th style={{ color: '#dc2626', textAlign: 'right', width: 130 }}>Amount (₹)</th>
                  <th style={{ color: '#dc2626', width: 160 }}>Purpose</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        className="finance-register-input"
                        value={row.vendor}
                        onChange={e => updateExpense(i, 'vendor', e.target.value)}
                        placeholder="e.g. Electricity, Groceries…"
                        readOnly={!isAuthorized}
                      />
                    </td>
                    <td>
                      <input
                        className="finance-register-input right"
                        value={row.amount}
                        onChange={e => updateExpense(i, 'amount', e.target.value)}
                        placeholder="0.00"
                        type="number"
                        min="0"
                        readOnly={!isAuthorized}
                      />
                    </td>
                    <td>
                      <input
                        className="finance-register-input"
                        value={row.purpose}
                        onChange={e => updateExpense(i, 'purpose', e.target.value)}
                        placeholder="Purpose"
                        readOnly={!isAuthorized}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isAuthorized && (
                        <button
                          onClick={() => removeExpense(i)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.4, fontSize: '1rem', padding: '2px 4px' }}
                          title="Remove row"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ background: 'rgba(255,241,242,0.7)', fontWeight: 700 }}>
                  <td style={{ color: '#dc2626', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Expenses
                  </td>
                  <td style={{ textAlign: 'right', color: '#dc2626', fontSize: '1rem' }}>
                    ₹{fmtAmt(totalExpense)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Closing Balance ── */}
      <div className="finance-balance-footer">
        <div style={{ textAlign: 'right' }}>
          <p className="finance-balance-footer__label">
            Closing Balance — {formatMonthFull(selectedMonth)}
          </p>
          <h2 className="finance-balance-footer__value" style={{ color: balance >= 0 ? '#10b981' : '#ef4444' }}>
            ₹{fmtAmt(balance)}
          </h2>
        </div>
      </div>

    </div>
  );
}
