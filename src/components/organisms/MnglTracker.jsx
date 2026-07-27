import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Flame, Calendar, AlertTriangle, CheckCircle, Plus, FileText, Phone, Zap, ChevronRight, RefreshCw, CreditCard, ShieldAlert, Trash2, RotateCcw } from 'lucide-react';
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import ToastNotification from '../molecules/ToastNotification.jsx';

const ACCOUNT_INFO = {
  bpNo: '50445882',
  meterNo: 'CAP250204956',
  name: 'AMIT SINGH',
  address: 'A, H.No: 1007, Majestique Euriska, Near Delhi Public School, Mohammed Wadi, Pune - 411060',
  mobile: '7651821537',
  customerCare: '1800 266 2696',
  emergency: '9011676767',
  email: 'customercare@mngl.in',
  payUrl: 'https://www.mngl.in/pay-bill'
};

const STORAGE_KEY = 'appswebnet_mngl_bills';

const INITIAL_BILLS = [
  {
    id: 'mngl_008012146680',
    billNo: '008012146680',
    billDate: '2026-07-25',
    dueDate: '2026-08-08',
    periodFrom: '2026-06-10',
    periodTo: '2026-07-24',
    days: 44,
    prevReading: 72.00,
    currReading: 91.00,
    consumptionSCM: 19.00,
    unitPrice: 50.00,
    saleGasAmt: 947.90,
    vatAmt: 28.44,
    cgst: 4.05,
    sgst: 4.05,
    otherCharges: 44.56,
    arrears: 0.00,
    totalInvoiceAmt: 1029.00,
    status: 'unpaid',
    label: 'Jul 2026'
  },
  {
    id: 'mngl_008011869310',
    billNo: '008011869310',
    billDate: '2026-06-09',
    dueDate: '2026-06-23',
    periodFrom: '2026-04-20',
    periodTo: '2026-06-09',
    days: 50,
    prevReading: 60.00,
    currReading: 72.00,
    consumptionSCM: 12.00,
    unitPrice: 49.17,
    saleGasAmt: 590.04,
    vatAmt: 17.70,
    cgst: 4.59,
    sgst: 4.59,
    otherCharges: 50.08,
    arrears: 0.00,
    totalInvoiceAmt: 667.00,
    status: 'paid',
    label: 'Jun 2026'
  },
  {
    id: 'mngl_008011512269',
    billNo: '008011512269',
    billDate: '2026-04-20',
    dueDate: '2026-05-04',
    periodFrom: '2026-02-01',
    periodTo: '2026-04-19',
    days: 78,
    prevReading: 43.00,
    currReading: 60.00,
    consumptionSCM: 17.00,
    unitPrice: 49.17,
    saleGasAmt: 835.89,
    vatAmt: 25.08,
    cgst: 7.02,
    sgst: 7.02,
    otherCharges: 77.99,
    arrears: 66.00,
    totalInvoiceAmt: 1019.00,
    status: 'paid',
    label: 'Apr 2026'
  },
  {
    id: 'mngl_008011158027',
    billNo: '008011158027',
    billDate: '2026-02-26',
    dueDate: '2026-03-12',
    periodFrom: '2025-11-27',
    periodTo: '2026-01-31',
    days: 65,
    prevReading: 24.00,
    currReading: 43.00,
    consumptionSCM: 19.00,
    unitPrice: 49.17,
    saleGasAmt: 934.23,
    vatAmt: 28.03,
    cgst: 5.94,
    sgst: 5.94,
    otherCharges: -0.14,
    arrears: 0.00,
    totalInvoiceAmt: 974.00,
    status: 'paid',
    label: 'Feb 2026'
  }
];

