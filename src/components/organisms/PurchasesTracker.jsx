import React, { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../firebase.js';
import './PurchasesTracker.css';
import ConfirmDeleteModal from '../molecules/ConfirmDeleteModal.jsx';
import ToastNotification from '../molecules/ToastNotification.jsx';

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  
  // Format 1: YYYY-MM-DD (e.g. 2026-06-27)
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  
  // Format 2: DD-MMM-YYYY (e.g. 27-Jun-2026)
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const year = Number(parts[2]);
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthStr = parts[1].toLowerCase().substring(0, 3);
      const monthIdx = months.indexOf(monthStr);
      if (monthIdx !== -1 && !isNaN(day) && !isNaN(year)) {
        return new Date(year, monthIdx, day);
      }
    }
  }
  
  // Fallback to default parsing
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatToDDMMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}



export function getBillingCycle(dateString) {
  const date = parseLocalDate(dateString);
  if (isNaN(date.getTime())) return 'Unknown Cycle';
  
  let start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (date.getDate() < 25) {
    start.setMonth(start.getMonth() - 1);
  }
  start.setDate(25);
  
  let end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(24);

  const formatOpts = { month: 'short', day: 'numeric' };
  const yearFormatOpts = { month: 'short', day: 'numeric', year: 'numeric' };
  
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', formatOpts)} - ${end.toLocaleDateString('en-US', yearFormatOpts)}`;
  } else {
    return `${start.toLocaleDateString('en-US', yearFormatOpts)} - ${end.toLocaleDateString('en-US', yearFormatOpts)}`;
  }
}

