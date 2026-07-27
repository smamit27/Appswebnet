import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Receipt, Calculator, FileText, TrendingDown, TrendingUp, CheckCircle2,
  AlertTriangle, Percent, ShieldCheck, DollarSign, Building, Briefcase,
  Calendar, Plus, Edit2, Trash2, RotateCcw, Download, Sparkles, Lock,
  ArrowRight, ShieldAlert, FileCheck, Check, Award
} from 'lucide-react';
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import ToastNotification from '../molecules/ToastNotification.jsx';

const STORAGE_KEY_TAX = 'appswebnet_tax_tracker_data_v2';

// Official TEC Breakdown Data matching Hinduja Global Solutions Portal
const OFFICIAL_TEC_STRUCTURE = {
  employer: 'Hinduja Global Solutions Ltd (Business Services)',
  optedRegime: 'NEW REGIME',
  pranNo: '110128446556',
  npsPercentage: '4%',
  effectiveDate: '01/07/2026',
  components: [
    { name: 'BASIC', monthly: 178334, annual: 2140008, type: 'Basic' },
    { name: 'H.R.A', monthly: 89167, annual: 1070004, type: 'Allowance' },
    { name: 'CONVEYANCE ALLOWANCE', monthly: 17833, annual: 213996, type: 'Allowance' },
    { name: 'DEFRAYAL ALLOWANCE', monthly: 17833, annual: 213996, type: 'Allowance' },
    { name: 'SPECIAL ALLOWANCE', monthly: 20167, annual: 242004, type: 'Allowance' },
    { name: 'Special Allowance (Meal Card)', monthly: 4800, annual: 57600, type: 'Perk' },
    { name: 'Special Allowance (NPS 4% - Sec 80CCD(2))', monthly: 7133, annual: 85596, type: 'NPS' },
    { name: 'CO. PF CONTRIBUTION (Employer PF)', monthly: 21400, annual: 256800, type: 'PF' }
  ],
  totalMonthly: 356667,
  totalAnnual: 4280004
};

