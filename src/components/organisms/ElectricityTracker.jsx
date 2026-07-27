import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Zap, Calendar, AlertTriangle, CheckCircle, Plus, CreditCard, ShieldAlert, TrendingUp, Info, Trash2, RotateCcw } from 'lucide-react';
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import ToastNotification from '../molecules/ToastNotification.jsx';

const ACCOUNT_INFO = {
  consumerName: 'Sweta Gupta And Amit Singh',
  utilityProvider: 'MSEDCL (Maharashtra State Electricity Distribution Co. Ltd.)',
  payUrl: 'https://wss.mahadiscom.in/wss/wss_sum_pay.aspx',
  helpline: '1912 / 1800 233 3435'
};

const STORAGE_KEY = 'appswebnet_electricity_bills';

const INITIAL_BILLS = [
  {
    id: 'elec_2026_07',
    billDate: '2026-07-19',
    dueDate: '2026-08-10',
    consumptionKWh: 171,
    amount: 1800.00,
    afterDueDateAmt: 1820.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'unpaid',
    label: 'Jul 2026'
  },
  {
    id: 'elec_2026_06',
    billDate: '2026-06-19',
    dueDate: '2026-07-09',
    consumptionKWh: 219,
    amount: 2480.00,
    afterDueDateAmt: 2510.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Jun 2026'
  },
  {
    id: 'elec_2026_05',
    billDate: '2026-05-19',
    dueDate: '2026-06-08',
    consumptionKWh: 217,
    amount: 2660.00,
    afterDueDateAmt: 2690.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'May 2026'
  },
  {
    id: 'elec_2026_04',
    billDate: '2026-04-19',
    dueDate: '2026-05-11',
    consumptionKWh: 149,
    amount: 1540.00,
    afterDueDateAmt: 1560.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Apr 2026'
  },
  {
    id: 'elec_2026_03',
    billDate: '2026-03-19',
    dueDate: '2026-04-08',
    consumptionKWh: 165,
    amount: 1900.00,
    afterDueDateAmt: 1930.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Mar 2026'
  },
  {
    id: 'elec_2026_02',
    billDate: '2026-02-19',
    dueDate: '2026-03-11',
    consumptionKWh: 147,
    amount: 1410.00,
    afterDueDateAmt: 1430.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Feb 2026'
  },
  {
    id: 'elec_2026_01',
    billDate: '2026-01-19',
    dueDate: '2026-02-09',
    consumptionKWh: 131,
    amount: 1270.00,
    afterDueDateAmt: 1290.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Jan 2026'
  },
  {
    id: 'elec_2025_12',
    billDate: '2025-12-19',
    dueDate: '2026-01-08',
    consumptionKWh: 98,
    amount: 810.00,
    afterDueDateAmt: 820.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Dec 2025'
  },
  {
    id: 'elec_2025_11',
    billDate: '2025-11-19',
    dueDate: '2025-12-09',
    consumptionKWh: 159,
    amount: 1660.00,
    afterDueDateAmt: 1680.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Nov 2025'
  },
  {
    id: 'elec_2025_10',
    billDate: '2025-10-23',
    dueDate: '2025-11-12',
    consumptionKWh: 148,
    amount: 1600.00,
    afterDueDateAmt: 1620.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Oct 2025'
  },
  {
    id: 'elec_2025_09',
    billDate: '2025-09-19',
    dueDate: '2025-10-09',
    consumptionKWh: 130,
    amount: 1300.00,
    afterDueDateAmt: 1320.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Sep 2025'
  },
  {
    id: 'elec_2025_08',
    billDate: '2025-08-19',
    dueDate: '2025-09-08',
    consumptionKWh: 123,
    amount: 1150.00,
    afterDueDateAmt: 1160.00,
    consumerName: 'Sweta Gupta And Amit Singh',
    status: 'paid',
    label: 'Aug 2025'
  }
];