export default function MnglTracker({ isAuthorized, user }) {
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [bills, setBills] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load MNGL bills from localStorage", e);
    }
    return INITIAL_BILLS;
  });

  const [selectedBill, setSelectedBill] = useState(() => bills[0] || INITIAL_BILLS[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    billNo: '',
    billDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    periodFrom: '',
    periodTo: '',
    prevReading: '',
    currReading: '',
    totalInvoiceAmt: '',
    status: 'unpaid'
  });

  // Sync from Firestore when user is authenticated
  useEffect(() => {
    const loadBillsFromFirestore = async () => {
      if (!db || !user) return;
      try {
        const docRef = doc(db, 'mngl', 'tracker');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.bills) {
          const remoteBills = snap.data().bills;
          if (Array.isArray(remoteBills) && remoteBills.length > 0) {
            setBills(remoteBills);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteBills));
          }
        }
      } catch (err) {
        console.error("Failed to fetch MNGL bills from Firestore", err);
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

  // Helper to save bills to localStorage and Firestore
  const saveBills = async (updatedBills) => {
    setBills(updatedBills);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBills));
    } catch (err) {
      console.error("Error saving MNGL bills to localStorage:", err);
    }

    if (db && user) {
      try {
        const docRef = doc(db, 'mngl', 'tracker');
        await setDoc(docRef, { bills: updatedBills, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Error saving MNGL bills to Firestore:", err);
      }
    }
  };

  const latestBill = useMemo(() => bills[0] || {}, [bills]);

  const metrics = useMemo(() => {
    const totalSCM = bills.reduce((acc, b) => acc + (b.consumptionSCM || 0), 0);
    const totalSpent = bills.reduce((acc, b) => acc + (b.totalInvoiceAmt || 0), 0);
    const avgSCM = bills.length > 0 ? (totalSCM / bills.length).toFixed(1) : 0;
    const latestSCM = latestBill.consumptionSCM || 0;
    const latestDays = latestBill.days || 30;
    const dailyBurnRate = (latestSCM / latestDays).toFixed(2);
    return { totalSCM, totalSpent, avgSCM, dailyBurnRate };
  }, [bills, latestBill]);

  const chartData = useMemo(() => {
    return [...bills].reverse().map(b => ({
      name: b.label || b.billDate,
      units: b.consumptionSCM,
      amount: b.totalInvoiceAmt,
      price: b.unitPrice
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
      message: `MNGL bill status updated to ${newStatus.toUpperCase()} and saved!`,
      type: 'success'
    });
  };

  const handleDeleteBill = (billId, e) => {
    if (e) e.stopPropagation();
    const target = bills.find(b => b.id === billId);
    const updated = bills.filter(b => b.id !== billId);
    saveBills(updated);
    setToast({
      message: `Deleted MNGL bill record ${target?.billNo || billId}`,
      type: 'success'
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset MNGL gas billing history to default records?")) {
      saveBills(INITIAL_BILLS);
      setToast({ message: "Reset to default MNGL bills", type: "success" });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const prevR = parseFloat(formData.prevReading) || 0;
    const currR = parseFloat(formData.currReading) || 0;
    const scm = Math.max(currR - prevR, 0);
    const newBill = {
      id: `mngl_${Date.now()}`,
      billNo: formData.billNo || `0080${Math.floor(10000000 + Math.random() * 90000000)}`,
      billDate: formData.billDate,
      dueDate: formData.dueDate || formData.billDate,
      periodFrom: formData.periodFrom,
      periodTo: formData.periodTo,
      days: 30,
      prevReading: prevR,
      currReading: currR,
      consumptionSCM: scm,
      unitPrice: 50.00,
      totalInvoiceAmt: parseFloat(formData.totalInvoiceAmt) || 0,
      status: formData.status,
      label: new Date(formData.billDate).toLocaleString('en-IN', { month: 'short', year: 'numeric' })
    };
    const updated = [newBill, ...bills];
    saveBills(updated);
    setSelectedBill(newBill);
    setModalOpen(false);
    setFormData({
      billNo: '',
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      periodFrom: '',
      periodTo: '',
      prevReading: '',
      currReading: '',
      totalInvoiceAmt: '',
      status: 'unpaid'
    });
    setToast({ message: "MNGL bill logged and saved successfully!", type: "success" });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* ── Customer Account Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 24,
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, rgba(249, 115, 22, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(249, 115, 22, 0.35)'
            }}>
              <Flame size={28} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  MNGL Piped Gas Tracker
                </h2>
                <span style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  color: '#f97316',
                  border: '1px solid rgba(249, 115, 22, 0.4)',
                  padding: '2px 10px',
                  borderRadius: 99,
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>PNG Service</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#cbd5e1' }}>
                BP No: <strong>{ACCOUNT_INFO.bpNo}</strong> | Meter: <strong>{ACCOUNT_INFO.meterNo}</strong>
              </p>
            </div>
          </div>

          {/* Quick Pay CTA */}
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
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                transition: 'transform 0.2s'
              }}
            >
              <CreditCard size={16} /> Pay MNGL Bill ➔
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
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Log MNGL Bill
              </button>
            )}
            {isAuthorized && (
              <button
                onClick={handleResetDefaults}
                title="Reset to default records"
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
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Consumer Name</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>{ACCOUNT_INFO.name}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Customer Care / Emergency</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f97316', marginTop: 2 }}>📞 {ACCOUNT_INFO.customerCare}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Service Address</span>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ACCOUNT_INFO.address}</div>
          </div>
        </div>
      </div>

      {/* ── 4 Overview Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {/* Latest Invoice Card */}
        <div style={{
          background: latestBill.status === 'unpaid' ? 'linear-gradient(135deg, #fff7ed, #ffedd5)' : '#ffffff',
          borderRadius: 20,
          padding: '20px',
          border: latestBill.status === 'unpaid' ? '1px solid #fed7aa' : '1px solid #e2e8f0',
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
            ₹{latestBill.totalInvoiceAmt?.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: latestBill.status === 'unpaid' ? '#dc2626' : '#64748b', fontWeight: 600 }}>
            {latestBill.status === 'unpaid' ? `Due on ${latestBill.dueDate}` : `Paid for ${latestBill.label || latestBill.billDate}`}
          </div>
        </div>

        {/* Latest Consumption */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Latest SCM Usage</span>
            <span style={{ background: '#fff7ed', color: '#ea580c', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>Gas</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            {latestBill.consumptionSCM} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>SCM</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Period: {latestBill.days || 30} days
          </div>
        </div>

        {/* Total SCM */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Total SCM Consumed</span>
            <span style={{ background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>Cumulative</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            {metrics.totalSCM} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>SCM</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Avg {metrics.avgSCM} SCM / cycle
          </div>
        </div>

        {/* Daily Burn Rate */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Daily Burn Rate</span>
            <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>Daily</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            {metrics.dailyBurnRate} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>SCM / day</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
            Total Spent ₹{metrics.totalSpent.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* ── Main Charts & Breakdown Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 24 }}>
        {/* Left: Chart & Billing History Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Chart */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Piped Gas Consumption Trend (SCM)</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Billing cycles SCM usage</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => [name === 'units' ? `${v} SCM` : `₹${v}`, name === 'units' ? 'Consumption' : 'Amount']} />
                <Bar dataKey="units" fill="#f97316" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.units > 18 ? '#ea580c' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>MNGL Billing History</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>Click status to toggle paid state</p>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{bills.length} Invoices Recorded</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Bill No / Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Period</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Readings</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>SCM</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Amt</th>
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
                        background: selectedBill?.id === b.id ? 'rgba(249, 115, 22, 0.05)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>#{b.billNo}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{b.billDate} ({b.label})</div>
                      </td>
                      <td style={{ padding: '14px', color: '#475569' }}>
                        {b.periodFrom} ➔ {b.periodTo} ({b.days}d)
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center', fontWeight: 600 }}>
                        {b.prevReading} ➔ <span style={{ color: '#ea580c', fontWeight: 800 }}>{b.currReading}</span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span style={{ background: '#ffedf7', color: '#db2777', padding: '3px 10px', borderRadius: 99, fontWeight: 800 }}>
                          {b.consumptionSCM} SCM
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        ₹{b.totalInvoiceAmt}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBillStatusToggle(b.id, true);
                          }}
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
                            title="Delete bill record"
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

        {/* Right: Selected Invoice Itemized Breakdown */}
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
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Invoice Breakdown</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Bill #{selectedBill.billNo}</span>
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
                  <span>Bill Date</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBill.billDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Due Date</span>
                  <strong style={{ color: selectedBill.status === 'unpaid' ? '#dc2626' : '#0f172a' }}>{selectedBill.dueDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Billing Period</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBill.periodFrom} to {selectedBill.periodTo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Meter Readings</span>
                  <strong style={{ color: '#ea580c' }}>{selectedBill.prevReading} ➔ {selectedBill.currReading}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Consumption SCM</span>
                  <strong style={{ color: '#0f172a' }}>{selectedBill.consumptionSCM} SCM</strong>
                </div>

                <div style={{ margin: '8px 0', borderTop: '1px dashed #e2e8f0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Total Amount Payable</span>
                  <strong style={{ color: '#0f172a', fontSize: '1rem' }}>₹{selectedBill.totalInvoiceAmt?.toLocaleString('en-IN')}</strong>
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
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)'
                  }}
                >
                  💳 Pay ₹{selectedBill.totalInvoiceAmt} Online Now & Mark Paid ➔
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Log MNGL Gas Bill</h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Bill Invoice No.</label>
                <input
                  type="text"
                  placeholder="e.g. 008012146680"
                  value={formData.billNo}
                  onChange={e => setFormData({ ...formData, billNo: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Previous Reading</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 72"
                    value={formData.prevReading}
                    onChange={e => setFormData({ ...formData, prevReading: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Current Reading</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 91"
                    value={formData.currReading}
                    onChange={e => setFormData({ ...formData, currReading: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Total Invoice Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1029"
                  value={formData.totalInvoiceAmt}
                  onChange={e => setFormData({ ...formData, totalInvoiceAmt: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
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
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save MNGL Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
