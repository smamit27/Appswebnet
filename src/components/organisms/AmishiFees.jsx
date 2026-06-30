import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import SectionCard from '../molecules/SectionCard.jsx';
import StatusPill from '../atoms/StatusPill.jsx';
import { AMISHI_BOOKS_INVOICE } from '../../data/amishiBooksInvoice.js';

export const SESSIONS_DATA = [
  { value: '2025-26', label: 'Nursery', offset: 0 },
  { value: '2026-27', label: 'PREP', offset: 1 },
  { value: '2027-28', label: '1st Standard', offset: 2 },
  { value: '2028-29', label: '2nd Standard', offset: 3 },
  { value: '2029-30', label: '3rd Standard', offset: 4 },
  { value: '2030-31', label: '4th Standard', offset: 5 },
  { value: '2031-32', label: '5th Standard', offset: 6 },
  { value: '2032-33', label: '6th Standard', offset: 7 },
  { value: '2033-34', label: '7th Standard', offset: 8 },
  { value: '2034-35', label: '8th Standard', offset: 9 },
  { value: '2035-36', label: '9th Standard', offset: 10 },
  { value: '2036-37', label: '10th Standard', offset: 11 },
  { value: '2037-38', label: '11th Standard', offset: 12 },
  { value: '2038-39', label: '12th Standard', offset: 13 },
];

export function getMonthlyFee(offset) {
  const baseMonthly = 10750;
  const monthlyInc = 1000;
  if (offset === 0) return 10750;
  if (offset === 1) return 11550; // PREP is 11550 monthly / 23100 bimonthly
  return baseMonthly + (offset * monthlyInc);
}

