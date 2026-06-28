import React, { useState } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../firebase.js';
import './PurchasesTracker.css';

export const MOCK_ORDERS = [
  {
    id: `RECHARGE-2706-SWETA`,
    date: '27-Jun-2026',
    seller: 'Mobile Recharge',
    paidBy: 'Amit Gpay',
    totalAmount: 899.00,
    billDetails: {
      mrp: 899.00,
      discount: 0.00,
      itemTotal: 899.00,
      handlingCharge: 0.00,
      deliveryCharge: 0.00,
    },
    items: [
      { id: 1, name: 'Sweta Mobile Recharge', weight: '1 plan', qty: 1, price: 899.00, category: 'Utilities' },
    ]
  },
  {
    id: `LOCAL-${new Date().getTime().toString().slice(-6)}-WHEAT`,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
    seller: 'Local Vendor',
    paidBy: 'Amit Gpay',
    totalAmount: 540.00,
    billDetails: {
      mrp: 540.00,
      discount: 0.00,
      itemTotal: 540.00,
      handlingCharge: 0.00,
      deliveryCharge: 0.00,
    },
    items: [
      { id: 1, name: 'Wheat', weight: '10 kg', qty: 1, price: 540.00, category: 'Groceries' },
    ]
  },
  {
    id: 'LOCAL-2606-VADA',
    date: '26-Jun-2026',
    seller: 'Local Food Stall',
    paidBy: 'Amit Gpay',
    totalAmount: 150.00,
    billDetails: {
      mrp: 150.00,
      discount: 0.00,
      itemTotal: 150.00,
      handlingCharge: 0.00,
      deliveryCharge: 0.00,
    },
    items: [
      { id: 1, name: 'Vadapav', weight: '1 serving', qty: 1, price: 150.00, category: 'Snacks' },
    ]
  },
  {
    id: 'LOCAL-2506-NARIYAL',
    date: '25-Jun-2026',
    seller: 'Local Vendor',
    paidBy: 'Amit Gpay',
    totalAmount: 110.00,
    billDetails: {
      mrp: 110.00,
      discount: 0.00,
      itemTotal: 110.00,
      handlingCharge: 0.00,
      deliveryCharge: 0.00,
    },
    items: [
      { id: 1, name: 'Nariyal Pani', weight: '1 pc', qty: 1, price: 40.00, category: 'Beverages' },
      { id: 2, name: 'Ice Cream', weight: '1 pack', qty: 1, price: 70.00, category: 'Snacks' },
    ]
  },
  {
    id: 'BLK-2606-913AM',
    date: '26-Jun-2026',
    seller: 'Blinkit',
    paidBy: 'Pluxee',
    totalAmount: 260.00,
    billDetails: {
      mrp: 308.00,
      discount: 1.00,
      itemTotal: 307.00,
      promoDiscount: 59.00,
      handlingCharge: 12.00,
      deliveryCharge: 0.00,
    },
    items: [
      { id: 1, name: 'Patanjali Groundnut Oil', weight: '750 g', qty: 1, price: 182.00, category: 'Grocery' },
      { id: 2, name: 'Prolyte ORS (Orange) - Pack of 3', weight: '3 x 21 g', qty: 1, price: 65.00, category: 'Grocery' },
      { id: 3, name: 'Eno Fruit Salt Regular Fast Relief Antacid', weight: '6 x 5 g', qty: 1, price: 60.00, category: 'Grocery' },
    ]
  },
  {
    id: 'BLK-2258608602',
    date: '25-Jun-2026',
    seller: 'Blinkit',
    paidBy: 'Pluxee',
    totalAmount: 417.00,
    billDetails: {
      mrp: 410.00,
      discount: 5.00,
      itemTotal: 405.00,
      handlingCharge: 12.00,
      deliveryCharge: 0.00,
    },
    items: [
      { id: 1, name: 'Hybrid Tomato', weight: '500 g', qty: 1, price: 30.00, category: 'Vegetable' },
      { id: 2, name: 'Chitale Full Cream Milk', weight: '1 ltr', qty: 1, price: 76.00, category: 'Milk item' },
      { id: 3, name: 'Tide Double Power Detergent Powder - Lemon & Mint', weight: '2.2 kg', qty: 1, price: 299.00, category: 'Household' },
    ]
  }
];

export function getBillingCycle(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return 'Unknown Cycle';
  
  let start = new Date(date);
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

export default function PurchasesTracker() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newOrder, setNewOrder] = useState({ id: '', date: '', seller: '', paidBy: '', totalAmount: '' });

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
    if (expandedOrder === id) setExpandedOrder(null);
    else setExpandedOrder(id);
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    const order = {
      ...newOrder,
      totalAmount: parseFloat(newOrder.totalAmount) || 0,
      displayTotal: parseFloat(newOrder.totalAmount) || 0,
      items: [],
      billDetails: {}
    };

    setOrders([order, ...orders]);
    setIsAdding(false);
    setNewOrder({ id: '', date: '', seller: '', paidBy: '', totalAmount: '' });

    if (!isFirebaseConfigured || !db) return;

    // sync with FinanceTracker
    const d = new Date(order.date);
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
          updatedAt: new Date()
        });
      }
    } catch (err) {
      console.error('Failed to sync purchase to finance:', err);
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
                </tr>
                {expandedOrder === order.id && (
                  <tr className="order-details-row">
                    <td colSpan="5">
                      <div className="order-details-panel">
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
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filteredOrders.length === 0 && (
               <tr className="empty-row"><td colSpan="5">No purchases found for this category in the current cycle.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