export default function PurchasesTracker({ purchases, isAuthorized, user }) {
  const dbOrders = purchases ? purchases.items : [];
  
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newOrder, setNewOrder] = useState({ id: '', date: '', seller: '', paidBy: '', totalAmount: '' });
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editOrderData, setEditOrderData] = useState({ date: '', seller: '', paidBy: '', totalAmount: '' });
  const startEditing = (order) => {
    setExpandedOrder(order.id);
    setEditingOrderId(order.id);
    const parsed = parseLocalDate(order.date);
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    setEditOrderData({
      date: `${yyyy}-${mm}-${dd}`,
      seller: order.seller || '',
      paidBy: order.paidBy || '',
      totalAmount: String(order.totalAmount || '')
    });
  };

  const orders = React.useMemo(() => {
    return [...(dbOrders || [])].sort((a, b) => {
      const dateA = parseLocalDate(a.date);
      const dateB = parseLocalDate(b.date);
      return dateB - dateA;
    });
  }, [dbOrders]);



  const groupedOrders = React.useMemo(() => {
    return orders.reduce((acc, order) => {
      const cycle = getBillingCycle(order.date);
      if (!acc[cycle]) acc[cycle] = { total: 0, orders: [] };
      acc[cycle].orders.push(order);
      acc[cycle].total += order.totalAmount;
      return acc;
    }, {});
  }, [orders]);

  const allCycles = React.useMemo(() => {
    return Object.keys(groupedOrders).sort((a,b) => new Date(b.split(' - ')[0]) - new Date(a.split(' - ')[0]));
  }, [groupedOrders]);

  const allCategories = React.useMemo(() => {
    const cats = new Set();
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (item.category) cats.add(item.category);
        });
      }
    });
    return ['All', ...Array.from(cats).sort()];
  }, [orders]);

  const [selectedCycle, setSelectedCycle] = useState(allCycles[0] || '');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const toggleOrder = (id) => {
    if (expandedOrder === id) {
      setExpandedOrder(null);
      if (editingOrderId === id) {
        setEditingOrderId(null);
      }
      return;
    }

    setExpandedOrder(id);
  };

  const ensureFirebaseWriteAccess = (actionLabel) => {
    if (isFirebaseConfigured && db && user && isAuthorized) {
      return true;
    }

    alert(`Please sign in with authorized access to ${actionLabel} in Firebase.`);
    return false;
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    const parsedDate = parseLocalDate(newOrder.date);
    const formattedDate = formatToDDMMMYYYY(parsedDate);
    const order = {
      ...newOrder,
      date: formattedDate,
      totalAmount: parseFloat(newOrder.totalAmount) || 0,
      displayTotal: parseFloat(newOrder.totalAmount) || 0,
      items: [],
      billDetails: {}
    };

    if (ensureFirebaseWriteAccess('save purchases')) {
      let saved = false;
      try {
        const orderRef = doc(db, 'purchases', order.id);
        await setDoc(orderRef, {
          ...order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user.uid
        });
        saved = true;
      } catch (err) {
        console.error('Failed to save purchase to Firestore:', err);
        alert('Failed to save purchase to Firestore: ' + err.message);
      }

      if (saved) {
        setIsAdding(false);
        setNewOrder({ id: '', date: '', seller: '', paidBy: '', totalAmount: '' });

        // sync with FinanceTracker
        const d = parseLocalDate(order.date);
        if (d.getDate() >= 25) d.setMonth(d.getMonth() + 1);
        const cycleMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const recordId = `family_${cycleMonth}`;
        
        try {
          const docRef = doc(db, 'financeMonthly_family', recordId);
          const snap = await getDoc(docRef);
          const expenseItem = {
            date: order.date,
            vendor: order.seller,
            amount: String(order.totalAmount),
            purpose: `Order ID: ${order.id} (Auto-added)`
          };
          
          if (snap.exists()) {
            await updateDoc(docRef, { expenses: arrayUnion(expenseItem) });
          } else {
            await setDoc(docRef, {
              person: 'family',
              month: cycleMonth,
              income: [],
              expenses: [expenseItem],
              updatedAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error('Failed to sync purchase to finance:', err);
          alert('Failed to sync purchase to family finance: ' + err.message);
        }
      }
    }
  };

  const handleUpdatePurchase = async (e, originalOrder) => {
    e.preventDefault();
    const parsedDate = parseLocalDate(editOrderData.date);
    const formattedDate = formatToDDMMMYYYY(parsedDate);
    const updatedOrder = {
      ...originalOrder,
      date: formattedDate,
      seller: editOrderData.seller,
      paidBy: editOrderData.paidBy,
      totalAmount: parseFloat(editOrderData.totalAmount) || 0,
      displayTotal: parseFloat(editOrderData.totalAmount) || 0
    };

    if (ensureFirebaseWriteAccess('update purchases')) {
      try {
        const orderRef = doc(db, 'purchases', originalOrder.id);
        await setDoc(orderRef, {
          ...updatedOrder,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error('Failed to update purchase in Firestore:', err);
        alert('Failed to update purchase: ' + err.message);
        return;
      }

      setEditingOrderId(null);

      // Sync/update in financeMonthly_family
      const originalParsed = parseLocalDate(originalOrder.date);
      if (originalParsed.getDate() >= 25) originalParsed.setMonth(originalParsed.getMonth() + 1);
      const originalCycleMonth = `${originalParsed.getFullYear()}-${String(originalParsed.getMonth() + 1).padStart(2, '0')}`;
      
      const newParsed = parseLocalDate(updatedOrder.date);
      if (newParsed.getDate() >= 25) newParsed.setMonth(newParsed.getMonth() + 1);
      const newCycleMonth = `${newParsed.getFullYear()}-${String(newParsed.getMonth() + 1).padStart(2, '0')}`;

      if (originalCycleMonth === newCycleMonth) {
        const recordId = `family_${newCycleMonth}`;
        try {
          const docRef = doc(db, 'financeMonthly_family', recordId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            const expensesList = data.expenses || [];
            
            const updatedExpenses = expensesList.map(exp => {
              if (exp.purpose && exp.purpose.includes(`Order ID: ${originalOrder.id}`)) {
                return {
                  ...exp,
                  date: updatedOrder.date,
                  vendor: updatedOrder.seller,
                  amount: String(updatedOrder.totalAmount)
                };
              }
              return exp;
            });
            await updateDoc(docRef, { expenses: updatedExpenses });
          }
        } catch (err) {
          console.error('Failed to update sync in family finance:', err);
        }
      } else {
        const oldRecordId = `family_${originalCycleMonth}`;
        const newRecordId = `family_${newCycleMonth}`;
        
        try {
          // Remove from old doc
          const oldDocRef = doc(db, 'financeMonthly_family', oldRecordId);
          const oldSnap = await getDoc(oldDocRef);
          if (oldSnap.exists()) {
            const oldData = oldSnap.data();
            const filteredExpenses = (oldData.expenses || []).filter(
              exp => !(exp.purpose && exp.purpose.includes(`Order ID: ${originalOrder.id}`))
            );
            await updateDoc(oldDocRef, { expenses: filteredExpenses });
          }
          
          // Add to new doc
          const newDocRef = doc(db, 'financeMonthly_family', newRecordId);
          const newSnap = await getDoc(newDocRef);
          const expenseItem = {
            date: updatedOrder.date,
            vendor: updatedOrder.seller,
            amount: String(updatedOrder.totalAmount),
            purpose: `Order ID: ${updatedOrder.id} (Auto-added)`
          };
          
          if (newSnap.exists()) {
            await updateDoc(newDocRef, { expenses: arrayUnion(expenseItem) });
          } else {
            await setDoc(newDocRef, {
              person: 'family',
              month: newCycleMonth,
              income: [],
              expenses: [expenseItem],
              updatedAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.error('Failed to shift sync between cycles in family finance:', err);
        }
      }
    }
  };

  const [deleteOrder, setDeleteOrder] = useState(null); // stores order object
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleConfirmDelete = async () => {
    if (!deleteOrder) return;
    const order = deleteOrder;
    setDeleteOrder(null);

    if (ensureFirebaseWriteAccess('delete purchases')) {
      try {
        const orderRef = doc(db, 'purchases', order.id);
        await deleteDoc(orderRef);
      } catch (err) {
        console.error('Failed to delete purchase from Firestore:', err);
        showToast('Failed to delete purchase: ' + err.message, 'error');
        return;
      }

      // Sync delete with family finance
      const d = parseLocalDate(order.date);
      if (d.getDate() >= 25) d.setMonth(d.getMonth() + 1);
      const cycleMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const recordId = `family_${cycleMonth}`;

      try {
        const docRef = doc(db, 'financeMonthly_family', recordId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const expensesList = data.expenses || [];
          const filteredExpenses = expensesList.filter(
            exp => !(exp.purpose && exp.purpose.includes(`Order ID: ${order.id}`))
          );
          await updateDoc(docRef, { expenses: filteredExpenses });
        }
      } catch (err) {
        console.error('Failed to remove sync in family finance:', err);
      }
      
      showToast('Purchase deleted successfully.', 'success');
    }
  };

  const currentCycleData = groupedOrders[selectedCycle] || { total: 0, orders: [] };

  const filteredOrders = React.useMemo(() => {
    if (selectedCategory === 'All') {
      return currentCycleData.orders.map(o => ({...o, displayTotal: o.totalAmount, isPartial: false}));
    }
    
    return currentCycleData.orders.map(order => {
      const matchedItems = order.items.filter(item => 
        item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (matchedItems.length === 0) return null;
      
      const filteredTotal = matchedItems.reduce((sum, item) => sum + item.price, 0);
      return {
        ...order,
        items: matchedItems,
        displayTotal: filteredTotal,
        isPartial: true
      };
    }).filter(Boolean);
  }, [currentCycleData.orders, selectedCategory]);

  const displayCycleTotal = React.useMemo(() => {
    if (selectedCategory === 'All') return currentCycleData.total;
    return filteredOrders.reduce((sum, order) => sum + order.displayTotal, 0);
  }, [selectedCategory, currentCycleData.total, filteredOrders]);

  return (
    <div className="section-card purchases-card">
      <div className="section-card__header purchases-header-flex">
        <div>
          <div className="section-card__eyebrow">Shopping</div>
          <h2>Purchases Tracker</h2>
          <p className="section-card__subtitle">Track your grocery and household orders.</p>
        </div>
        {allCycles.length > 0 && (
          <div className="filters-container">
            <div className="filter-group">
              <label>Category:</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Billing Cycle:</label>
              <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)}>
                {allCycles.map(cycle => (
                  <option key={cycle} value={cycle}>{cycle}</option>
                ))}
              </select>
            </div>
            <div className="cycle-total">
              Cycle Total: <strong>₹{displayCycleTotal.toFixed(2)}</strong>
            </div>
            <button className="btn btn--primary btn--sm" style={{ marginLeft: 'auto' }} onClick={() => setIsAdding(!isAdding)}>
              {isAdding ? 'Cancel' : '+ Add Purchase'}
            </button>
          </div>
        )}
      </div>

      {isAdding && (
        <form className="add-purchase-form" onSubmit={handleAddPurchase} style={{ padding: '20px', background: 'var(--surface-50)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Order ID</label>
            <input type="text" required value={newOrder.id} onChange={e => setNewOrder({...newOrder, id: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }} placeholder="e.g. BLK-123" />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Date</label>
            <input type="date" required value={newOrder.date} onChange={e => setNewOrder({...newOrder, date: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Seller</label>
            <input type="text" required value={newOrder.seller} onChange={e => setNewOrder({...newOrder, seller: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }} placeholder="e.g. Amazon" />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Paid By</label>
            <input type="text" required value={newOrder.paidBy} onChange={e => setNewOrder({...newOrder, paidBy: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }} placeholder="e.g. Credit Card" />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Total Amount</label>
            <input type="number" step="0.01" required value={newOrder.totalAmount} onChange={e => setNewOrder({...newOrder, totalAmount: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px' }} placeholder="₹0.00" />
          </div>
          <button type="submit" className="btn btn--primary" style={{ padding: '8px 16px', height: '35px' }}>Save</button>
        </form>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Seller</th>
              <th>Paid By</th>
              <th>Total Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <React.Fragment key={order.id}>
                <tr className="order-row" onClick={() => toggleOrder(order.id)}>
                  <td><strong>{order.id}</strong></td>
                  <td>{order.date}</td>
                  <td>{order.seller}</td>
                  <td>
                    {order.paidBy ? (
                      <span className={`cat-pill cat-pill--${order.paidBy.toLowerCase().replace(' ', '-')}`}>
                        {order.paidBy}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <strong>₹{order.displayTotal.toFixed(2)}</strong>
                    {order.isPartial && <div style={{fontSize: '0.75rem', color: 'var(--slate)'}}>(Filtered)</div>}
                  </td>
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn--secondary btn--sm" style={{ padding: '4px 8px', marginRight: '4px', fontSize: '0.75rem' }} onClick={() => startEditing(order)}>Edit</button>
                    <button className="btn btn--danger btn--sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setDeleteOrder(order)}>Delete</button>
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr className="order-details-row">
                    <td colSpan="6">
                      <div className="order-details-panel">
                        {editingOrderId === order.id ? (
                          <form onSubmit={(e) => handleUpdatePurchase(e, order)} className="edit-purchase-form" style={{ padding: '15px', background: 'var(--surface-50)', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                            <h4 style={{ margin: '0 0 5px 0' }}>Edit Purchase: {order.id}</h4>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              <div style={{ flex: '1 1 120px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', fontWeight: '500' }}>Date</label>
                                <input type="date" required value={editOrderData.date} onChange={e => setEditOrderData({...editOrderData, date: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                              </div>
                              <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', fontWeight: '500' }}>Seller</label>
                                <input type="text" required value={editOrderData.seller} onChange={e => setEditOrderData({...editOrderData, seller: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                              </div>
                              <div style={{ flex: '1 1 150px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', fontWeight: '500' }}>Paid By</label>
                                <input type="text" required value={editOrderData.paidBy} onChange={e => setEditOrderData({...editOrderData, paidBy: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                              </div>
                              <div style={{ flex: '1 1 100px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', fontWeight: '500' }}>Total Amount</label>
                                <input type="number" step="0.01" required value={editOrderData.totalAmount} onChange={e => setEditOrderData({...editOrderData, totalAmount: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px' }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <button type="submit" className="btn btn--primary btn--sm">Save Update</button>
                              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditingOrderId(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <h4>Order Summary ({order.items ? order.items.length : 0} items)</h4>
                            
                            <div className="order-content-flex">
                              <div className="items-list">
                                {order.items && order.items.map(item => (
                                  <div className="item-row" key={item.id}>
                                    <div className="item-info">
                                      <div className="item-name">
                                        {item.name}
                                        {item.category && (
                                          <span className="item-category-tag">{item.category}</span>
                                        )}
                                      </div>
                                      <div className="item-meta">
                                        {item.weight} • Qty: {item.qty}
                                      </div>
                                    </div>
                                    <div className="item-price">
                                      ₹{item.price.toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                                {(!order.items || order.items.length === 0) && (
                                  <div style={{ color: 'var(--slate)', fontSize: '0.9rem', fontStyle: 'italic' }}>No item details available.</div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredOrders.length === 0 && (
               <tr className="empty-row"><td colSpan="6">No purchases found for this category in the current cycle.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteOrder !== null}
        onClose={() => setDeleteOrder(null)}
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