export default function AmishiFees({ items, session, onSessionChange, isAuthorized, onSavePayment }) {
  const currentSessionConfig = SESSIONS_DATA.find(s => s.value === session) || SESSIONS_DATA[0];
  const offset = currentSessionConfig.offset;
  const is2025 = offset === 0;
  
  const monthlyFee = getMonthlyFee(offset);

  const FEE_STRUCTURE = {
    monthly: monthlyFee,
    bimonthly: monthlyFee * 2,
    misc: is2025 ? 6000 : 6600,
    books: is2025 ? 0 : 6662,
    admission: is2025 ? 140000 : 0,
    registration: is2025 ? 2500 : 0,
    stationaryCloth: is2025 ? 12000 : 0
  };

  const baseYear = parseInt(session.split('-')[0], 10);
  const nextYear = baseYear + 1;
  const sessionStr = `(${session})`;

  const CYCLES = [
    { id: 'cycle_6', monthGroup: `April-${baseYear}`, feeHead: 'Education Fee', forPeriod: `APR-MAY${sessionStr}`, amount: FEE_STRUCTURE.bimonthly },
    { id: 'misc',    monthGroup: `April-${baseYear}`, feeHead: `Annual Miscellaneous Charge ${sessionStr}`, forPeriod: sessionStr, amount: FEE_STRUCTURE.misc },
    { id: 'cycle_1', monthGroup: `June-${baseYear}`, feeHead: 'Education Fee', forPeriod: `JUN-JUL${sessionStr}`, amount: FEE_STRUCTURE.bimonthly },
    { id: 'cycle_2', monthGroup: `August-${baseYear}`, feeHead: 'Education Fee', forPeriod: `AUG-SEP${sessionStr}`, amount: FEE_STRUCTURE.bimonthly },
    { id: 'cycle_3', monthGroup: `October-${baseYear}`, feeHead: 'Education Fee', forPeriod: `OCT-NOV${sessionStr}`, amount: FEE_STRUCTURE.bimonthly },
    { id: 'cycle_4', monthGroup: `December-${baseYear}`, feeHead: 'Education Fee', forPeriod: `DEC-JAN${sessionStr}`, amount: FEE_STRUCTURE.bimonthly },
    { id: 'cycle_5', monthGroup: `February-${nextYear}`, feeHead: 'Education Fee', forPeriod: `FEB-MAR${sessionStr}`, amount: FEE_STRUCTURE.bimonthly },
  ];

  if (is2025) {
    CYCLES.unshift({ id: 'registration', monthGroup: `October-${baseYear - 1}`, feeHead: 'Registration Fee', forPeriod: sessionStr, amount: FEE_STRUCTURE.registration });
    CYCLES.unshift({ id: 'admission', monthGroup: `December-${baseYear - 1}`, feeHead: 'Admission Fee', forPeriod: sessionStr, amount: FEE_STRUCTURE.admission });
    CYCLES.splice(4, 0, { id: 'stationary_cloth', monthGroup: `June-${baseYear}`, feeHead: `Stationery + Cloth ${sessionStr}`, forPeriod: sessionStr, amount: FEE_STRUCTURE.stationaryCloth });
  } else {
    CYCLES.splice(2, 0, { id: 'books', monthGroup: `April-${baseYear}`, feeHead: `Books & Stationery ${sessionStr}`, forPeriod: sessionStr, amount: FEE_STRUCTURE.books });
  }

  const [showLifetimeProjection, setShowLifetimeProjection] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [payDate, setPayDate] = useState('');
  const [refNo, setRefNo] = useState('');
  const [showBooksDetails, setShowBooksDetails] = useState(false);
  
  const handleEdit = (id, existingDate, existingRef) => {
    setEditingId(id);
    setPayDate(existingDate || new Date().toISOString().slice(0, 10));
    setRefNo(existingRef || '');
  };

  const handleSave = (id) => {
    if (!payDate) return;
    onSavePayment({
      id, // Used as Firestore doc ID
      paid: true,
      payDate,
      refNo
    });
    setEditingId(null);
  };
  
  const handleMarkPending = (id) => {
    onSavePayment({
      id,
      paid: false,
      payDate: null,
      refNo: null
    });
  }

  // Calculate totals
  const totalDue = CYCLES.reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = CYCLES.reduce((sum, c) => {
    const item = items.find(i => i.id === c.id);
    return item?.paid ? sum + c.amount : sum;
  }, 0);

  const handleBulkImport = () => {
    if (session !== '2025-26') return alert('Please switch to 2025-26 session first!');
    const records = [
      { id: 'registration', paid: true, payDate: '2024-10-20', refNo: 'Manual Entry' },
      { id: 'admission', paid: true, payDate: '2024-12-17', refNo: 'DPSPU2526/00192' },
      { id: 'cycle_6', paid: true, payDate: '2025-04-05', refNo: 'ecs_38 (144)' },
      { id: 'misc', paid: true, payDate: '2025-04-05', refNo: 'NACH/530' },
      { id: 'cycle_1', paid: true, payDate: '2025-06-05', refNo: 'ecs_39 (3707)' },
      { id: 'stationary_cloth', paid: true, payDate: '2025-06-05', refNo: 'Manual Entry' },
      { id: 'cycle_2', paid: true, payDate: '2025-08-05', refNo: 'ecs_40 (7227)' },
      { id: 'cycle_3', paid: true, payDate: '2025-10-05', refNo: 'ecs_41 (11082)' },
      { id: 'cycle_4', paid: true, payDate: '2025-12-05', refNo: 'ecs_42 (14519)' },
      { id: 'cycle_5', paid: true, payDate: '2026-02-05', refNo: 'ecs_43 (17934)' },
    ];
    records.forEach(r => onSavePayment(r));
    alert('Imported successfully!');
  };
  
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Amishi</p>
          <h1>School Fees Tracker 🎓</h1>
          <p className="page-header__sub">Track bi-monthly tuition and miscellaneous payments.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px' }}>
              Student: AMISHI SINGH
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px' }}>
              Admission No: N-4705-25
            </span>
          </div>
          {isAuthorized && is2025 && (
            <button onClick={handleBulkImport} className="btn btn--sm btn--primary" style={{ marginTop: 12 }}>
              Import / Reset Bulk 2025-26 Records
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn--sm btn--secondary" 
            onClick={() => setShowLifetimeProjection(true)}
          >
            📊 Lifetime Projection
          </button>
          <select 
            value={session} 
            onChange={(e) => onSessionChange(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--line)', 
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            {SESSIONS_DATA.map(s => (
              <option key={s.value} value={s.value}>
                Session {s.value} ({s.label})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <SectionCard badge="Fees" title="Total Due (Year)">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)' }}>
            ₹{totalDue.toLocaleString()}
          </div>
        </SectionCard>
        <SectionCard badge="Payments" title="Total Paid">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)' }}>
            ₹{totalPaid.toLocaleString()}
          </div>
        </SectionCard>
        <SectionCard badge="Balance" title="Remaining">
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--red)' }}>
            ₹{(totalDue - totalPaid).toLocaleString()}
          </div>
        </SectionCard>
      </div>
      
      {/* Structure Info */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Fee</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{FEE_STRUCTURE.monthly.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Bi-Monthly Amount</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{FEE_STRUCTURE.bimonthly.toLocaleString()}</div>
        </div>
        {!is2025 && (
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Books & Stationery</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{FEE_STRUCTURE.books.toLocaleString()}</div>
          </div>
        )}
        {is2025 && (
          <>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Registration</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{FEE_STRUCTURE.registration.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Admission Fee</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{FEE_STRUCTURE.admission.toLocaleString()}</div>
            </div>
          </>
        )}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Miscellaneous (Yearly)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{FEE_STRUCTURE.misc.toLocaleString()}</div>
        </div>
      </div>

      {/* Fee Ledger */}
      <SectionCard badge="Ledger" title="Fee Ledger">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(CYCLES.reduce((acc, cycle) => {
            if (!acc[cycle.monthGroup]) acc[cycle.monthGroup] = [];
            acc[cycle.monthGroup].push(cycle);
            return acc;
          }, {})).map(([month, groupCycles]) => {
            const isGroupPaid = groupCycles.every(c => items.find(i => i.id === c.id)?.paid);
            let groupPayable = 0;
            let groupPaidAmt = 0;
            let groupBalance = 0;

            return (
              <div key={month} className="ledger-month-block">
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ marginBottom: '4px', color: 'var(--primary)', fontSize: '1.2rem' }}>{month.replace('-', ' ')}</h3>
                  <StatusPill status={isGroupPaid ? 'Paid' : 'Pending'} />
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead style={{ background: 'var(--bg)', borderBottom: '2px solid var(--line)', fontSize: '0.9rem' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Fee Head</th>
                        <th style={{ padding: '12px 16px' }}>For the Period</th>
                        <th style={{ padding: '12px 16px' }}>Payable Amount</th>
                        <th style={{ padding: '12px 16px' }}>Paid Amt.</th>
                        <th style={{ padding: '12px 16px' }}>Paid Date</th>
                        <th style={{ padding: '12px 16px' }}>Balance Amt.</th>
                        {isAuthorized && <th style={{ padding: '12px 16px' }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.9rem' }}>
                      {groupCycles.map(cycle => {
                        const item = items.find(i => i.id === cycle.id);
                        const isPaid = item?.paid;
                        const isEditing = editingId === cycle.id;
                        const paidAmt = isPaid ? cycle.amount : 0;
                        const balAmt = cycle.amount - paidAmt;
                        
                        groupPayable += cycle.amount;
                        groupPaidAmt += paidAmt;
                        groupBalance += balAmt;
                        
                        return (
                          <React.Fragment key={cycle.id}>
                            <tr style={{ borderBottom: '1px solid var(--line)' }}>
                              <td style={{ padding: '12px 16px' }}>{cycle.feeHead}</td>
                              <td style={{ padding: '12px 16px' }}>{cycle.forPeriod}</td>
                              <td style={{ padding: '12px 16px' }}>₹ {cycle.amount.toLocaleString()}</td>
                              <td style={{ padding: '12px 16px' }}>₹ {paidAmt.toLocaleString()}</td>
                              <td style={{ padding: '12px 16px' }}>{isPaid && item?.payDate ? item.payDate : '-'}</td>
                              <td style={{ padding: '12px 16px' }}>₹ {balAmt.toLocaleString()}</td>
                              {isAuthorized && (
                                <td style={{ padding: '12px 16px' }}>
                                  {!isEditing ? (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <button className={`btn btn--sm ${isPaid ? 'btn--secondary' : 'btn--primary'}`} onClick={() => isPaid ? handleMarkPending(cycle.id) : handleEdit(cycle.id, item?.payDate, item?.refNo)}>
                                        {isPaid ? 'Mark Pending' : 'Mark Paid'}
                                      </button>
                                      {cycle.id === 'books' && (
                                        <button className="btn btn--sm btn--secondary" onClick={() => setShowBooksDetails(!showBooksDetails)}>
                                          {showBooksDetails ? 'Hide Books' : 'View Books'}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      <input type="date" className="input" value={payDate} onChange={e => setPayDate(e.target.value)} style={{ padding: '4px', fontSize: '0.8rem' }} />
                                      <input type="text" className="input" placeholder="Ref No." value={refNo} onChange={e => setRefNo(e.target.value)} style={{ padding: '4px', fontSize: '0.8rem' }} />
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="btn btn--primary btn--sm" onClick={() => handleSave(cycle.id)}>Save</button>
                                        <button className="btn btn--secondary btn--sm" onClick={() => setEditingId(null)}>Cancel</button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                            {cycle.id === 'books' && showBooksDetails && (
                              <tr>
                                <td colSpan={isAuthorized ? "7" : "6"} style={{ padding: 0 }}>
                                  <div style={{ background: 'var(--bg)', padding: '16px', borderBottom: '1px solid var(--line)' }}>
                                    <h4 style={{ marginBottom: '12px' }}>Student Galaxy Invoice Breakdown (Inv #13430)</h4>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: '#fff' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                                          <th style={{ padding: '8px' }}>S.No</th>
                                          <th style={{ padding: '8px' }}>Item Name</th>
                                          <th style={{ padding: '8px' }}>Qty</th>
                                          <th style={{ padding: '8px', textAlign: 'right' }}>Amount (₹)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {AMISHI_BOOKS_INVOICE.map(bookItem => (
                                          <tr key={bookItem.sno} style={{ borderBottom: '1px solid var(--line)' }}>
                                            <td style={{ padding: '8px', color: 'var(--muted)' }}>{bookItem.sno}</td>
                                            <td style={{ padding: '8px', fontWeight: 500 }}>{bookItem.name}</td>
                                            <td style={{ padding: '8px', color: 'var(--muted)' }}>{bookItem.qty}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{bookItem.price.toLocaleString()}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr>
                                          <td colSpan="3" style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>Grand Total:</td>
                                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>₹ 6,662.00</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot style={{ background: 'var(--bg)', fontWeight: 'bold', fontSize: '0.9rem', borderTop: '2px solid var(--line)' }}>
                      <tr>
                        <td colSpan="2" style={{ padding: '12px 16px' }}>Total</td>
                        <td style={{ padding: '12px 16px' }}>₹ {groupPayable.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>₹ {groupPaidAmt.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>-</td>
                        <td style={{ padding: '12px 16px' }}>₹ {groupBalance.toLocaleString()}</td>
                        {isAuthorized && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Fee Payment Details */}
      <SectionCard badge="Payments" title="Fee Payment Details">
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--bg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ background: 'var(--bg)', borderBottom: '2px solid var(--line)', fontSize: '0.85rem' }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>Receipt No.</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Late Fee</th>
                <th style={{ padding: '12px 16px' }}>Cheque Bounce</th>
                <th style={{ padding: '12px 16px' }}>Cheque No. / Document No.</th>
                <th style={{ padding: '12px 16px' }}>Bank</th>
                <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                <th style={{ padding: '12px 16px' }}>Print</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.85rem' }}>
              {items.filter(i => i.paid).sort((a, b) => new Date(a.payDate) - new Date(b.payDate)).map(item => {
                const cycle = CYCLES.find(c => c.id === item.id);
                const amount = cycle ? cycle.amount : 0;
                
                // Extract receipt vs document no if formatted as "doc (receipt)"
                let receiptNo = '-';
                let docNo = item.refNo || '-';
                if (item.refNo && item.refNo.includes('(')) {
                  const match = item.refNo.match(/(.*?)\s*\((.*?)\)/);
                  if (match) {
                    docNo = match[1].trim();
                    receiptNo = match[2].trim();
                  }
                } else if (item.refNo && item.refNo.startsWith('DPS')) {
                  receiptNo = item.refNo;
                  docNo = '-';
                }

                const isNach = item.refNo?.toLowerCase().includes('ecs') || item.refNo?.toLowerCase().includes('nach');
                const mode = isNach ? 'NACH' : 'Online';

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px' }}>{receiptNo}</td>
                    <td style={{ padding: '12px 16px' }}>{item.payDate}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>₹ {amount.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>-</td>
                    <td style={{ padding: '12px 16px' }}>-</td>
                    <td style={{ padding: '12px 16px' }}>{docNo}</td>
                    <td style={{ padding: '12px 16px' }}>-</td>
                    <td style={{ padding: '12px 16px' }}>{mode}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button className="btn btn--sm btn--secondary" onClick={() => window.print()} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        Print
                      </button>
                    </td>
                  </tr>
                );
              })}
              {items.filter(i => i.paid).length === 0 && (
                <tr>
                  <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)' }}>
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Lifetime Projection Modal */}
      {showLifetimeProjection && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: 'var(--bg)', width: '100%', maxWidth: 900, 
            borderRadius: 16, padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0 }}>Lifetime Fee Projection 🎓</h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Projected cost from Nursery to 12th Standard</p>
              </div>
              <button className="btn btn--sm" onClick={() => setShowLifetimeProjection(false)}>✕ Close</button>
            </div>
            
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ 
                background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', 
                borderRadius: 12, padding: 20, textAlign: 'center' 
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1 }}>Grand Total Projected</div>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text)' }}>
                  ₹{(() => {
                    return SESSIONS_DATA.reduce((sum, s) => {
                      const is25 = s.offset === 0;
                      const edu = getMonthlyFee(s.offset) * 12;
                      const misc = is25 ? 6000 : 6600;
                      const books = is25 ? 0 : 6662;
                      const adm = is25 ? 140000 : 0;
                      const reg = is25 ? 2500 : 0;
                      const stat = is25 ? 12000 : 0;
                      return sum + edu + misc + books + adm + reg + stat;
                    }, 0).toLocaleString();
                  })()}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '8px 0 0' }}>Assumes a flat ₹1,000/mo increase for education fees each year (PREP corrected to ₹11,550). Books & Misc kept flat.</p>
              </div>

              <div style={{ overflowX: 'auto', marginTop: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--line)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Standard (Session)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Monthly</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Education (Yr)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Misc + Books + Adm</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SESSIONS_DATA.map(s => {
                      const is25 = s.offset === 0;
                      const month = getMonthlyFee(s.offset);
                      const edu = month * 12;
                      const misc = is25 ? 6000 : 6600;
                      const books = is25 ? 0 : 6662;
                      const adm = is25 ? 140000 : 0;
                      const reg = is25 ? 2500 : 0;
                      const stat = is25 ? 12000 : 0;
                      const other = misc + books + adm + reg + stat;
                      const total = edu + other;
                      return (
                        <tr key={s.value} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{s.label} <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 400 }}>({s.value})</span></td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>₹{month.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>₹{edu.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>₹{other.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>₹{total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>  );
}
