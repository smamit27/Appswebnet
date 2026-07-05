import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useCollection } from '../../hooks/useCollection.js';
import SectionCard from '../molecules/SectionCard.jsx';
import ConfirmDeleteModal from '../molecules/ConfirmDeleteModal.jsx';
import ToastNotification from '../molecules/ToastNotification.jsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  itemName: '',
  estimatedCost: '',
  priority: 'Medium',
  status: 'Planned',
  notes: ''
};

export default function FuturePurchases({ isAuthorized, user }) {
  const wishlist = useCollection('future_purchases', [], user, 'date', 'desc');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Metrics
  const totalPlannedCost = useMemo(() => {
    return wishlist.items
      .filter(item => item.status === 'Planned')
      .reduce((sum, item) => sum + (parseFloat(item.estimatedCost) || 0), 0);
  }, [wishlist.items]);

  const highPriorityCount = useMemo(() => {
    return wishlist.items.filter(item => item.status === 'Planned' && item.priority === 'High').length;
  }, [wishlist.items]);

  const boughtCount = useMemo(() => {
    return wishlist.items.filter(item => item.status === 'Bought').length;
  }, [wishlist.items]);

  // Filter & Search
  const filteredItems = useMemo(() => {
    let list = [...wishlist.items];
    if (filterPriority !== 'All') {
      list = list.filter(item => item.priority === filterPriority);
    }
    if (filterStatus !== 'All') {
      list = list.filter(item => item.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item => 
        (item.itemName || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [wishlist.items, filterPriority, filterStatus, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'estimatedCost' ? (value === '' ? '' : parseFloat(value) || '') : value
    }));
  };

  const handleEdit = (item) => {
    setForm({
      date: item.date || new Date().toISOString().slice(0, 10),
      itemName: item.itemName || '',
      estimatedCost: item.estimatedCost || '',
      priority: item.priority || 'Medium',
      status: item.status || 'Planned',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleToggleStatus = async (item) => {
    if (!isAuthorized) return;
    const nextStatus = item.status === 'Planned' ? 'Bought' : 'Planned';
    try {
      await wishlist.update(item.id, { status: nextStatus });
      showToast(`Record updated. Status set to ${nextStatus}.`, 'success');
    } catch (err) {
      console.error('Failed to toggle wishlist status:', err);
      showToast('Failed to update record: ' + err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemName || !form.estimatedCost || !form.date) return;
    setSaving(true);
    try {
      if (editingId) {
        await wishlist.update(editingId, form);
        showToast('Planned purchase updated successfully.', 'success');
      } else {
        await wishlist.add(form);
        showToast('Planned purchase created successfully.', 'success');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save planned purchase:', err);
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
      await wishlist.remove(id);
      showToast('Planned purchase deleted successfully.', 'success');
    } catch (err) {
      console.error('Failed to delete wishlist item:', err);
      showToast('Failed to delete record: ' + err.message, 'error');
    }
  };

  const priorityColor = (pri) => {
    switch(pri) {
      case 'High': return { bg: '#fff3cd', color: '#856404', border: '#ffeeba' };
      case 'Medium': return { bg: '#e8f4fd', color: '#1d4ed8', border: '#bfdbfe' };
      default: return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Hub</p>
          <h1>Future Purchases Tracker</h1>
          <p className="page-header__sub">Plan major household items, balcony work, appliances, and general shopping goals.</p>
        </div>
        <div className="page-header__actions">
          {isAuthorized && (
            <button className="btn btn--primary" id="add-wishlist-btn" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Plan Future Purchase
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="metrics-grid">
        <div className="metric-card metric-card--amber">
          <p className="metric-card__label">Estimated Budget Needed</p>
          <h3 className="metric-card__value">{fmt(totalPlannedCost)}</h3>
          <p className="metric-card__detail">{wishlist.items.filter(item => item.status === 'Planned').length} planned items</p>
        </div>
        <div className="metric-card metric-card--coral">
          <p className="metric-card__label">High Priority Items</p>
          <h3 className="metric-card__value">{highPriorityCount}</h3>
          <p className="metric-card__detail">Requires planning soon</p>
        </div>
        <div className="metric-card metric-card--pine">
          <p className="metric-card__label">Bought & Completed</p>
          <h3 className="metric-card__value">{boughtCount}</h3>
          <p className="metric-card__detail">Items off the wishlist</p>
        </div>
      </div>

      {/* Wishlist Table */}
      <SectionCard
        badge="Wishlist / Planned"
        title="Planned Purchases List"
        subtitle="Estimate costs, prioritize items, and tick them off once purchased."
      >
        <div className="toolbar">
          <div className="toolbar__left">
            <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Bought">Bought</option>
            </select>
          </div>
          <div className="toolbar__right">
            <input
              type="search"
              className="search-input"
              placeholder="Search item or notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date Added</th>
                <th>Item / Expense Target</th>
                <th>Estimated Cost</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Notes</th>
                {isAuthorized && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map((item, i) => {
                const priStyle = priorityColor(item.priority);
                return (
                  <tr key={item.id || i}>
                    <td>{item.date || '—'}</td>
                    <td><strong>{item.itemName}</strong></td>
                    <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{fmt(item.estimatedCost)}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: priStyle.bg,
                        color: priStyle.color,
                        border: `1px solid ${priStyle.border}`
                      }}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={`status-pill ${item.status === 'Bought' ? 'status-pill--active' : 'status-pill--pending'}`}
                        style={{ 
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: item.status === 'Bought' ? '#e6f7ed' : '#fffbe6',
                          color: item.status === 'Bought' ? '#26a294' : '#b98216',
                          border: item.status === 'Bought' ? '1px solid #c2ebd0' : '1px solid #fef08a',
                          cursor: isAuthorized ? 'pointer' : 'default'
                        }}
                        onClick={() => handleToggleStatus(item)}
                        title={isAuthorized ? "Click to toggle Status" : ""}
                      >
                        {item.status === 'Bought' ? '✓ Bought' : '⌛ Planned'}
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
                );
              }) : (
                <tr className="empty-row"><td colSpan={isAuthorized ? 7 : 6}>No planned purchases logged.</td></tr>
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
              <h2 className="modal__title">{editingId ? 'Edit Planned Purchase' : 'Plan Future Purchase'}</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid form-grid--2" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label>Date Added</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Item Name / Work Title</label>
                  <input type="text" name="itemName" value={form.itemName} onChange={handleChange} placeholder="e.g. New Washing Machine" required />
                </div>
                <div className="field">
                  <label>Estimated Cost (₹)</label>
                  <input type="number" name="estimatedCost" value={form.estimatedCost} onChange={handleChange} placeholder="0" min="1" required />
                </div>
                <div className="field">
                  <label>Priority</label>
                  <select name="priority" value={form.priority} onChange={handleChange}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="Planned">Planned</option>
                    <option value="Bought">Bought</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes (optional)</label>
                  <input type="text" name="notes" value={form.notes} onChange={handleChange} placeholder="e.g. Brand target, features wanted, or specific dimensions" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Item' : 'Add to Wishlist'}
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
