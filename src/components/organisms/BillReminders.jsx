import React, { useState } from 'react';
import SectionCard from '../molecules/SectionCard.jsx';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (v) => INR.format(v || 0);

const MOCK_BILLS = [
  { id: 1, name: 'Electricity Bill', provider: 'BESCOM', dueDate: '2026-07-15', amount: 2450, status: 'Pending', type: 'Utility' },
  { id: 2, name: 'Internet', provider: 'Airtel', dueDate: '2026-07-12', amount: 1180, status: 'Paid', type: 'Utility' },
  { id: 3, name: 'HDFC Credit Card', provider: 'HDFC Bank', dueDate: '2026-07-20', amount: 45600, status: 'Pending', type: 'Credit Card' },
  { id: 4, name: 'Car EMI', provider: 'ICICI Bank', dueDate: '2026-07-05', amount: 15400, status: 'Paid', type: 'EMI' },
  { id: 5, name: 'Netflix', provider: 'Netflix', dueDate: '2026-07-25', amount: 649, status: 'Pending', type: 'Subscription' },
];

export default function BillReminders() {
  const [bills, setBills] = useState(MOCK_BILLS);

  const pendingBills = bills.filter(b => b.status === 'Pending').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const paidBills = bills.filter(b => b.status === 'Paid').sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

  const totalPending = pendingBills.reduce((acc, bill) => acc + bill.amount, 0);

  return (
    <div className="bill-reminders" style={{ display: 'grid', gap: '20px' }}>
      <header className="page-header">
        <h2>Bill & EMI Reminders</h2>
        <p>Track upcoming payments to avoid late fees</p>
      </header>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Total Pending Amount</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e9c46a' }}>{fmt(totalPending)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Pending Bills</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{pendingBills.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <SectionCard title="Upcoming / Pending" delay={0.1}>
          {pendingBills.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No pending bills!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pendingBills.map(bill => (
                <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{bill.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{bill.provider} • Due: {new Date(bill.dueDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#e9c46a' }}>{fmt(bill.amount)}</div>
                    <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem', marginTop: '5px' }}>Mark Paid</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recently Paid" delay={0.2}>
          {paidBills.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No paid bills yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {paidBills.map(bill => (
                <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>{bill.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{bill.provider} • Due: {new Date(bill.dueDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#3a7d44' }}>{fmt(bill.amount)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#3a7d44', marginTop: '5px' }}>✓ Paid</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
