import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../firebase.js';
import { parseLocalDate } from './PurchasesTracker.jsx';
import { useCollection } from '../../hooks/useCollection.js';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Mic } from 'lucide-react';
import '../../finance.css';
import ConfirmDeleteModal from '../molecules/ConfirmDeleteModal.jsx';
import ToastNotification from '../molecules/ToastNotification.jsx';
import VoiceTransactionModal from './VoiceTransactionModal.jsx';

/* ── Helpers ─────────────────────────────────────────────────────── */
const FINANCIAL_YEAR_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(new Date().getFullYear(), new Date().getMonth() - 5 + i, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

function getCurrentMonth() {
  const d = new Date();
  if (d.getDate() >= 25) d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthDisplay(mv) {
  const [y, m] = mv.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function formatMonthShort(mv) {
  const [y, m] = mv.split('-').map(Number);
  const curr = new Date(y, m - 1, 1);
  const prev = new Date(y, m - 2, 1);
  return `25 ${prev.toLocaleString('en-US', { month: 'short' })} - 24 ${curr.toLocaleString('en-US', { month: 'short' })} '${String(y).slice(2)}`;
}

const toNum = (v) => parseFloat(v) || 0;
const fmtAmt = (v) => Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtAmtDec = (v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const INR = '₹';

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Dividend', 'Interest', 'Rent Received', 'Business', 'Other Income'];
export const EXPENSE_CATEGORIES = ['Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Home', 'Home Loan EMI', 'Investments', 'Credit Card Payment', 'House Help', 'Monthly Maintenance', 'Healthcare', 'Entertainment', 'Education', 'Others'];
export const PAYMENT_METHODS = [
  'Amit HDFC Bank',
  'SBI Bank',
  'Amit ICICI Bank',
  'Sweta ICICI Bank',
  'Pluxee',
  'Amazon Credit Card',
  'HSBC Credit Card',
  'Axis Credit Card',
  'Cash',
  'Other'
];

const CATEGORY_ICONS = {
  'Salary': '💼', 'Freelance': '🖥️', 'Investments': '📈', 'Dividend': '🪙', 'Interest': '💸', 'Rent Received': '🏠',
  'Business': '🏢', 'Other Income': '💰',
  'Food & Dining': '🍔', 'Transport': '🚗', 'Shopping': '🛍️',
  'Bills & Utilities': '⚡', 'Home': '🏡', 'Home Loan EMI': '🏦', 'Investments': '📈', 'Credit Card Payment': '💳', 'House Help': '🧹', 'Monthly Maintenance': '🛠️', 'Healthcare': '💊',
  'Entertainment': '🎬', 'Education': '📚', 'Others': '📦',
};

const CATEGORY_COLORS = {
  'Food & Dining': '#FF6B6B', 'Transport': '#4ECDC4', 'Shopping': '#FFE66D',
  'Bills & Utilities': '#A29BFE', 'Home': '#FD79A8', 'Home Loan EMI': '#4a90e2', 'Investments': '#FDCB6E', 'Credit Card Payment': '#6c5ce7', 'House Help': '#e17055', 'Monthly Maintenance': '#e67e22', 'Healthcare': '#74B9FF',
  'Entertainment': '#FF7675', 'Education': '#55EFC4', 'Others': '#B2BEC3',
  'Salary': '#00B894', 'Freelance': '#6C5CE7', 'Investments': '#FDCB6E', 'Dividend': '#20bf6b', 'Interest': '#45aaf2',
  'Rent Received': '#E17055', 'Business': '#00CEC9', 'Other Income': '#A29BFE',
};

const EMPTY_INCOME = () => ({
  date: new Date().toISOString().slice(0, 10),
  source: '',
  amount: '',
  remark: '',
  category: '',
  creditedTo: 'Amit HDFC Bank',
  type: 'income'
});

const EMPTY_EXPENSE = () => ({
  date: new Date().toISOString().slice(0, 10),
  vendor: '',
  amount: '',
  purpose: '',
  category: '',
  paymentMode: 'Amit HDFC Bank',
  refNo: '',
  type: 'expense'
});

/* ── Mini Sparkline ── */
function Sparkline({ data, color = '#10b981', isPositive = true }) {
  if (!data || data.length < 2) return <div style={{ width: 80, height: 32 }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

/* ── Add Transaction Modal ── */
function AddTransactionModal({ isOpen, onClose, onSave, isAuthorized }) {
  const [txType, setTxType] = useState('income');
  const [form, setForm] = useState(EMPTY_INCOME());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTxType('income');
      setForm(EMPTY_INCOME());
    }
  }, [isOpen]);

  const handleTypeSwitch = (t) => {
    setTxType(t);
    setForm(t === 'income' ? EMPTY_INCOME() : EMPTY_EXPENSE());
  };

  const handleField = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(txType, form);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  const incomeCategories = INCOME_CATEGORIES;
  const expenseCategories = EXPENSE_CATEGORIES;
  const currentCats = txType === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="ft-modal-overlay" onClick={onClose}>
      <div className="ft-modal-shell" onClick={e => e.stopPropagation()}>

        {/* Left Panel — Form */}
        <div className="ft-modal-form-panel">
          {/* Type Toggle */}
          <div className="ft-type-toggle">
            <button
              className={`ft-type-btn ${txType === 'income' ? 'ft-type-btn--income active' : ''}`}
              onClick={() => handleTypeSwitch('income')}
            >
              <div className="ft-type-icon ft-type-icon--income">↑</div>
              <div>
                <div className="ft-type-label">Income</div>
                <div className="ft-type-sub">Money coming in</div>
              </div>
            </button>
            <button
              className={`ft-type-btn ${txType === 'expense' ? 'ft-type-btn--expense active' : ''}`}
              onClick={() => handleTypeSwitch('expense')}
            >
              <div className="ft-type-icon ft-type-icon--expense">↓</div>
              <div>
                <div className="ft-type-label">Expense</div>
                <div className="ft-type-sub">Money going out</div>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="ft-form-grid">
            {/* Amount */}
            <div className="ft-field ft-field--half">
              <label className="ft-label">Amount <span className="ft-required">*</span></label>
              <div className="ft-input-wrap ft-input-wrap--icon">
                <span className="ft-input-icon">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={e => handleField('amount', e.target.value)}
                  className="ft-input"
                />
              </div>
            </div>

            {/* Category */}
            <div className="ft-field ft-field--half">
              <label className="ft-label">Category <span className="ft-required">*</span></label>
              <div className="ft-input-wrap ft-input-wrap--icon">
                <span className="ft-input-icon">🏷️</span>
                <select
                  required
                  value={form.category}
                  onChange={e => handleField('category', e.target.value)}
                  className="ft-input ft-select"
                >
                  <option value="">Select category</option>
                  {currentCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Date */}
            <div className="ft-field ft-field--half">
              <label className="ft-label">Date <span className="ft-required">*</span></label>
              <div className="ft-input-wrap ft-input-wrap--icon">
                <span className="ft-input-icon">📅</span>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => handleField('date', e.target.value)}
                  className="ft-input"
                />
              </div>
            </div>

            {/* Source / Vendor */}
            <div className="ft-field ft-field--half">
              <label className="ft-label">
                {txType === 'income' ? 'Source (optional)' : 'Payee (optional)'}
              </label>
              <div className="ft-input-wrap ft-input-wrap--icon">
                <span className="ft-input-icon">👤</span>
                <input
                  type="text"
                  placeholder={txType === 'income' ? 'e.g. Employer, Client' : 'e.g. Swiggy, Amazon'}
                  value={txType === 'income' ? (form.source || '') : (form.vendor || '')}
                  onChange={e => handleField(txType === 'income' ? 'source' : 'vendor', e.target.value)}
                  className="ft-input"
                />
              </div>
            </div>

            {/* Account / Payment */}
            <div className="ft-field ft-field--half">
              <label className="ft-label">Account <span className="ft-required">*</span></label>
              <div className="ft-input-wrap ft-input-wrap--icon">
                <span className="ft-input-icon">🏦</span>
                <select
                  value={txType === 'income' ? (form.creditedTo || '') : (form.paymentMode || '')}
                  onChange={e => handleField(txType === 'income' ? 'creditedTo' : 'paymentMode', e.target.value)}
                  className="ft-input ft-select"
                >
                  <option value="">Select account</option>
                  {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Ref / Remark */}
            <div className="ft-field ft-field--half">
              <label className="ft-label">Reference (optional)</label>
              <div className="ft-input-wrap ft-input-wrap--icon">
                <span className="ft-input-icon">📋</span>
                <input
                  type="text"
                  placeholder="e.g. Invoice No., Reference no."
                  value={txType === 'income' ? (form.remark || '') : (form.refNo || '')}
                  onChange={e => handleField(txType === 'income' ? 'remark' : 'refNo', e.target.value)}
                  className="ft-input"
                />
              </div>
            </div>

            {/* Note */}
            <div className="ft-field ft-field--full">
              <label className="ft-label">Note (optional)</label>
              <textarea
                placeholder="Add a note (optional)"
                maxLength={250}
                value={form.purpose || ''}
                onChange={e => handleField('purpose', e.target.value)}
                className="ft-input ft-textarea"
                rows={3}
              />
              <div className="ft-char-count">{(form.purpose || '').length}/250</div>
            </div>

            {/* Actions */}
            <div className="ft-form-actions">
              <button type="button" className="ft-btn-cancel" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                disabled={saving || !isAuthorized}
                className={`ft-btn-save ${txType === 'income' ? 'ft-btn-save--income' : 'ft-btn-save--expense'}`}
              >
                {saving ? 'Saving…' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel — Tips & Recent */}
        <div className="ft-modal-info-panel">
          {/* Quick Tips */}
          <div className="ft-info-card">
            <h4 className="ft-info-title">Quick Tips</h4>
            <div className="ft-tip-item">
              <span className="ft-tip-icon">ℹ️</span>
              <p>
                {txType === 'income'
                  ? 'Record your income sources like salary, freelance, rent received, investments etc.'
                  : 'Record your expenses like food, transport, bills, shopping and more.'}
              </p>
            </div>
          </div>

          {/* Recent Categories */}
          <div className="ft-info-card">
            <div className="ft-info-card-head">
              <h4 className="ft-info-title">
                {txType === 'income' ? 'Recent Income Categories' : 'Recent Expense Categories'}
              </h4>
            </div>
            <div className="ft-cat-list">
              {currentCats.slice(0, 4).map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`ft-cat-item ${form.category === cat ? 'ft-cat-item--active' : ''}`}
                  onClick={() => handleField('category', cat)}
                >
                  <span className="ft-cat-icon">{CATEGORY_ICONS[cat] || '📦'}</span>
                  <div className="ft-cat-details">
                    <span className="ft-cat-name">{cat}</span>
                    <span className="ft-cat-sub">
                      {txType === 'income' ? 'Income source' : 'Expense type'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Need Help */}
          <div className="ft-info-card ft-help-card">
            <h4 className="ft-info-title">Need Help?</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '4px 0 8px' }}>
              Learn how to manage your transactions effectively.
            </p>
            <button type="button" className="ft-help-btn">View Help Center ↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Budget Card ── */
function BudgetBar({ category, spent, budget }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 150) : 0;
  const exceeded = spent > budget;
  const color = exceeded ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981';
  return (
    <div className="ft-budget-item">
      <div className="ft-budget-head">
        <span className="ft-budget-icon">{CATEGORY_ICONS[category] || '📦'}</span>
        <div className="ft-budget-info">
          <span className="ft-budget-cat">{category}</span>
          <span className="ft-budget-amounts">
            {INR}{fmtAmt(spent)} / {INR}{fmtAmt(budget)}
          </span>
        </div>
        <span className="ft-budget-pct" style={{ color }}>{exceeded ? 'Budget Exceeded' : `${Math.round(pct)}%`}</span>
      </div>
      <div className="ft-budget-bar-bg">
        <div
          className="ft-budget-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function FinanceTracker({ person, personLabel, isAuthorized, user, refreshTrigger }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const activeTabRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTabRef.current) {
        activeTabRef.current.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedMonth]);

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [txFilter, setTxFilter] = useState('All'); // 'All' | 'Income' | 'Expense'
  const [formOpen, setFormOpen] = useState(null); // null | 'income' | 'expense'
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null); // null | number
  const [formData, setFormData] = useState(EMPTY_INCOME());
  const [formSaving, setFormSaving] = useState(false);
  const [showAllTx, setShowAllTx] = useState(false);
  const [dateError, setDateError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // null | string
  const [accountFilter, setAccountFilter] = useState('All');

  const { startDate, endDate } = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const startYear = m === 1 ? y - 1 : y;
    const startMonth = m === 1 ? 12 : m - 1;
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-25`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-24`;
    return { startDate, endDate };
  }, [selectedMonth]);

  const formatToUIDate = useCallback((dStr) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length !== 3) return dStr;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }, []);

  useEffect(() => {
    if (formOpen && formData.date) {
      if (formData.date < startDate || formData.date > endDate) {
        setFormData(prev => ({ ...prev, date: '' }));
        setDateError(`Selected date was cleared because it is outside the cycle range (${formatToUIDate(startDate)} to ${formatToUIDate(endDate)}).`);
      }
    }
  }, [startDate, endDate, formOpen, formatToUIDate]);

  const [sortField, setSortField] = useState('date'); // 'date' | 'category' | 'amount'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openForm = (type, index = null) => {
    setFormOpen(type);
    if (index !== null) {
      setEditingIdx(index);
      const tx = type === 'income' ? income[index] : expenses[index];
      setFormData({
        ...tx,
        amount: tx.amount !== undefined ? tx.amount : ''
      });
    } else {
      setEditingIdx(null);
      setFormData(type === 'income' ? EMPTY_INCOME() : EMPTY_EXPENSE());
    }
  };
  const closeForm = () => {
    setFormOpen(null);
    setEditingIdx(null);
    setFormData(EMPTY_INCOME());
    setDateError('');
  };
  const handleFormField = (field, val) => {
    if (field === 'date') {
      if (val && (val < startDate || val > endDate)) {
        setDateError(`Please select a date between ${formatToUIDate(startDate)} and ${formatToUIDate(endDate)}.`);
      } else {
        setDateError('');
      }
    }
    setFormData(f => ({ ...f, [field]: val }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (formData.date < startDate || formData.date > endDate) {
      setDateError(`Please select a date between ${formatToUIDate(startDate)} and ${formatToUIDate(endDate)}.`);
      return;
    }
    setFormSaving(true);
    await handleSaveTransaction(formOpen, formData);
    setFormSaving(false);
    closeForm();
  };

  const isLoadedRef = useRef(false);
  const autoSaveRef = useRef(null);
  const collectionId = `financeMonthly_${person}`;
  const recordId = `${person}_${selectedMonth}`;

  /* ── Load ── */
  const load = useCallback(async () => {
    setIsLoading(true);
    isLoadedRef.current = false;
    if (!isFirebaseConfigured || !db) {
      setIsLoading(false);
      isLoadedRef.current = true;
      setIncome([]);
      setExpenses([]);
      return;
    }
    try {
      const snap = await getDoc(doc(db, collectionId, recordId));
      if (snap.exists()) {
        const data = snap.data();
        setIncome(data.income || []);
        setExpenses(data.expenses || []);
      } else {
        setIncome([]);
        setExpenses([]);
      }
    } catch (err) {
      console.error('Finance load error:', err);
    } finally {
      setIsLoading(false);
      isLoadedRef.current = true;
    }
  }, [collectionId, recordId]);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  useEffect(() => {
    const handleRemoteRefresh = () => {
      load();
    };
    window.addEventListener('finance-transaction-saved', handleRemoteRefresh);
    return () => {
      window.removeEventListener('finance-transaction-saved', handleRemoteRefresh);
    };
  }, [load]);

  /* ── Save ── */
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
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Finance save error:', err);
      setSaveStatus('error');
    }
  }, [collectionId, recordId, person, selectedMonth]);

  const triggerAutoSave = (inc, exp) => {
    if (!isLoadedRef.current || !isAuthorized) return;
    clearTimeout(autoSaveRef.current);
    setSaveStatus('pending');
    autoSaveRef.current = setTimeout(() => saveToFirestore(inc, exp), 1500);
  };

  /* ── Tx CRUD ── */
  const handleSaveTransaction = async (type, form) => {
    if (type === 'income') {
      const row = {
        date: form.date,
        source: form.source || '',
        amount: form.amount,
        remark: form.remark || '',
        category: form.category,
        creditedTo: form.creditedTo || '',
        type: 'income',
      };
      let next;
      if (editingIdx !== null) {
        next = [...income];
        next[editingIdx] = row;
      } else {
        next = [...income, row];
      }
      setIncome(next);
      triggerAutoSave(next, expenses);
    } else {
      const row = {
        date: form.date,
        vendor: form.vendor || '',
        amount: form.amount,
        purpose: form.purpose || '',
        category: form.category,
        paymentMode: form.paymentMode || '',
        refNo: form.refNo || '',
        type: 'expense',
      };
      let next;
      if (editingIdx !== null) {
        next = [...expenses];
        next[editingIdx] = row;
      } else {
        next = [...expenses, row];
      }
      setExpenses(next);
      triggerAutoSave(income, next);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'income'|'expense', idx: number }
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const initiateDelete = (type, idx) => {
    setDeleteTarget({ type, idx });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, idx } = deleteTarget;
    setDeleteTarget(null);

    const nextIncome = type === 'income' ? income.filter((_, i) => i !== idx) : income;
    const nextExpenses = type === 'expense' ? expenses.filter((_, i) => i !== idx) : expenses;

    if (!isFirebaseConfigured || !db) {
      if (type === 'income') setIncome(nextIncome);
      else setExpenses(nextExpenses);
      showToast('Item deleted successfully.', 'success');
      return;
    }

    try {
      await setDoc(doc(db, collectionId, recordId), {
        person,
        month: selectedMonth,
        income: nextIncome,
        expenses: nextExpenses,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      if (type === 'income') setIncome(nextIncome);
      else setExpenses(nextExpenses);
      showToast('Item deleted successfully.', 'success');
    } catch (err) {
      console.error('Failed to delete item:', err);
      showToast('Failed to delete item: ' + err.message, 'error');
    }
  };

  /* ── Totals ── */
  const totalIncome = income.reduce((s, r) => s + toNum(r.amount), 0);
  const totalExpense = expenses.reduce((s, r) => s + toNum(r.amount), 0);
  const netSavings = totalIncome - totalExpense;
  const avgDailyExpense = expenses.length > 0 ? totalExpense / 30 : 0;

  /* ── Combined Transactions (sorted dynamically) ── */
  const allTransactions = useMemo(() => {
    const inc = income.map((r, i) => ({ ...r, _type: 'income', _idx: i, _key: `inc-${i}` }));
    const exp = expenses.map((r, i) => ({ ...r, _type: 'expense', _idx: i, _key: `exp-${i}` }));
    const combined = [...inc, ...exp];
    combined.sort((a, b) => {
      let valA, valB;
      if (sortField === 'date') {
        valA = parseLocalDate(a.date).getTime();
        valB = parseLocalDate(b.date).getTime();
      } else if (sortField === 'category') {
        const catA = a.category || (a._type === 'income' ? 'Income' : 'Expense');
        const catB = b.category || (b._type === 'income' ? 'Income' : 'Expense');
        return sortDirection === 'asc' 
          ? catA.localeCompare(catB) 
          : catB.localeCompare(catA);
      } else if (sortField === 'amount') {
        valA = toNum(a.amount);
        valB = toNum(b.amount);
      } else {
        valA = a[sortField] || '';
        valB = b[sortField] || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    const filtered = combined.filter(tx => {
      const matchFilter = txFilter === 'All' || 
        (txFilter === 'Income' && tx._type === 'income') ||
        (txFilter === 'Expense' && tx._type === 'expense');
      const matchSearch = !searchTerm ||
        (tx.source || tx.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.date || '').includes(searchTerm);
      const matchCategory = !selectedCategory || tx.category === selectedCategory;
      
      const txAccount = tx._type === 'income' ? tx.creditedTo : tx.paymentMode;
      const matchAccount = accountFilter === 'All' || txAccount === accountFilter;

      return matchFilter && matchSearch && matchCategory && matchAccount;
    });
    return filtered;
  }, [income, expenses, txFilter, searchTerm, sortField, sortDirection, selectedCategory, accountFilter]);

  const displayTx = showAllTx ? allTransactions : allTransactions.slice(0, 7);

  /* ── Category breakdown (expenses) ── */
  const expenseByCategory = useMemo(() => {
    const map = {};
    expenses.forEach(r => {
      const cat = r.category || 'Others';
      map[cat] = (map[cat] || 0) + toNum(r.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0) // Prevent Recharts Pie from crashing when values are 0
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  /* ── Category breakdown (income) ── */
  const incomeByCategory = useMemo(() => {
    const map = {};
    income.forEach(r => {
      const cat = r.category || 'Other Income';
      map[cat] = (map[cat] || 0) + toNum(r.amount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [income]);

  /* ── Last 4 weeks weekly data ── */
  const weeklyData = useMemo(() => {
    const weeks = [
      { label: '1-7', income: 0, expense: 0 },
      { label: '8-14', income: 0, expense: 0 },
      { label: '15-21', income: 0, expense: 0 },
      { label: '22-30', income: 0, expense: 0 },
    ];
    const [y, m] = selectedMonth.split('-').map(Number);
    income.forEach(r => {
      const d = parseLocalDate(r.date);
      if (d.getFullYear() === y && d.getMonth() + 1 === m) {
        const day = d.getDate();
        const wi = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
        weeks[wi].income += toNum(r.amount);
      }
    });
    expenses.forEach(r => {
      const d = parseLocalDate(r.date);
      if (d.getFullYear() === y && d.getMonth() + 1 === m) {
        const day = d.getDate();
        const wi = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
        weeks[wi].expense += toNum(r.amount);
      }
    });
    return weeks.map(w => ({
      ...w,
      label: `${w.label} ${new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short' })}`
    }));
  }, [income, expenses, selectedMonth]);

  /* ── Budget (mock budgets) ── */
  const BUDGETS = {
    'Food & Dining': 10000,
    'Transport': 5000,
    'Shopping': 8000,
    'Bills & Utilities': 4000,
    'Healthcare': 3000,
    'Entertainment': 2000,
    'Investments': 50000,
  };

  const budgetData = useMemo(() => {
    return Object.entries(BUDGETS).map(([cat, budget]) => {
      const spent = expenseByCategory.find(e => e.name === cat)?.value || 0;
      return { category: cat, spent, budget };
    });
  }, [expenseByCategory]);

  /* ── Metric mini-chart data (last 3 months dummy) ── */
  const incomeSparkData = [totalIncome * 0.8, totalIncome * 0.9, totalIncome * 0.95, totalIncome];
  const expenseSparkData = [totalExpense * 0.9, totalExpense * 1.05, totalExpense * 0.95, totalExpense];
  const savingsSparkData = [netSavings * 0.7, netSavings * 0.8, netSavings * 0.9, netSavings];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color, fontWeight: 600 }}>
              {p.name}: {INR}{fmtAmt(p.value)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const currentCats = formOpen === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="ft-root">
      {/* ── Month Selector Strip ── */}
      <div className="ft-month-strip">
        <div className="ft-month-tabs" role="tablist">
          {FINANCIAL_YEAR_MONTHS.map(mv => (
            <button
              key={mv}
              ref={selectedMonth === mv ? activeTabRef : null}
              role="tab"
              aria-selected={selectedMonth === mv}
              className={`ft-month-tab ${selectedMonth === mv ? 'ft-month-tab--active' : ''}`}
              onClick={() => setSelectedMonth(mv)}
            >
              {formatMonthShort(mv)}
            </button>
          ))}
        </div>
        <div className="ft-month-actions">
          {saveStatus === 'saving' && <span className="ft-save-badge ft-save-badge--saving">↑ Saving…</span>}
          {saveStatus === 'saved' && <span className="ft-save-badge ft-save-badge--saved">✓ Saved</span>}
          {saveStatus === 'error' && <span className="ft-save-badge ft-save-badge--error">✗ Error</span>}
          {isAuthorized && (
            <>
              <button
                className="ft-voice-add-btn"
                onClick={() => setVoiceModalOpen(true)}
              >
                <Mic size={16} /> Voice
              </button>
              <button
                className="ft-add-income-btn"
                onClick={() => openForm('income')}
              >
                <span>↑</span> Add Income
              </button>
              <button
                className="ft-add-expense-btn"
                onClick={() => openForm('expense')}
              >
                <span>↓</span> Add Expense
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Add Transaction Popup Modal ── */}
      {formOpen && (
        <div className="ft-modal-overlay" onClick={closeForm}>
          <div
            className={`ft-popup ${formOpen === 'income' ? 'ft-popup--income' : 'ft-popup--expense'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Popup Header */}
            <div className="ft-popup-head">
              <div className="ft-popup-head-left">
                <div className={`ft-popup-type-badge ${formOpen === 'income' ? 'ft-popup-type-badge--income' : 'ft-popup-type-badge--expense'}`}>
                  {formOpen === 'income' ? '↑' : '↓'}
                </div>
                <div>
                  <h3 className="ft-popup-title">
                    {formOpen === 'income' ? 'Add Income' : 'Add Expense'}
                  </h3>
                  <p className="ft-popup-sub">
                    {formOpen === 'income' ? 'Record money coming in' : 'Record money going out'}
                  </p>
                </div>
              </div>
              {/* Switch type */}
              <div className="ft-popup-type-switch">
                <button
                  type="button"
                  className={`ft-popup-switch-btn ${formOpen === 'income' ? 'active--income' : ''}`}
                  onClick={() => { setFormOpen('income'); setFormData(EMPTY_INCOME()); }}
                >↑ Income</button>
                <button
                  type="button"
                  className={`ft-popup-switch-btn ${formOpen === 'expense' ? 'active--expense' : ''}`}
                  onClick={() => { setFormOpen('expense'); setFormData(EMPTY_EXPENSE()); }}
                >↓ Expense</button>
              </div>
              <button className="ft-popup-close" onClick={closeForm} aria-label="Close">✕</button>
            </div>

            {/* Popup Body: form + categories side by side */}
            <div className="ft-popup-body">
              {/* Left: Form */}
              <form onSubmit={handleFormSubmit} className="ft-popup-form">
                <div className="ft-popup-fields">
                  {/* Amount — full width, highlighted */}
                  <div className="ft-field ft-field--amount-hero">
                    <label className="ft-label">Amount <span className="ft-required">*</span></label>
                    <div className="ft-input-wrap ft-input-wrap--icon ft-amount-wrap">
                      <span className="ft-amount-prefix">₹</span>
                      <input
                        type="number" min="0" step="0.01" required
                        placeholder="0.00"
                        autoFocus
                        value={formData.amount}
                        onChange={e => handleFormField('amount', e.target.value)}
                        className="ft-amount-input"
                      />
                    </div>
                  </div>

                  {/* Row: Date + Category */}
                  <div className="ft-popup-row">
                    <div className="ft-field">
                      <label className="ft-label">Date <span className="ft-required">*</span></label>
                      <div className="ft-input-wrap ft-input-wrap--icon">
                        <span className="ft-input-icon">📅</span>
                        <input
                          type="date"
                          required
                          value={formData.date}
                          min={startDate}
                          max={endDate}
                          onChange={e => handleFormField('date', e.target.value)}
                          className="ft-input"
                          style={dateError ? { borderColor: 'var(--red, #ef4444)' } : {}}
                        />
                      </div>
                      {dateError && (
                        <span className="ft-field-error" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                          {dateError}
                        </span>
                      )}
                    </div>
                    <div className="ft-field">
                      <label className="ft-label">Category <span className="ft-required">*</span></label>
                      <div className="ft-input-wrap ft-input-wrap--icon">
                        <span className="ft-input-icon">🏷️</span>
                        <select
                          required
                          value={formData.category}
                          onChange={e => handleFormField('category', e.target.value)}
                          className="ft-input ft-select"
                        >
                          <option value="">Select category</option>
                          {currentCats.map(cat => (
                            <option key={cat} value={cat}>
                              {(CATEGORY_ICONS[cat] || '📦') + ' ' + cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row: Account + Source/Payee */}
                  <div className="ft-popup-row">
                    <div className="ft-field">
                      <label className="ft-label">Account</label>
                      <div className="ft-input-wrap ft-input-wrap--icon">
                        <span className="ft-input-icon">🏦</span>
                        <select
                          value={formOpen === 'income' ? (formData.creditedTo||'') : (formData.paymentMode||'')}
                          onChange={e => handleFormField(formOpen === 'income' ? 'creditedTo' : 'paymentMode', e.target.value)}
                          className="ft-input ft-select">
                          <option value="">Select account</option>
                          {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="ft-field">
                      <label className="ft-label">
                        {formOpen === 'income' ? 'Source' : 'Payee'}
                        <span className="ft-label-opt"> (optional)</span>
                      </label>
                      <div className="ft-input-wrap ft-input-wrap--icon">
                        <span className="ft-input-icon">👤</span>
                        <input type="text"
                          placeholder={formOpen === 'income' ? 'e.g. Employer, Client' : 'e.g. Swiggy, Amazon'}
                          value={formOpen === 'income' ? (formData.source||'') : (formData.vendor||'')}
                          onChange={e => handleFormField(formOpen === 'income' ? 'source' : 'vendor', e.target.value)}
                          className="ft-input" />
                      </div>
                    </div>
                  </div>

                  {/* Note (full width) */}
                  <div className="ft-field">
                    <label className="ft-label">Note <span className="ft-label-opt">(optional)</span></label>
                    <div className="ft-input-wrap">
                      <input type="text"
                        placeholder="Add a short note…"
                        value={formOpen === 'income' ? (formData.remark||'') : (formData.purpose||'')}
                        onChange={e => handleFormField(formOpen === 'income' ? 'remark' : 'purpose', e.target.value)}
                        className="ft-input" />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="ft-popup-actions">
                  <button type="button" className="ft-btn-cancel" onClick={closeForm}>Cancel</button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className={`ft-btn-save ${formOpen === 'income' ? 'ft-btn-save--income' : 'ft-btn-save--expense'}`}
                  >
                    {formSaving
                      ? <><span className="ft-btn-spinner"/>Saving…</>
                      : `✓ Save ${formOpen === 'income' ? 'Income' : 'Expense'}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="ft-loading">
          <div className="ft-loading-spinner" />
          <span>Loading {formatMonthDisplay(selectedMonth)}…</span>
        </div>
      )}

      {/* ── Metric Cards Row ── */}
      <div className="ft-metrics-grid">
        {/* Total Balance */}
        <div className="ft-metric-card ft-metric-card--balance">
          <div className="ft-metric-icon ft-metric-icon--blue">🏦</div>
          <div className="ft-metric-body">
            <span className="ft-metric-label">Total Balance</span>
            <div className="ft-metric-value">{INR}{fmtAmt(netSavings)}</div>
            <div className={`ft-metric-change ${netSavings >= 0 ? 'positive' : 'negative'}`}>
              {netSavings >= 0 ? '↑' : '↓'} Balance this month
            </div>
          </div>
          <Sparkline data={savingsSparkData} color="#3b82f6" />
        </div>

        {/* Total Income */}
        <div className="ft-metric-card ft-metric-card--income">
          <div className="ft-metric-icon ft-metric-icon--green">💰</div>
          <div className="ft-metric-body">
            <span className="ft-metric-label">Total Income</span>
            <div className="ft-metric-value">{INR}{fmtAmt(totalIncome)}</div>
            <div className="ft-metric-change positive">
              ↑ {income.length} transactions
            </div>
          </div>
          <Sparkline data={incomeSparkData} color="#10b981" />
        </div>

        {/* Total Expenses */}
        <div className="ft-metric-card ft-metric-card--expense">
          <div className="ft-metric-icon ft-metric-icon--red">💸</div>
          <div className="ft-metric-body">
            <span className="ft-metric-label">Total Expenses</span>
            <div className="ft-metric-value">{INR}{fmtAmt(totalExpense)}</div>
            <div className="ft-metric-change negative">
              ↓ {expenses.length} transactions
            </div>
          </div>
          <Sparkline data={expenseSparkData} color="#ef4444" isPositive={false} />
        </div>

        {/* Total Savings */}
        <div className="ft-metric-card ft-metric-card--savings">
          <div className="ft-metric-icon ft-metric-icon--purple">🐷</div>
          <div className="ft-metric-body">
            <span className="ft-metric-label">Total Savings</span>
            <div className="ft-metric-value">{INR}{fmtAmt(Math.max(netSavings, 0))}</div>
            <div className={`ft-metric-change ${netSavings >= 0 ? 'positive' : 'negative'}`}>
              {netSavings >= 0 ? '↑ ' : '↓ '} {totalIncome > 0 ? Math.round((Math.max(netSavings, 0) / totalIncome) * 100) : 0}% of income
            </div>
          </div>
          <Sparkline data={savingsSparkData} color="#a855f7" />
        </div>
      </div>

      {/* ── Main 2-Col Layout ── */}
      <div className="ft-main-grid">
        {/* Left: Transactions */}
        <div className="ft-left-col">
          {/* Recent Transactions */}
          <div className="ft-card">
            <div className="ft-card-head">
              <h3 className="ft-card-title">Recent Transactions</h3>
              <div className="ft-tx-filter-tabs">
                {['All', 'Income', 'Expense'].map(f => (
                  <button
                    key={f}
                    className={`ft-filter-tab ${txFilter === f ? 'ft-filter-tab--active' : ''}`}
                    onClick={() => setTxFilter(f)}
                  >{f}</button>
                ))}
              </div>
              <button className="ft-view-all" onClick={() => setShowAllTx(v => !v)}>
                {showAllTx ? 'Show Less' : 'View All ›'}
              </button>
            </div>

            {/* Search */}
            <div className="ft-search-wrap">
              <span className="ft-search-icon">🔍</span>
              <input
                type="search"
                placeholder="Search transactions…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="ft-search-input"
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, whiteSpace: 'nowrap' }}>Account:</span>
                <select
                  value={accountFilter}
                  onChange={e => setAccountFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: '0.8rem',
                    color: '#374151',
                    outline: 'none',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Accounts</option>
                  {PAYMENT_METHODS.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCategory && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', margin: '0 16px 12px', background: 'rgba(25,108,108,0.08)', borderRadius: 8, fontSize: '0.8rem', color: '#196c6c' }}>
                <span>Filtering category: <strong>{selectedCategory}</strong></span>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{ border: 'none', background: 'none', color: '#196c6c', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px', fontSize: '0.85rem' }}
                >
                  ✕ Clear Filter
                </button>
              </div>
            )}

            {/* Tx Table */}
            <div className="ft-tx-table-wrap">
              {allTransactions.length === 0 && !isLoading ? (
                <div className="ft-empty-state">
                  <div className="ft-empty-icon">📋</div>
                  <p>No transactions yet for {formatMonthDisplay(selectedMonth)}</p>
                  {isAuthorized && (
                    <button className="ft-add-btn-sm" onClick={() => openForm('income')}>
                      ＋ Add your first transaction
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <table className="ft-tx-table">
                    <thead>
                      <tr>
                        <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('date')}>
                          Date {sortField === 'date' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                        </th>
                        <th>Description</th>
                        <th className="ft-tx-cat-col" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('category')}>
                          Category {sortField === 'category' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                        </th>
                        <th>Account</th>
                        <th style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('amount')}>
                          Amount {sortField === 'amount' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                        </th>
                        {isAuthorized && <th style={{ width: 80, textAlign: 'right' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {displayTx.map(tx => {
                        const isIncome = tx._type === 'income';
                        const name = isIncome ? (tx.source || '—') : (tx.vendor || '—');
                        const sub = isIncome ? tx.remark : tx.purpose;
                        const account = isIncome ? tx.creditedTo : tx.paymentMode;
                        const amount = toNum(tx.amount);
                        const cat = tx.category || (isIncome ? 'Income' : 'Expense');
                        const dateStr = tx.date ? parseLocalDate(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

                        return (
                          <tr key={tx._key} className="ft-tx-row">
                            <td className="ft-tx-date">{dateStr}</td>
                            <td>
                              <div className="ft-tx-name-wrap">
                                <span className="ft-tx-cat-icon">{CATEGORY_ICONS[cat] || '💳'}</span>
                                <div>
                                  <div className="ft-tx-name">{name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                                    <span className="ft-tx-mobile-cat" style={{ background: (CATEGORY_COLORS[cat] || '#6b7280') + '22', color: CATEGORY_COLORS[cat] || '#6b7280' }}>
                                      {cat}
                                    </span>
                                    {sub && <span className="ft-tx-sub" style={{ marginTop: 0 }}>{sub}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="ft-tx-cat-col">
                              <span className="ft-tx-cat-pill" style={{ background: (CATEGORY_COLORS[cat] || '#6b7280') + '22', color: CATEGORY_COLORS[cat] || '#6b7280' }}>
                                {cat}
                              </span>
                            </td>
                            <td className="ft-tx-account">
                              {account ? (
                                <span className="ft-tx-account-chip">
                                  🏦 {account}
                                </span>
                              ) : '—'}
                            </td>

                            <td style={{ textAlign: 'right' }}>
                              <span className={`ft-tx-amount ${isIncome ? 'ft-tx-amount--income' : 'ft-tx-amount--expense'}`}>
                                {isIncome ? '+' : '-'}{INR}{fmtAmt(amount)}
                              </span>
                            </td>
                            {isAuthorized && (
                              <td>
                                <div className="ft-tx-actions">
                                  <button
                                    className="ft-tx-action-btn ft-tx-action-btn--edit"
                                    onClick={() => openForm(tx._type, tx._idx)}
                                    title="Edit"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="ft-tx-action-btn ft-tx-action-btn--delete"
                                    onClick={() => initiateDelete(tx._type, tx._idx)}
                                    title="Remove"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {allTransactions.length > 7 && !showAllTx && (
                    <button className="ft-load-more" onClick={() => setShowAllTx(true)}>
                      Show {allTransactions.length - 7} more transactions
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bottom Stats Row */}
          <div className="ft-stats-row">
            {/* Cash Flow Donut */}
            <div className="ft-card ft-card--half">
              <div className="ft-card-head">
                <h3 className="ft-card-title">Cash Flow Summary</h3>
                <span className="ft-card-badge">This Month</span>
              </div>
              <div className="ft-cashflow-body">
                <div style={{ width: 160, height: 160, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PieChart width={160} height={160}>
                    <Pie data={[
                      { name: 'Income', value: totalIncome || 0.01 },
                      { name: 'Expenses', value: totalExpense || 0.01 },
                      { name: 'Savings', value: Math.max(netSavings, 0) || 0.01 },
                    ]} cx={80} cy={80} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip formatter={(v) => `${INR}${fmtAmt(v)}`} />
                  </PieChart>
                </div>
                <div className="ft-cashflow-legend">
                  {[
                    { label: 'Total Income', value: totalIncome, color: '#10b981' },
                    { label: 'Total Expenses', value: totalExpense, color: '#ef4444' },
                    { label: 'Savings', value: Math.max(netSavings, 0), color: '#3b82f6' },
                  ].map(item => (
                    <div key={item.label} className="ft-legend-item">
                      <span className="ft-legend-dot" style={{ background: item.color }} />
                      <div>
                        <div className="ft-legend-label">{item.label}</div>
                        <div className="ft-legend-val">{INR}{fmtAmt(item.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="ft-card ft-card--half">
              <div className="ft-card-head">
                <h3 className="ft-card-title">Weekly Trend</h3>
                <span className="ft-card-badge">This Month</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData} barSize={14} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${INR}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Charts & Budget */}
        <div className="ft-right-col">
          {/* Expense by Category Donut */}
          <div className="ft-card">
            <div className="ft-card-head">
              <h3 className="ft-card-title">Expense by Category</h3>
              <span className="ft-card-badge">This Month</span>
            </div>
            {expenseByCategory.length > 0 ? (
              <div className="ft-pie-body">
                <div style={{ width: 180, height: 180, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PieChart width={180} height={180}>
                    <Pie
                      data={expenseByCategory}
                      cx={90}
                      cy={90}
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={2}
                      onClick={(data) => {
                        if (data && data.name) {
                          setSelectedCategory(prev => prev === data.name ? null : data.name);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {expenseByCategory.map((entry, i) => {
                        const isSelected = selectedCategory === entry.name;
                        const defaultColor = CATEGORY_COLORS[entry.name] || `hsl(${i * 40}, 70%, 60%)`;
                        return (
                          <Cell
                            key={i}
                            fill={defaultColor}
                            stroke={isSelected ? '#000' : 'none'}
                            strokeWidth={isSelected ? 1.5 : 0}
                            style={{
                              opacity: selectedCategory && !isSelected ? 0.4 : 1,
                              transition: 'opacity 0.2s, stroke-width 0.2s',
                              outline: 'none'
                            }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip formatter={(v) => `${INR}${fmtAmt(v)}`} />
                  </PieChart>
                </div>
                <div className="ft-pie-legend">
                  {expenseByCategory.slice(0, 6).map((item, i) => {
                    const color = CATEGORY_COLORS[item.name] || `hsl(${i * 40}, 70%, 60%)`;
                    const pct = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : 0;
                    const isSelected = selectedCategory === item.name;
                    return (
                      <div
                        key={item.name}
                        className={`ft-pie-legend-item ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(prev => prev === item.name ? null : item.name)}
                        style={{
                          cursor: 'pointer',
                          opacity: selectedCategory && !isSelected ? 0.5 : 1,
                          background: isSelected ? 'rgba(0,0,0,0.03)' : 'transparent',
                          padding: '4px 6px',
                          borderRadius: 6,
                          transition: 'opacity 0.2s, background 0.2s'
                        }}
                      >
                        <span className="ft-legend-dot" style={{ background: color }} />
                        <span className="ft-pie-cat" style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{item.name}</span>
                        <span className="ft-pie-val">{INR}{fmtAmt(item.value)}</span>
                        <span className="ft-pie-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="ft-empty-state" style={{ padding: '24px 0' }}>
                <div className="ft-empty-icon">📊</div>
                <p>No expense data yet</p>
              </div>
            )}
          </div>

          {/* Income by Category Donut */}
          <div className="ft-card">
            <div className="ft-card-head">
              <h3 className="ft-card-title">Income by Category</h3>
              <span className="ft-card-badge">This Month</span>
            </div>
            {incomeByCategory.length > 0 ? (
              <div className="ft-pie-body">
                <div style={{ width: 180, height: 180, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PieChart width={180} height={180}>
                    <Pie
                      data={incomeByCategory}
                      cx={90}
                      cy={90}
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={2}
                      onClick={(data) => {
                        if (data && data.name) {
                          setSelectedCategory(prev => prev === data.name ? null : data.name);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {incomeByCategory.map((entry, i) => {
                        const isSelected = selectedCategory === entry.name;
                        const defaultColor = CATEGORY_COLORS[entry.name] || `hsl(${120 + i * 40}, 75%, 45%)`;
                        return (
                          <Cell
                            key={i}
                            fill={defaultColor}
                            stroke={isSelected ? '#000' : 'none'}
                            strokeWidth={isSelected ? 1.5 : 0}
                            style={{
                              opacity: selectedCategory && !isSelected ? 0.4 : 1,
                              transition: 'opacity 0.2s, stroke-width 0.2s',
                              outline: 'none'
                            }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip formatter={(v) => `${INR}${fmtAmt(v)}`} />
                  </PieChart>
                </div>
                <div className="ft-pie-legend">
                  {incomeByCategory.slice(0, 6).map((item, i) => {
                    const color = CATEGORY_COLORS[item.name] || `hsl(${120 + i * 40}, 75%, 45%)`;
                    const pct = totalIncome > 0 ? ((item.value / totalIncome) * 100).toFixed(1) : 0;
                    const isSelected = selectedCategory === item.name;
                    return (
                      <div
                        key={item.name}
                        className={`ft-pie-legend-item ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(prev => prev === item.name ? null : item.name)}
                        style={{
                          cursor: 'pointer',
                          opacity: selectedCategory && !isSelected ? 0.5 : 1,
                          background: isSelected ? 'rgba(0,0,0,0.03)' : 'transparent',
                          padding: '4px 6px',
                          borderRadius: 6,
                          transition: 'opacity 0.2s, background 0.2s'
                        }}
                      >
                        <span className="ft-legend-dot" style={{ background: color }} />
                        <span className="ft-pie-cat" style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{item.name}</span>
                        <span className="ft-pie-val">{INR}{fmtAmt(item.value)}</span>
                        <span className="ft-pie-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="ft-empty-state" style={{ padding: '24px 0' }}>
                <div className="ft-empty-icon">📊</div>
                <p>No income data yet</p>
              </div>
            )}
          </div>

          {/* Income vs Expense Bar */}
          <div className="ft-card">
            <div className="ft-card-head">
              <h3 className="ft-card-title">Income vs Expense</h3>
              <span className="ft-card-badge">This Month</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={16} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${INR}${v >= 1000 ? `${(v / 1000).toFixed(0)}L` : v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="ft-summary-mini-row">
              <div className="ft-summary-mini">
                <span className="ft-summary-mini-icon" style={{ background: '#eff6ff' }}>📊</span>
                <div>
                  <div className="ft-summary-mini-label">Avg Daily Expense</div>
                  <div className="ft-summary-mini-val">{INR}{fmtAmt(avgDailyExpense)}</div>
                  <div className="ft-metric-change negative">↓ per day</div>
                </div>
              </div>
              <div className="ft-summary-mini">
                <span className="ft-summary-mini-icon" style={{ background: '#f0fdf4' }}>⭐</span>
                <div>
                  <div className="ft-summary-mini-label">Total Saved</div>
                  <div className="ft-summary-mini-val">{INR}{fmtAmt(Math.max(netSavings, 0))}</div>
                  <div className="ft-metric-change positive">↑ this month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="ft-card">
            <div className="ft-card-head">
              <h3 className="ft-card-title">Budget Overview</h3>
              <span className="ft-card-badge">This Month</span>
            </div>
            <div className="ft-budget-list">
              {budgetData.map(b => {
                const isSelected = selectedCategory === b.category;
                return (
                  <div
                    key={b.category}
                    onClick={() => setSelectedCategory(prev => prev === b.category ? null : b.category)}
                    style={{
                      cursor: 'pointer',
                      opacity: selectedCategory && !isSelected ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                      borderRadius: 8,
                      background: isSelected ? 'rgba(0,0,0,0.03)' : 'transparent',
                      padding: '4px 6px',
                      margin: '0 -6px'
                    }}
                  >
                    <BudgetBar {...b} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {voiceModalOpen && (
        <VoiceTransactionModal
          isOpen={voiceModalOpen}
          onClose={() => setVoiceModalOpen(false)}
          onSave={handleSaveTransaction}
          showToast={showToast}
        />
      )}
    </div>
  );
}
