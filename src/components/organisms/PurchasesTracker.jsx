import React, { useState } from 'react';
import './PurchasesTracker.css';

const MOCK_ORDERS = [
  {
    id: `BLK-2258608602`,
    date: '25-Jun-2026',
    seller: 'Blinkit',
    paidBy: 'Pluxee',
    totalAmount: 417.00,
    billDetails: {
      mrp: 417.00,
      discount: 0.00,
      itemTotal: 417.00,
      handlingCharge: 0.00,
      deliveryCharge: 0.00,
    },
    items: [
      { id: 1, name: 'Blinkit Groceries', weight: 'mixed', qty: 1, price: 417.00, category: 'Groceries' },
    ]
  },
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

function getBillingCycle(dateString) {
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
  const [expandedOrder, setExpandedOrder] = useState(null);

  const groupedOrders = React.useMemo(() => {
    return MOCK_ORDERS.reduce((acc, order) => {
      const cycle = getBillingCycle(order.date);
      if (!acc[cycle]) acc[cycle] = { total: 0, orders: [] };
      acc[cycle].orders.push(order);
      acc[cycle].total += order.totalAmount;
      return acc;
    }, {});
  }, []);

  const allCycles = React.useMemo(() => {
    return Object.keys(groupedOrders).sort((a,b) => new Date(b.split(' - ')[0]) - new Date(a.split(' - ')[0]));
  }, [groupedOrders]);

  const allCategories = React.useMemo(() => {
    const cats = new Set();
    MOCK_ORDERS.forEach(order => {
      order.items.forEach(item => {
        if (item.category) cats.add(item.category);
      });
    });
    return ['All', ...Array.from(cats).sort()];
  }, []);

  const [selectedCycle, setSelectedCycle] = useState(allCycles[0] || '');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const toggleOrder = (id) => {
    if (expandedOrder === id) setExpandedOrder(null);
    else setExpandedOrder(id);
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
          </div>
        )}
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Seller</th>
              <th>Paid By</th>
              <th>Total Amount</th>
              <th>Action</th>
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
                  <td>
                    <button className="btn btn--sm btn--secondary" onClick={(e) => { e.stopPropagation(); toggleOrder(order.id); }}>
                      {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                    </button>
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr className="order-details-row">
                    <td colSpan="6">
                      <div className="order-details-panel">
                        <h4>Order Summary ({order.items.length} items)</h4>
                        
                        <div className="order-content-flex">
                          <div className="items-list">
                            {order.items.map(item => (
                              <div className="item-row" key={item.id}>
                                <div className="item-info">
                                  <div className="item-name">
                                    {item.name}
                                    {item.category && (
                                      <span className={`cat-pill cat-pill--${item.category.toLowerCase().replace(' ', '-')}`}>
                                        {item.category}
                                      </span>
                                    )}
                                  </div>
                                  <div className="item-meta">{item.weight} x {item.qty}</div>
                                </div>
                                <div className="item-price">₹{item.price.toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                          
                          {!order.isPartial && (
                            <div className="bill-summary">
                              <h5>Bill details</h5>
                              <div className="bill-row">
                                <span>MRP</span>
                                <span>₹{order.billDetails.mrp.toFixed(2)}</span>
                              </div>
                              <div className="bill-row discount">
                                <span>Product discount</span>
                                <span>-₹{order.billDetails.discount.toFixed(2)}</span>
                              </div>
                              <div className="bill-row item-total">
                                <span>Item total</span>
                                <span>₹{order.billDetails.itemTotal.toFixed(2)}</span>
                              </div>
                              {order.billDetails.promoDiscount > 0 && (
                                <div className="bill-row discount">
                                  <span>Promo discount</span>
                                  <span>-₹{order.billDetails.promoDiscount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="bill-row">
                                <span>Handling charge</span>
                                <span>+₹{order.billDetails.handlingCharge.toFixed(2)}</span>
                              </div>
                              <div className="bill-row">
                                <span>Delivery charges</span>
                                <span className="free">FREE</span>
                              </div>
                              <div className="bill-row grand-total">
                                <span>Bill total</span>
                                <span>₹{order.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
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