// Default Pre-populated Family Income & Tax Deductions
const INITIAL_TAX_DATA = {
  fy: '2026-27',
  tecStructure: OFFICIAL_TEC_STRUCTURE,
  salaries: [
    {
      id: 'sal_1',
      earner: 'Amit Singh',
      company: 'Hinduja Global Solutions',
      basicSalary: 2140008,
      hraReceived: 1070004,
      specialAllowance: 727596,
      grossSalary: 4023204, // TEC minus Employer PF (42,80,004 - 2,56,800)
      employerNps: 85596, // 80CCD(2) Exemption
      tdsDeducted: 645000
    },
    {
      id: 'sal_2',
      earner: 'Sweta Gupta',
      company: 'Corporate Services',
      basicSalary: 1200000,
      hraReceived: 300000,
      specialAllowance: 400000,
      grossSalary: 1900000,
      employerNps: 0,
      tdsDeducted: 210000
    }
  ],
  otherIncome: [
    { id: 'inc_1', source: 'FD & Savings Interest', amount: 45000, tdsDeducted: 4500, category: 'Interest' },
    { id: 'inc_2', source: 'Mutual Fund Capital Gains (LTCG)', amount: 140000, tdsDeducted: 0, category: 'Capital Gains' },
    { id: 'inc_3', source: 'Stock Dividend Income', amount: 18000, tdsDeducted: 1800, category: 'Dividends' }
  ],
  deductions: [
    // Section 80CCD(2) Employer NPS (Exempt in New Regime)
    { id: 'ded_0', section: '80CCD(2)', category: 'Employer NPS Contribution (4% of Basic)', maxLimit: 214000, amount: 85596, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Exempt under both Old & New Regimes! PRAN: 110128446556' },

    // Section 80C (Limit 1.5L)
    { id: 'ded_1', section: '80C', category: 'EPF (Employee Provident Fund)', maxLimit: 150000, amount: 150000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Deducted directly from salary' },
    { id: 'ded_2', section: '80C', category: 'PPF (Public Provident Fund)', maxLimit: 150000, amount: 75000, proofStatus: 'Verified', earner: 'Sweta Gupta', notes: 'SBI PPF Account' },
    { id: 'ded_3', section: '80C', category: 'ELSS Tax Saver Mutual Funds', maxLimit: 150000, amount: 50000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Mirae Asset Tax Saver' },
    { id: 'ded_4', section: '80C', category: 'Children School Tuition Fees', maxLimit: 150000, amount: 85000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Amishi School Tuition Fees' },
    
    // Section 80D (Health Insurance)
    { id: 'ded_5', section: '80D', category: 'Family Health Insurance (Self & Children)', maxLimit: 25000, amount: 25000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'HDFC ERGO Optima Secure' },
    { id: 'ded_6', section: '80D', category: 'Parents Medical Insurance (Senior Citizens)', maxLimit: 50000, amount: 42000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Star Health Senior Citizen' },
    { id: 'ded_7', section: '80D', category: 'Preventive Health Checkup', maxLimit: 5000, amount: 5000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Annual Health Checkup' },

    // Section 80CCD(1B) (NPS)
    { id: 'ded_8', section: '80CCD(1B)', category: 'NPS Additional Self Contribution', maxLimit: 50000, amount: 50000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Tier 1 NPS Account' },

    // Section 24(b) (Home Loan Interest)
    { id: 'ded_9', section: 'Sec 24(b)', category: 'Home Loan Interest (Self Occupied)', maxLimit: 200000, amount: 185000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'HDFC Home Loan Interest Certificate' },

    // Section 10(13A) HRA Exemption
    { id: 'ded_10', section: 'Sec 10(13A)', category: 'HRA Rent Paid Exemption', maxLimit: 450000, amount: 360000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Annual House Rent Receipts & Landlord PAN' },

    // Section 80TTA
    { id: 'ded_11', section: '80TTA', category: 'Savings Account Interest Exemption', maxLimit: 10000, amount: 10000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Savings Bank Interest' }
  ],
  advanceTaxPaid: [
    { id: 'adv_1', quarter: 'Q1 (By 15 June)', percentDue: 15, estimatedAmt: 150000, paidAmt: 150000, status: 'Paid', paymentDate: '2026-06-12', challanNo: 'CHLN98124' },
    { id: 'adv_2', quarter: 'Q2 (By 15 Sept)', percentDue: 45, estimatedAmt: 250000, paidAmt: 250000, status: 'Paid', paymentDate: '2026-09-14', challanNo: 'CHLN10482' },
    { id: 'adv_3', quarter: 'Q3 (By 15 Dec)', percentDue: 75, estimatedAmt: 250000, paidAmt: 250000, status: 'Paid', paymentDate: '2026-12-11', challanNo: 'CHLN11930' },
    { id: 'adv_4', quarter: 'Q4 (By 15 March)', percentDue: 100, estimatedAmt: 205000, paidAmt: 0, status: 'Pending', paymentDate: '', challanNo: '' }
  ],
  documents: [
    { id: 'doc_0', title: 'HGS Total Employment Cost (TEC) Structure', status: 'Verified ✓', date: '2026-07-01' },
    { id: 'doc_1', title: 'Form 16 - Amit Singh (Hinduja Global Solutions)', status: 'Uploaded ✓', date: '2026-06-10' },
    { id: 'doc_2', title: 'Form 16 - Sweta Gupta (Employer)', status: 'Uploaded ✓', date: '2026-06-12' },
    { id: 'doc_3', title: 'Form 26AS & AIS / TIS Summary', status: 'Synced ✓', date: '2026-07-01' },
    { id: 'doc_4', title: 'NPS PRAN Statement (110128446556)', status: 'Verified ✓', date: '2026-07-01' },
    { id: 'doc_5', title: 'HDFC Home Loan Interest Certificate', status: 'Uploaded ✓', date: '2026-04-15' }
  ]
};

// Calculate Old Regime Tax Liability
function calculateOldRegimeTax(taxableIncome) {
  let income = Math.max(taxableIncome - 50000, 0); // Std Deduction 50k
  if (income <= 250000) return 0;
  if (income <= 500000) return (income - 250000) * 0.05;

  let tax = 0;
  tax += 250000 * 0.05; // 12,500

  if (income <= 1000000) {
    tax += (income - 500000) * 0.20;
  } else {
    tax += 500000 * 0.20; // 1,00,000
    tax += (income - 1000000) * 0.30;
  }

  return Math.round(tax * 1.04);
}

// Calculate New Regime Tax Liability (FY 2025-26 & FY 2026-27 Slabs)
function calculateNewRegimeTax(grossIncome, employerNps = 85596) {
  // Std Deduction 75k + Employer NPS Sec 80CCD(2) exempt in New Regime!
  let income = Math.max(grossIncome - 75000 - employerNps, 0);
  if (income <= 300000) return 0;
  if (income <= 700000) return 0;

  let tax = 0;
  tax += 400000 * 0.05; // 20,000

  if (income <= 1000000) {
    tax += (income - 700000) * 0.10;
  } else if (income <= 1200000) {
    tax += 300000 * 0.10; // 30,000
    tax += (income - 1000000) * 0.15;
  } else if (income <= 1500000) {
    tax += 300000 * 0.10; // 30,000
    tax += 200000 * 0.15; // 30,000
    tax += (income - 1200000) * 0.20;
  } else {
    tax += 300000 * 0.10; // 30,000
    tax += 200000 * 0.15; // 30,000
    tax += 300000 * 0.20; // 60,000
    tax += (income - 1500000) * 0.30;
  }

  return Math.round(tax * 1.04);
}

export default function TaxTracker({ user, isAuthorized }) {
  const [activeTab, setActiveTab] = useState('regime'); // 'regime' | 'tec' | 'deductions' | 'income' | 'advance' | 'documents'
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [modalOpen, setModalOpen] = useState(false);

  // Data state with localStorage persistence
  const [taxData, setTaxData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAX);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.salaries) return parsed;
      }
    } catch (e) {
      console.error("Failed to load tax data from localStorage", e);
    }
    return INITIAL_TAX_DATA;
  });

  const [deductionForm, setDeductionForm] = useState({
    section: '80C',
    category: '',
    maxLimit: 150000,
    amount: '',
    proofStatus: 'Verified',
    earner: 'Amit Singh',
    notes: ''
  });

  // Sync with Firestore
  useEffect(() => {
    const loadFromFirestore = async () => {
      if (!db || !user) return;
      try {
        const docRef = doc(db, 'finance', 'tax_tracker');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.taxData) {
          const remoteData = snap.data().taxData;
          setTaxData(remoteData);
          localStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(remoteData));
        }
      } catch (err) {
        console.error("Error fetching tax data from Firestore:", err);
      }
    };
    loadFromFirestore();
  }, [user]);

  // Persist helper
  const saveTaxData = async (updatedData) => {
    setTaxData(updatedData);
    try {
      localStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(updatedData));
    } catch (err) {
      console.error("Failed to save tax data to localStorage:", err);
    }

    if (db && user) {
      try {
        const docRef = doc(db, 'finance', 'tax_tracker');
        await setDoc(docRef, { taxData: updatedData, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Failed to save tax data to Firestore:", err);
      }
    }
  };

  // ── Calculation Engine ──
  const calculations = useMemo(() => {
    const totalGrossSalary = taxData.salaries.reduce((acc, s) => acc + (s.grossSalary || 0), 0);
    const totalOtherIncome = taxData.otherIncome.reduce((acc, i) => acc + (i.amount || 0), 0);
    const totalGrossIncome = totalGrossSalary + totalOtherIncome;

    const salaryTDS = taxData.salaries.reduce((acc, s) => acc + (s.tdsDeducted || 0), 0);
    const otherTDS = taxData.otherIncome.reduce((acc, i) => acc + (i.tdsDeducted || 0), 0);
    const totalTDS = salaryTDS + otherTDS;

    const totalAdvanceTax = taxData.advanceTaxPaid.reduce((acc, a) => acc + (a.paidAmt || 0), 0);
    const totalPrepaidTax = totalTDS + totalAdvanceTax;

    // Deductions Breakup
    const sec80C = taxData.deductions.filter(d => d.section === '80C').reduce((acc, d) => acc + (d.amount || 0), 0);
    const sec80C_Claimed = Math.min(sec80C, 150000);

    const sec80D = taxData.deductions.filter(d => d.section === '80D').reduce((acc, d) => acc + (d.amount || 0), 0);
    const sec80CCD = taxData.deductions.filter(d => d.section === '80CCD(1B)').reduce((acc, d) => acc + (d.amount || 0), 0);
    const sec80CCD_Claimed = Math.min(sec80CCD, 50000);

    const sec80CCD2 = taxData.deductions.filter(d => d.section === '80CCD(2)').reduce((acc, d) => acc + (d.amount || 0), 0);

    const sec24b = taxData.deductions.filter(d => d.section === 'Sec 24(b)').reduce((acc, d) => acc + (d.amount || 0), 0);
    const sec24b_Claimed = Math.min(sec24b, 200000);

    const hra = taxData.deductions.filter(d => d.section === 'Sec 10(13A)').reduce((acc, d) => acc + (d.amount || 0), 0);
    const sec80TTA = taxData.deductions.filter(d => d.section === '80TTA').reduce((acc, d) => acc + (d.amount || 0), 0);
    const sec80TTA_Claimed = Math.min(sec80TTA, 10000);

    const totalEligibleDeductions = sec80C_Claimed + sec80D + sec80CCD_Claimed + sec80CCD2 + sec24b_Claimed + hra + sec80TTA_Claimed;

    const oldRegimeTaxable = Math.max(totalGrossIncome - totalEligibleDeductions, 0);

    const oldRegimeTax = calculateOldRegimeTax(oldRegimeTaxable);
    const newRegimeTax = calculateNewRegimeTax(totalGrossIncome, sec80CCD2);

    const recommendedRegime = newRegimeTax <= oldRegimeTax ? 'NEW' : 'OLD';
    const taxSavings = Math.abs(oldRegimeTax - newRegimeTax);

    const effectiveTax = recommendedRegime === 'NEW' ? newRegimeTax : oldRegimeTax;
    const netTaxPayableOrRefund = effectiveTax - totalPrepaidTax;

    return {
      totalGrossIncome,
      totalGrossSalary,
      totalOtherIncome,
      totalTDS,
      totalAdvanceTax,
      totalPrepaidTax,
      sec80C_Claimed,
      sec80D,
      sec80CCD_Claimed,
      sec80CCD2,
      sec24b_Claimed,
      hra,
      totalEligibleDeductions,
      oldRegimeTaxable,
      oldRegimeTax,
      newRegimeTax,
      recommendedRegime,
      taxSavings,
      effectiveTax,
      netTaxPayableOrRefund
    };
  }, [taxData]);

  // Chart data
  const regimeComparisonChart = useMemo(() => [
    { name: 'Gross Income', 'Old Regime': calculations.totalGrossIncome, 'New Regime': calculations.totalGrossIncome },
    { name: 'Deductions', 'Old Regime': calculations.totalEligibleDeductions + 50000, 'New Regime': 75000 + calculations.sec80CCD2 },
    { name: 'Taxable Income', 'Old Regime': calculations.oldRegimeTaxable, 'New Regime': Math.max(calculations.totalGrossIncome - 75000 - calculations.sec80CCD2, 0) },
    { name: 'Tax Liability', 'Old Regime': calculations.oldRegimeTax, 'New Regime': calculations.newRegimeTax }
  ], [calculations]);

  // Handlers
  const handleAddDeduction = (e) => {
    e.preventDefault();
    const amt = parseFloat(deductionForm.amount) || 0;
    const newDeduction = {
      id: `ded_${Date.now()}`,
      section: deductionForm.section,
      category: deductionForm.category,
      maxLimit: parseFloat(deductionForm.maxLimit) || 150000,
      amount: amt,
      proofStatus: deductionForm.proofStatus,
      earner: deductionForm.earner,
      notes: deductionForm.notes
    };
    const updated = { ...taxData, deductions: [newDeduction, ...taxData.deductions] };
    saveTaxData(updated);
    setModalOpen(false);
    setToast({ message: `Added deduction ${deductionForm.category}`, type: 'success' });
  };

  const handleDeleteDeduction = (id, e) => {
    if (e) e.stopPropagation();
    const updated = { ...taxData, deductions: taxData.deductions.filter(d => d.id !== id) };
    saveTaxData(updated);
    setToast({ message: 'Deduction record removed', type: 'success' });
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset Tax Tracker to match Hinduja Global Solutions official TEC structure?")) {
      saveTaxData(INITIAL_TAX_DATA);
      setToast({ message: "Reset tax data to HGS TEC structure", type: "success" });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* ── Tax Tracker Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #047857 100%)',
        borderRadius: 24,
        padding: '28px',
        color: '#ffffff',
        boxShadow: '0 16px 40px rgba(4, 120, 87, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 240,
          height: 240,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #10b981, #047857)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <Receipt size={32} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  Income Tax Tracking System
                </h1>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  padding: '3px 12px',
                  borderRadius: 99,
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  FY {taxData.fy} (AY 2027-28)
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#cbd5e1' }}>
                Taxpayers: <strong>Amit Singh & Sweta Gupta</strong> | Employer: <strong>Hinduja Global Solutions</strong>
              </p>
            </div>
          </div>

          {/* Regime Advisor Badge */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 18,
            padding: '12px 20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <Sparkles size={24} color="#fef08a" />
            <div>
              <div style={{ fontSize: '0.74rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 800 }}>Opted Company Tax Regime</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                NEW TAX REGIME ✓
              </div>
              <div style={{ fontSize: '0.76rem', color: '#fef08a', fontWeight: 700 }}>
                Saves ₹{calculations.taxSavings.toLocaleString('en-IN')} in tax liability!
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700 }}>PRAN NO:</span>
            <span style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fef08a', padding: '4px 12px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 800 }}>
              110128446556
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAuthorized && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 12,
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Log Tax Deduction
              </button>
            )}
            {isAuthorized && (
              <button
                onClick={handleResetDefaults}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} /> Reset HGS Card
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 Overview Key Metrics Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {/* Total TEC Employment Cost */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>HGS Total TEC Package</span>
            <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>Company TEC</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            ₹42.80 <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Lakhs / yr</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Monthly ₹3,56,667 | Basic ₹21.40L
          </div>
        </div>

        {/* Employer NPS Section 80CCD(2) Exemption */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Employer NPS (80CCD(2))</span>
            <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>Exempt in New Regime</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#047857', margin: '8px 0 4px' }}>
            ₹85,596 <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>/ yr</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>
            4% of Basic (₹7,133/mo) | PRAN: 110128446556
          </div>
        </div>

        {/* Estimated Tax Liability (New Regime) */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Tax Liability (New Regime)</span>
            <span style={{ background: '#fef3c7', color: '#d97706', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>
              Opted New Regime
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            ₹{calculations.newRegimeTax.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
            New Regime saves ₹{calculations.taxSavings.toLocaleString('en-IN')} vs Old Regime
          </div>
        </div>

        {/* Total TDS & Prepaid Tax */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Prepaid Tax (TDS + Adv Tax)</span>
            <span style={{
              background: calculations.netTaxPayableOrRefund <= 0 ? '#dcfce7' : '#fee2e2',
              color: calculations.netTaxPayableOrRefund <= 0 ? '#16a34a' : '#dc2626',
              padding: '3px 10px',
              borderRadius: 99,
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {calculations.netTaxPayableOrRefund <= 0 ? '✓ REFUND DUE' : '🚨 PAYABLE'}
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            ₹{calculations.totalPrepaidTax.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: calculations.netTaxPayableOrRefund <= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            {calculations.netTaxPayableOrRefund <= 0
              ? `Estimated Refund: ₹${Math.abs(calculations.netTaxPayableOrRefund).toLocaleString('en-IN')}`
              : `Balance Due: ₹${calculations.netTaxPayableOrRefund.toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '2px solid #e2e8f0', paddingBottom: 8, overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('tec')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'tec' ? '#047857' : 'transparent',
            color: activeTab === 'tec' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap'
          }}
        >
          <Building size={16} /> Official HGS TEC Compensation Breakdown
        </button>

        <button
          onClick={() => setActiveTab('regime')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'regime' ? '#047857' : 'transparent',
            color: activeTab === 'regime' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap'
          }}
        >
          <Calculator size={16} /> Old vs New Regime Comparison
        </button>

        <button
          onClick={() => setActiveTab('deductions')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'deductions' ? '#047857' : 'transparent',
            color: activeTab === 'deductions' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap'
          }}
        >
          <ShieldCheck size={16} /> Deductions Vault (80C, 80D, Sec 24)
        </button>

        <button
          onClick={() => setActiveTab('income')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'income' ? '#047857' : 'transparent',
            color: activeTab === 'income' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap'
          }}
        >
          <Briefcase size={16} /> Combined Salary & Income
        </button>

        <button
          onClick={() => setActiveTab('advance')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'advance' ? '#047857' : 'transparent',
            color: activeTab === 'advance' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap'
          }}
        >
          <Calendar size={16} /> Advance Tax Deadlines
        </button>
      </div>

      {/* ── TAB: OFFICIAL HGS TEC COMPENSATION BREAKDOWN ── */}
      {activeTab === 'tec' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header summary banner */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800 }}>Employer Declaration</span>
                <h3 style={{ margin: '8px 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                  {OFFICIAL_TEC_STRUCTURE.employer}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Total Employment Cost (TEC) Plan — Financial Year Basis (April to March)
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 14px', borderRadius: 12, fontSize: '0.84rem', fontWeight: 800 }}>
                  You have opted NEW REGIME
                </span>
              </div>
            </div>

            {/* Pay elements declaration row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, background: '#f8fafc', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>MEAL CARD</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>₹4,800 / mo <span style={{ fontSize: '0.78rem', color: '#64748b' }}>(₹57,600 / yr)</span></div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>From Date: 01/07/2026</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>NPS in % (Sec 80CCD(2))</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#047857', marginTop: 2 }}>4% = ₹7,133 / mo <span style={{ fontSize: '0.78rem', color: '#64748b' }}>(₹85,596 / yr)</span></div>
                <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, marginTop: 2 }}>Exempt in New Regime ✓</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>PRAN NO</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#8b5cf6', marginTop: 2 }}>110128446556</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>National Pension System Tier 1</div>
              </div>
            </div>

            {/* Official Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#475569', color: '#ffffff', textTransform: 'uppercase', fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Compensation Component</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Monthly Amount (₹)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Annual Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {OFFICIAL_TEC_STRUCTURE.components.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {c.name}
                        {c.type === 'NPS' && <span style={{ marginLeft: 8, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800 }}>80CCD(2) Exempt</span>}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                        ₹{c.monthly.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        ₹{c.annual.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    <td style={{ padding: '16px', fontWeight: 900, fontSize: '1rem', borderRadius: '0 0 0 12px' }}>
                      TEC (Total Employment Cost)
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: '#34d399' }}>
                      ₹{OFFICIAL_TEC_STRUCTURE.totalMonthly.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem', color: '#34d399', borderRadius: '0 0 12px 0' }}>
                      ₹{OFFICIAL_TEC_STRUCTURE.totalAnnual.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: OLD VS NEW REGIME COMPARISON ── */}
      {activeTab === 'regime' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 24 }}>
          {/* Left: Detailed Comparison Table & Bar Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Bar Chart Comparison */}
            <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Old Regime vs New Regime Breakdown</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Comparing deductions, taxable income & final tax burden</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regimeComparisonChart} barSize={36} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="Old Regime" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="New Regime" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Side-by-Side Table */}
            <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Detailed Side-by-Side Tax Computation</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left' }}>Tax Heads / Components</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Old Tax Regime</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>New Tax Regime (Opted ✓)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>Gross Annual Salary & Other Income</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700 }}>₹{calculations.totalGrossIncome.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700 }}>₹{calculations.totalGrossIncome.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', color: '#475569' }}>Standard Deduction</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹50,000</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹75,000</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', color: '#475569' }}>Employer NPS Contribution Sec 80CCD(2) Exemption</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80CCD2.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80CCD2.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', color: '#475569' }}>Section 80C Deductions (PPF, EPF, ELSS, Tuition)</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80C_Claimed.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', color: '#475569' }}>Section 80D Health Insurance (Family + Parents)</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80D.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', color: '#475569' }}>Section 80CCD(1B) NPS Additional Deduction</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80CCD_Claimed.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', color: '#475569' }}>Section 24(b) Home Loan Interest Exemption</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec24b_Claimed.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', color: '#475569' }}>Section 10(13A) HRA Rent Exemption</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.hra.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <td style={{ padding: '14px', fontWeight: 800, color: '#0f172a' }}>Net Taxable Income</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{calculations.oldRegimeTaxable.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{Math.max(calculations.totalGrossIncome - 75000 - calculations.sec80CCD2, 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#ecfdf5' }}>
                      <td style={{ padding: '14px', fontWeight: 900, color: '#047857', fontSize: '0.95rem' }}>Total Income Tax Payable (Incl. 4% Cess)</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>₹{calculations.oldRegimeTax.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: '#047857', fontSize: '1rem' }}>₹{calculations.newRegimeTax.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Smart Recommendation Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
              borderRadius: 20,
              padding: 24,
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(4, 120, 87, 0.25)',
              position: 'sticky',
              top: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Sparkles size={22} color="#fef08a" />
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Regime Advisor</h4>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#a7f3d0', lineHeight: 1.5 }}>
                Your company declaration shows <strong>NEW TAX REGIME OPTED</strong>. Under New Regime, your Employer NPS contribution of <strong>₹85,596 (Sec 80CCD(2))</strong> remains completely tax-exempt!
              </p>

              <div style={{ margin: '16px 0', borderTop: '1px dashed rgba(255, 255, 255, 0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total TDS Deducted</span>
                  <strong>₹{calculations.totalTDS.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Advance Tax Paid</span>
                  <strong>₹{calculations.totalAdvanceTax.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: '#fef08a' }}>
                  <span>Net Refund / Balance</span>
                  <span>{calculations.netTaxPayableOrRefund <= 0 ? `+ ₹${Math.abs(calculations.netTaxPayableOrRefund).toLocaleString('en-IN')} Refund` : `- ₹${calculations.netTaxPayableOrRefund.toLocaleString('en-IN')} Due`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DEDUCTIONS VAULT ── */}
      {activeTab === 'deductions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section 80C Progress */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Section 80C Limit Utilization</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>EPF, PPF, ELSS Mutual Funds, School Tuition Fees</p>
              </div>
              <span style={{ fontWeight: 900, color: '#047857', fontSize: '1.1rem' }}>
                ₹{calculations.sec80C_Claimed.toLocaleString('en-IN')} / ₹1,50,000
              </span>
            </div>
            <div style={{ width: '100%', height: 12, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min((calculations.sec80C_Claimed / 150000) * 100, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #047857)',
                borderRadius: 99
              }} />
            </div>
          </div>

          {/* Table of Deductions */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Tax Savings & Exemptions Vault</h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{taxData.deductions.length} Deductions Logged</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Section</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Deduction Category</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Earner</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Amount Claimed</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Proof Status</th>
                    {isAuthorized && <th style={{ padding: '12px 14px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {taxData.deductions.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}>
                          {d.section}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{d.category}</div>
                        {d.notes && <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{d.notes}</div>}
                      </td>
                      <td style={{ padding: '14px', color: '#475569', fontWeight: 600 }}>{d.earner}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                        ₹{d.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span style={{
                          background: d.proofStatus === 'Verified' ? '#dcfce7' : '#fef3c7',
                          color: d.proofStatus === 'Verified' ? '#16a34a' : '#d97706',
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontWeight: 800,
                          fontSize: '0.72rem'
                        }}>
                          {d.proofStatus === 'Verified' ? '✓ Verified' : '⚠️ Pending'}
                        </span>
                      </td>
                      {isAuthorized && (
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => handleDeleteDeduction(d.id, e)}
                            style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
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
      )}

      {/* ── TAB 3: SALARY & OTHER INCOME ── */}
      {activeTab === 'income' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Salary Breakdown Table */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Annual Salary & Employer TDS Summary</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Earner</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Company</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Basic Salary</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>HRA Received</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Allowances</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Gross Taxable Salary</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>TDS Deducted</th>
                  </tr>
                </thead>
                <tbody>
                  {taxData.salaries.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', fontWeight: 800, color: '#0f172a' }}>{s.earner}</td>
                      <td style={{ padding: '14px', color: '#475569', fontWeight: 600 }}>{s.company || 'Corporate'}</td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>₹{s.basicSalary?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>₹{s.hraReceived?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>₹{s.specialAllowance?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{s.grossSalary?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: '#047857' }}>₹{s.tdsDeducted?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Other Income Sources */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Other Income & Capital Gains</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Income Source</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>TDS Deducted</th>
                  </tr>
                </thead>
                <tbody>
                  {taxData.otherIncome.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>{i.source}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 99, fontWeight: 700, fontSize: '0.74rem' }}>
                          {i.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800 }}>₹{i.amount?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: '#047857' }}>₹{i.tdsDeducted?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ADVANCE TAX DEADLINES ── */}
      {activeTab === 'advance' && (
        <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Quarterly Advance Tax Payment Schedule</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Quarter / Due Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>% Due</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Estimated Due</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Paid Amount</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left' }}>Challan Ref</th>
                </tr>
              </thead>
              <tbody>
                {taxData.advanceTaxPaid.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#0f172a' }}>{a.quarter}</td>
                    <td style={{ padding: '14px', textAlign: 'center', fontWeight: 700 }}>{a.percentDue}%</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700 }}>₹{a.estimatedAmt?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 900, color: '#047857' }}>₹{a.paidAmt?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <span style={{
                        background: a.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                        color: a.status === 'Paid' ? '#16a34a' : '#dc2626',
                        padding: '3px 10px',
                        borderRadius: 99,
                        fontWeight: 800,
                        fontSize: '0.72rem'
                      }}>
                        {a.status === 'Paid' ? '✓ Paid' : '🚨 Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: '#64748b', fontSize: '0.78rem' }}>{a.challanNo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Tax Deduction Modal ── */}
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
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>Log Tax Deduction Record</h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddDeduction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Tax Section</label>
                <select
                  value={deductionForm.section}
                  onChange={e => setDeductionForm({ ...deductionForm, section: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                >
                  <option value="80C">Section 80C (EPF, PPF, ELSS, Tuition - Max ₹1.5L)</option>
                  <option value="80D">Section 80D (Health Insurance Premium)</option>
                  <option value="80CCD(1B)">Section 80CCD(1B) (NPS Additional Self - Max ₹50k)</option>
                  <option value="80CCD(2)">Section 80CCD(2) (Employer NPS Contribution)</option>
                  <option value="Sec 24(b)">Section 24(b) (Home Loan Interest - Max ₹2.0L)</option>
                  <option value="Sec 10(13A)">Section 10(13A) (HRA Rent Exemption)</option>
                  <option value="80TTA">Section 80TTA (Savings Account Interest)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Deduction Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PPF Account Deposit / HDFC Health Insurance"
                  value={deductionForm.category}
                  onChange={e => setDeductionForm({ ...deductionForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={deductionForm.amount}
                    onChange={e => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Taxpayer / Earner</label>
                  <select
                    value={deductionForm.earner}
                    onChange={e => setDeductionForm({ ...deductionForm, earner: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value="Amit Singh">Amit Singh</option>
                    <option value="Sweta Gupta">Sweta Gupta</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Policy receipt # or Investment folio"
                  value={deductionForm.notes}
                  onChange={e => setDeductionForm({ ...deductionForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
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
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10b981, #047857)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Tax Deduction
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
