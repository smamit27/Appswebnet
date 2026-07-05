import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useCollection } from '../../hooks/useCollection.js';
import SectionCard from '../molecules/SectionCard.jsx';
import ConfirmDeleteModal from '../molecules/ConfirmDeleteModal.jsx';
import ToastNotification from '../molecules/ToastNotification.jsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  borrower: '',
  amount: '',
  returnDate: '',
  status: 'Pending',
  notes: ''
};

export default function LendingTracker({ isAuthorized, user }) {
  const lending = useCollection('lendings', [], user, 'date', 'desc');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Summarize metrics
  const pendingAmount = useMemo(() => {
    return lending.items
      .filter(item => item.status === 'Pending')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [lending.items]);

  const settledAmount = useMemo(() => {
    return lending.items
      .filter(item => item.status === 'Settled')
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [lending.items]);

  const activeLoansCount = useMemo(() => {
    return lending.items.filter(item => item.status === 'Pending').length;
  }, [lending.items]);

  // Filter & Search items
  const filteredItems = useMemo(() => {
    let list = [...lending.items];
    if (filterStatus !== 'All') {
      list = list.filter(item => item.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item => 
        (item.borrower || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [lending.items, filterStatus, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value) || '') : value
    }));
  };

  const handleEdit = (item) => {
    setForm({
      date: item.date || new Date().toISOString().slice(0, 10),
      borrower: item.borrower || '',
      amount: item.amount || '',
      returnDate: item.returnDate || '',
      status: item.status || 'Pending',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleToggleStatus = async (item) => {
    if (!isAuthorized) return;
    const nextStatus = item.status === 'Pending' ? 'Settled' : 'Pending';
    try {
      await lending.update(item.id, { status: nextStatus });
      showToast(`Record updated. Status set to ${nextStatus}.`, 'success');
    } catch (err) {
      console.error('Failed to toggle lending status:', err);
      showToast('Failed to update record: ' + err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.borrower || !form.amount || !form.date) return;
    setSaving(true);
    try {
      if (editingId) {
        await lending.update(editingId, form);
        showToast('Lending record updated successfully.', 'success');
      } else {
        await lending.add(form);
        showToast('Lending record created successfully.', 'success');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save lending:', err);
      showToast('Failed to save record: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await lending.remove(id);
      showToast('Lending record deleted successfully.', 'success');
    } catch (err) {
      console.error('Failed to delete lending:', err);
      showToast('Failed to delete record: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Finance</p>
          <h1>Money Lent Tracker</h1>
          <p className="page-header__sub">Track cash given to others, expected repayment dates, and outstanding receivables.</p>
        </div>
        <div className="page-header__actions">
          {isAuthorized && (
            <button className="btn btn--primary" id="add-lending-btn" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Log Loan / Lent
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="metrics-grid">
        <div className="metric-card metric-card--coral">
          <p className="metric-card__label">Total Receivables</p>
          <h3 className="metric-card__value">{fmt(pendingAmount)}</h3>
          <p className="metric-card__detail">{activeLoansCount} active pending loans</p>
        </div>
        <div className="metric-card metric-card--pine">
          <p className="metric-card__label">Total Settled / Recovered</p>
          <h3 className="metric-card__value">{fmt(settledAmount)}</h3>
          <p className="metric-card__detail">Lending history recovered</p>
        </div>
        <div className="metric-card metric-card--teal">
          <p className="metric-card__label">Total Logs</p>
          <h3 className="metric-card__value">{lending.items.length}</h3>
          <p className="metric-card__detail">All loans & advances</p>
        </div>
      </div>

      {/* Main Table Card */}
      <SectionCard
        badge="Lending Logs"
        title="Lending Records"
        subtitle="Manage and monitor money lent to friends, family, or other contacts."
      >
        <div className="toolbar">
          <div className="toolbar__left">
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Settled">Settled</option>
            </select>
          </div>
          <div className="toolbar__right">
            <input
              type="search"
              className="search-input"
              placeholder="Search borrower or notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date Given</th>
                <th>Recipient / Borrower</th>
                <th>Amount</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th>Notes</th>
                {isAuthorized && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map((item, i) => (
                <tr key={item.id || i}>
                  <td>{item.date || '—'}</td>
                  <td><strong>{item.borrower}</strong></td>
                  <td style={{ fontWeight: 700, color: item.status === 'Pending' ? 'var(--coral)' : 'var(--pine)' }}>
                    {fmt(item.amount)}
                  </td>
                  <td>{item.returnDate ? item.returnDate : <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Open Date</span>}</td>
                  <td>
                    <span 
                      className={`status-pill ${item.status === 'Settled' ? 'status-pill--active' : 'status-pill--pending'}`}
                      style={{ 
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: item.status === 'Settled' ? '#e6f7ed' : '#fff3f3',
                        color: item.status === 'Settled' ? '#26a294' : '#ef4444',
                        border: item.status === 'Settled' ? '1px solid #c2ebd0' : '1px solid #fecaca',
                        cursor: isAuthorized ? 'pointer' : 'default'
                      }}
                      onClick={() => handleToggleStatus(item)}
                      title={isAuthorized ? "Click to toggle Status" : ""}
                    >
                      {item.status === 'Settled' ? '✓ Settled' : '⌛ Pending'}
                    </span>
                  </td>
                  <td><span className="sub">{item.notes || '—'}</span></td>
                  {isAuthorized && (
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn--secondary btn--sm" style={{ padding: '4px 8px', marginRight: '4px', fontSize: '0.75rem' }} onClick={() => handleEdit(item)}>Edit</button>
                      <button className="btn btn--danger btn--sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setDeleteId(item.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr className="empty-row"><td colSpan={isAuthorized ? 7 : 6}>No lending records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Add / Edit Form Modal */}
      {showForm && createPortal(
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editingId ? 'Edit Lending Record' : 'Log Money Lent'}</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid form-grid--2" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label>Date Given</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Recipient / Borrower</label>
                  <input type="text" name="borrower" value={form.borrower} onChange={handleChange} placeholder="e.g. Contact Name" required />
                </div>
                <div className="field">
                  <label>Amount (₹)</label>
                  <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0" min="1" required />
                </div>
                <div className="field">
                  <label>Expected Return Date (optional)</label>
                  <input type="date" name="returnDate" value={form.returnDate} onChange={handleChange} />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Pending">Pending</option>
                    <option value="Settled">Settled</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes / Purpose (optional)</label>
                  <input type="text" name="notes" value={form.notes} onChange={handleChange} placeholder="e.g. Backed for rent advance, to return next week" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Record' : 'Log Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDeleteModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />

      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