export default function ElectricityTracker({ isAuthorized, user }) {
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load electricity bills from localStorage", e);
    }
    return INITIAL_BILLS;
  });

  const [selectedBill, setSelectedBill] = useState(() => bills[0] || INITIAL_BILLS[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    billDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    consumptionKWh: '',
    amount: '',
    afterDueDateAmt: '',
    status: 'unpaid'
  });

  // Sync from Firestore when user is authenticated
  useEffect(() => {
    const loadBillsFromFirestore = async () => {
      if (!db || !user) return;
      try {
        const docRef = doc(db, 'electricity', 'tracker');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.bills) {
          const remoteBills = snap.data().bills;
          if (Array.isArray(remoteBills) && remoteBills.length > 0) {
            setBills(remoteBills);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteBills));
          }
        }
      } catch (err) {
        console.error("Failed to fetch electricity bills from Firestore", err);
      }
    };
    loadBillsFromFirestore();
  }, [user]);

  // Keep selectedBill updated if bills change
  useEffect(() => {
    if (bills.length > 0) {
      setSelectedBill(prev => {
        const matching = bills.find(b => b.id === prev?.id);
        return matching || bills[0];
      });
    }
  }, [bills]);

  // Helper to persist bills to localStorage and Firestore
  const saveBills = async (updatedBills) => {
    setBills(updatedBills);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBills));
    } catch (err) {
      console.error("Error saving electricity bills to localStorage:", err);
    }

    if (db && user) {
      try {
        const docRef = doc(db, 'electricity', 'tracker');
        await setDoc(docRef, { bills: updatedBills, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Error saving electricity bills to Firestore:", err);
      }
    }
  };

  const latestBill = useMemo(() => bills[0] || {}, [bills]);

  const metrics = useMemo(() => {
    const totalKWh = bills.reduce((acc, b) => acc + (b.consumptionKWh || 0), 0);
    const totalSpent = bills.reduce((acc, b) => acc + (b.amount || 0), 0);
    const avgKWh = bills.length > 0 ? (totalKWh / bills.length).toFixed(0) : 0;
    const avgMonthlyBill = bills.length > 0 ? (totalSpent / bills.length).toFixed(0) : 0;
    const avgRatePerKWh = totalKWh > 0 ? (totalSpent / totalKWh).toFixed(2) : 0;
    return { totalKWh, totalSpent, avgKWh, avgMonthlyBill, avgRatePerKWh };
  }, [bills]);

  const chartData = useMemo(() => {
    return [...bills].reverse().map(b => ({
      name: b.label || b.billDate,
      units: b.consumptionKWh,
      amount: b.amount,
      effectiveRate: (b.amount / (b.consumptionKWh || 1)).toFixed(1)
    }));
  }, [bills]);

  const handleBillStatusToggle = (billId, openPortal = false) => {
    const target = bills.find(b => b.id === billId);
    if (!target) return;
    const newStatus = target.status === 'paid' ? 'unpaid' : 'paid';
    const updated = bills.map(b => b.id === billId ? { ...b, status: newStatus } : b);
    
    saveBills(updated);

    if (openPortal && target.status === 'unpaid') {
      window.open(ACCOUNT_INFO.payUrl, '_blank');
    }

    setToast({
      message: `Bill status for ${target.label || target.billDate} updated to ${newStatus.toUpperCase()} and saved!`,
      type: 'success'
    });
  };

  const handleDeleteBill = (billId, e) => {
    if (e) e.stopPropagation();
    const target = bills.find(b => b.id === billId);
    const updated = bills.filter(b => b.id !== billId);
    saveBills(updated);
    setToast({
      message: `Deleted bill record for ${target?.label || billId}`,
      type: 'success'
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset electricity billing history to initial 12-month default records?")) {
      saveBills(INITIAL_BILLS);
      setToast({ message: "Reset to default 12-month electricity bills", type: "success" });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const kWh = parseFloat(formData.consumptionKWh) || 0;
    const amt = parseFloat(formData.amount) || 0;
    const newBill = {
      id: `elec_${Date.now()}`,
      billDate: formData.billDate,
      dueDate: formData.dueDate || formData.billDate,
      consumptionKWh: kWh,
      amount: amt,
      afterDueDateAmt: parseFloat(formData.afterDueDateAmt) || (amt + 20),
      consumerName: ACCOUNT_INFO.consumerName,
      status: formData.status,
      label: new Date(formData.billDate).toLocaleString('en-IN', { month: 'short', year: 'numeric' })
    };
    const updated = [newBill, ...bills];
    saveBills(updated);
    setSelectedBill(newBill);
    setModalOpen(false);
    setFormData({
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      consumptionKWh: '',
      amount: '',
      afterDueDateAmt: '',
      status: 'unpaid'
    });
    setToast({ message: "Electricity bill logged and saved successfully!", type: "success" });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* ── Consumer Account Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)',
        borderRadius: 24,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 12px 36px rgba(2, 132, 199, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(56, 189, 248, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)'
            }}>
              <Zap size={28} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Electricity Bill Tracker
                </h2>
                <span style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  padding: '2px 10px',
                  borderRadius: 99,
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>MSEDCL Power</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#cbd5e1' }}>
                Consumers: <strong>{ACCOUNT_INFO.consumerName}</strong>
              </p>
            </div>
          </div>

          {/* Quick Pay & Actions CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={ACCOUNT_INFO.payUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                transition: 'transform 0.2s'
              }}
            >
              <CreditCard size={16} /> Pay MSEDCL Bill ➔
            </a>

            {isAuthorized && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Log New Bill
              </button>
            )}

            {isAuthorized && (
              <button
                onClick={handleResetDefaults}
                title="Reset to default 12-month records"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Account Metadata Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Utility Distribution Provider</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>{ACCOUNT_INFO.utilityProvider}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Recorded Cycles</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>{bills.length} Months Logged</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Helpline Hotline</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>📞 {ACCOUNT_INFO.helpline}</div>
          </div>
        </div>
      </div>

      {/* ── 4 Overview Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {/* Outstanding Bill */}
        <div style={{
          background: latestBill.status === 'unpaid' ? 'linear-gradient(135deg, #fef2f2, #fff1f2)' : '#ffffff',
          borderRadius: 20,
          padding: '20px',
          border: latestBill.status === 'unpaid' ? '1px solid #fecaca' : '1px solid #e2e8f0',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Latest Invoice</span>
            <span style={{
              background: latestBill.status === 'unpaid' ? '#fee2e2' : '#dcfce7',
              color: latestBill.status === 'unpaid' ? '#dc2626' : '#16a34a',
              padding: '3px 10px',
              borderRadius: 99,
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {latestBill.status === 'unpaid' ? '🚨 DUE' : '✓ PAID'}
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            ₹{latestBill.amount ? latestBill.amount.toLocaleString('en-IN') : '0'}
          </div>
          <div style={{ fontSize: '0.78rem', color: latestBill.status === 'unpaid' ? '#dc2626' : '#64748b', fontWeight: 600 }}>
            {latestBill.status === 'unpaid' ? `Due on ${latestBill.dueDate} (Late: ₹${latestBill.afterDueDateAmt})` : `Paid for ${latestBill.label || latestBill.billDate}`}
          </div>
        </div>

        {/* Latest kWh Consumption */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Latest kWh Usage</span>
            <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>Power</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            {latestBill.consumptionKWh || 0} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>kWh Units</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Bill Date {latestBill.billDate || '-'}
          </div>
        </div>

        {/* Total 12-Month kWh */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Total Consumption</span>
            <span style={{ background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>Annual</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            {metrics.totalKWh} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Avg {metrics.avgKWh} kWh / month
          </div>
        </div>

        {/* Avg Rate Per Unit */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Avg Effective Tariff</span>
            <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>Tariff</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            ₹{metrics.avgRatePerKWh} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>/ kWh</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
            Avg ₹{metrics.avgMonthlyBill} / month
          </div>
        </div>
      </div>

      {/* ── Main Charts & Detailed Breakdown Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 24 }}>
        {/* Left: Charts & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* kWh Consumption Bar Chart */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Monthly Power Consumption (kWh Units)</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>12-Month electricity consumption trend</p>
              </div>
              <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700 }}>Peak: May/Jun (217-219 kWh)</span>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={28} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => [name === 'units' ? `${v} kWh` : `₹${v}`, name === 'units' ? 'Consumption' : 'Amount']} />
                <Bar dataKey="units" fill="#0284c7" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.units > 200 ? '#f97316' : entry.units > 150 ? '#38bdf8' : '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Billing History Table */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>12-Month Billing History</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>Click status to toggle paid state or pay online</p>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{bills.length} Bills Saved</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Bill Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Due Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Units (kWh)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>On-Time Amount</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>After Due Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                    {isAuthorized && <th style={{ padding: '12px 14px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBill(b)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: selectedBill?.id === b.id ? 'rgba(2, 132, 199, 0.05)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.billDate}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{b.label}</div>
                      </td>
                      <td style={{ padding: '14px', color: b.status === 'unpaid' ? '#dc2626' : '#475569', fontWeight: b.status === 'unpaid' ? 700 : 400 }}>
                        {b.dueDate}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span style={{
                          background: b.consumptionKWh > 200 ? '#ffedf7' : '#e0f2fe',
                          color: b.consumptionKWh > 200 ? '#db2777' : '#0284c7',
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontWeight: 800
                        }}>
                          {b.consumptionKWh} kWh
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        ₹{b.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#64748b', fontSize: '0.82rem' }}>
                        ₹{b.afterDueDateAmt?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBillStatusToggle(b.id, true);
                          }}
                          title={b.status === 'paid' ? 'Click to mark as Unpaid' : 'Click to Pay Due & Mark as Paid'}
                          style={{
                            border: 'none',
                            background: b.status === 'paid' ? '#dcfce7' : '#fee2e2',
                            color: b.status === 'paid' ? '#16a34a' : '#dc2626',
                            padding: '6px 14px',
                            borderRadius: 99,
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: b.status === 'unpaid' ? '0 2px 8px rgba(220, 38, 38, 0.2)' : 'none'
                          }}
                        >
                          {b.status === 'paid' ? '✓ PAID' : '🚨 PAY DUE'}
                        </button>
                      </td>
                      {isAuthorized && (
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => handleDeleteBill(b.id, e)}
                            title="Delete this bill entry"
                            style={{
                              border: 'none',
                              background: '#f1f5f9',
                              color: '#94a3b8',
                              padding: '6px 10px',
                              borderRadius: 10,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#94a3b8'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Selected Bill Breakdown Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedBill && (
            <div style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: 24,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              position: 'sticky',
              top: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Bill Details</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedBill.label || selectedBill.billDate}</span>
                </div>
                <span style={{
                  background: selectedBill.status === 'paid' ? '#dcfce7' : '#fee2e2',
                  color: selectedBill.status === 'paid' ? '#16a34a' : '#dc2626',
                  padding: '3px 10px',
                  borderRadius: 99,
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {selectedBill.status.toUpperCase()}
                </span>
              </div>

              {/* Itemized Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Consumer Name</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBill.consumerName || ACCOUNT_INFO.consumerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Bill Date</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBill.billDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Due Date</span>
                  <strong style={{ color: selectedBill.status === 'unpaid' ? '#dc2626' : '#0f172a' }}>{selectedBill.dueDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Consumption Units</span>
                  <strong style={{ color: '#0284c7' }}>{selectedBill.consumptionKWh} kWh</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Effective Rate</span>
                  <strong style={{ color: '#0f172a' }}>₹{(selectedBill.amount / (selectedBill.consumptionKWh || 1)).toFixed(2)} / kWh</strong>
                </div>

                <div style={{ margin: '8px 0', borderTop: '1px dashed #e2e8f0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>On-Time Payable</span>
                  <strong style={{ color: '#0f172a', fontSize: '1rem' }}>₹{selectedBill.amount?.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Amount After Due Date</span>
                  <strong>₹{selectedBill.afterDueDateAmt?.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Pay Now CTA */}
              {selectedBill.status === 'unpaid' ? (
                <button
                  onClick={() => handleBillStatusToggle(selectedBill.id, true)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    marginTop: 20,
                    padding: '12px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  💳 Pay ₹{selectedBill.amount} Online Now & Mark Paid ➔
                </button>
              ) : (
                <button
                  onClick={() => handleBillStatusToggle(selectedBill.id, false)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    marginTop: 20,
                    padding: '10px',
                    borderRadius: 14,
                    background: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  Mark as Unpaid
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Bill Modal ── */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 480,
            padding: 28,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Log Electricity Bill</h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Bill Date</label>
                  <input
                    type="date"
                    required
                    value={formData.billDate}
                    onChange={e => setFormData({ ...formData, billDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Consumption Units (kWh)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 171"
                  value={formData.consumptionKWh}
                  onChange={e => setFormData({ ...formData, consumptionKWh: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1800"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>After Due Date Amt (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1820"
                    value={formData.afterDueDateAmt}
                    onChange={e => setFormData({ ...formData, afterDueDateAmt: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Payment Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                >
                  <option value="unpaid">🚨 Unpaid (Pay Due)</option>
                  <option value="paid">✓ Paid</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Electricity Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
