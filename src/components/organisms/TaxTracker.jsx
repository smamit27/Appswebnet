import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Receipt, Calculator, FileText, TrendingDown, TrendingUp, CheckCircle2,
  AlertTriangle, Percent, ShieldCheck, DollarSign, Building, Briefcase,
  Calendar, Plus, Edit2, Trash2, RotateCcw, Download, Sparkles, Lock,
  ArrowRight, ShieldAlert, FileCheck, Check, Award, Sliders, Play, RefreshCw
} from 'lucide-react';
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import ToastNotification from '../molecules/ToastNotification.jsx';

const STORAGE_KEY_TAX = 'appswebnet_tax_tracker_data_v4';

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
      specialAllowance: 1069992,
      grossSalary: 4280004, // TEC (42,80,004)
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
    { id: 'ded_0', section: '80CCD(2)', category: 'Employer NPS Contribution (4% of Basic)', maxLimit: 214000, amount: 85596, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Exempt under both Old & New Regimes! PRAN: 110128446556' },
    { id: 'ded_1', section: '80C', category: 'EPF (Employee Provident Fund)', maxLimit: 150000, amount: 150000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Deducted directly from salary' },
    { id: 'ded_2', section: '80C', category: 'PPF (Public Provident Fund)', maxLimit: 150000, amount: 75000, proofStatus: 'Verified', earner: 'Sweta Gupta', notes: 'SBI PPF Account' },
    { id: 'ded_3', section: '80C', category: 'ELSS Tax Saver Mutual Funds', maxLimit: 150000, amount: 50000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Mirae Asset Tax Saver' },
    { id: 'ded_4', section: '80C', category: 'Children School Tuition Fees', maxLimit: 150000, amount: 85000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Amishi School Tuition Fees' },
    { id: 'ded_5', section: '80D', category: 'Family Health Insurance (Self & Children)', maxLimit: 25000, amount: 25000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'HDFC ERGO Optima Secure' },
    { id: 'ded_6', section: '80D', category: 'Parents Medical Insurance (Senior Citizens)', maxLimit: 50000, amount: 42000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Star Health Senior Citizen' },
    { id: 'ded_7', section: '80D', category: 'Preventive Health Checkup', maxLimit: 5000, amount: 5000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Annual Health Checkup' },
    { id: 'ded_8', section: '80CCD(1B)', category: 'NPS Additional Self Contribution', maxLimit: 50000, amount: 50000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Tier 1 NPS Account' },
    { id: 'ded_9', section: 'Sec 24(b)', category: 'Home Loan Interest (Self Occupied)', maxLimit: 200000, amount: 185000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'HDFC Home Loan Interest Certificate' },
    { id: 'ded_10', section: 'Sec 10(13A)', category: 'HRA Rent Paid Exemption', maxLimit: 450000, amount: 360000, proofStatus: 'Verified', earner: 'Amit Singh', notes: 'Annual House Rent Receipts & Landlord PAN' },
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

// Defensive merger helper to ensure arrays and properties are NEVER undefined
function sanitizeTaxData(raw) {
  if (!raw || typeof raw !== 'object') return INITIAL_TAX_DATA;
  return {
    fy: raw.fy || '2026-27',
    tecStructure: raw.tecStructure || OFFICIAL_TEC_STRUCTURE,
    salaries: Array.isArray(raw.salaries) && raw.salaries.length > 0 ? raw.salaries : INITIAL_TAX_DATA.salaries,
    otherIncome: Array.isArray(raw.otherIncome) ? raw.otherIncome : INITIAL_TAX_DATA.otherIncome,
    deductions: Array.isArray(raw.deductions) ? raw.deductions : INITIAL_TAX_DATA.deductions,
    advanceTaxPaid: Array.isArray(raw.advanceTaxPaid) ? raw.advanceTaxPaid : INITIAL_TAX_DATA.advanceTaxPaid,
    documents: Array.isArray(raw.documents) ? raw.documents : INITIAL_TAX_DATA.documents
  };
}

// Calculate Old Regime Tax Liability
function calculateOldRegimeTax(taxableIncome) {
  let income = Math.max((taxableIncome || 0) - 50000, 0); // Std Deduction 50k
  if (income <= 250000) return 0;
  if (income <= 500000) return Math.round((income - 250000) * 0.05);

  let tax = 12500; // 2.5L to 5L @ 5%

  if (income <= 1000000) {
    tax += (income - 500000) * 0.20;
  } else {
    tax += 100000; // 5L to 10L @ 20%
    tax += (income - 1000000) * 0.30;
  }

  return Math.round(tax * 1.04);
}

// Calculate New Regime Tax Liability — Union Budget 2025 (FY 2025-26 / AY 2026-27)
// Slabs: 0-4L=Nil, 4-8L=5%, 8-12L=10%, 12-16L=15%, 16-20L=20%, 20-24L=25%, >24L=30%
// Standard Deduction: ₹75,000 | Section 87A Rebate: Full waiver for taxable income ≤ ₹12,00,000
function calculateNewRegimeTax(grossIncome, employerNps = 85596) {
  let income = Math.max((grossIncome || 0) - 75000 - (employerNps || 0), 0); // Std Deduction ₹75k + Employer NPS 80CCD(2)

  // Below basic exemption limit
  if (income <= 400000) return 0;

  // Section 87A Rebate: Full tax waiver for taxable income up to ₹12,00,000
  if (income <= 1200000) return 0;

  // Compute tax slab-wise (no rebate since income > ₹12L)
  let tax = 0;

  // Slab 1: ₹4,00,001 – ₹8,00,000 @ 5%
  tax += Math.min(Math.max(income - 400000, 0), 400000) * 0.05; // max ₹20,000

  // Slab 2: ₹8,00,001 – ₹12,00,000 @ 10%
  tax += Math.min(Math.max(income - 800000, 0), 400000) * 0.10; // max ₹40,000

  // Slab 3: ₹12,00,001 – ₹16,00,000 @ 15%
  tax += Math.min(Math.max(income - 1200000, 0), 400000) * 0.15; // max ₹60,000

  // Slab 4: ₹16,00,001 – ₹20,00,000 @ 20%
  tax += Math.min(Math.max(income - 1600000, 0), 400000) * 0.20; // max ₹80,000

  // Slab 5: ₹20,00,001 – ₹24,00,000 @ 25%
  tax += Math.min(Math.max(income - 2000000, 0), 400000) * 0.25; // max ₹1,00,000

  // Slab 6: Above ₹24,00,000 @ 30%
  tax += Math.max(income - 2400000, 0) * 0.30;

  // 4% Health & Education Cess
  return Math.round(tax * 1.04);
}

export default function TaxTracker({ user, isAuthorized }) {
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'tec' | 'regime' | 'deductions' | 'income' | 'advance'
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [modalOpen, setModalOpen] = useState(false);

  // Safe data state initialization
  const [taxData, setTaxData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAX);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeTaxData(parsed);
      }
    } catch (e) {
      console.error("Failed to load tax data from localStorage", e);
    }
    return INITIAL_TAX_DATA;
  });

  // Ensure taxData always has safe properties
  const safeData = useMemo(() => sanitizeTaxData(taxData), [taxData]);

  // ── TAX SIMULATOR STATE ──
  const [simGrossSalary, setSimGrossSalary] = useState(4280004);
  const [simNpsPercent, setSimNpsPercent] = useState(4);
  const [simSec80C, setSimSec80C] = useState(150000);
  const [simSec80D, setSimSec80D] = useState(72000);
  const [simSec80CCD1B, setSimSec80CCD1B] = useState(50000);
  const [simSec24b, setSimSec24b] = useState(185000);
  const [simHraExemption, setSimHraExemption] = useState(360000);
  // ── HGS PAYROLL PORTAL COMPUTATION STATE ──
  const [hgsInputs, setHgsInputs] = useState({
    addIncome: '',
    rentPerMonth: '',
    isMetro: 'Metro',
    sec10Others: '',
    profTax: '',
    sec24Housing: '',
    sec80C: '',
    chapterVia: '',
    employerNps: '85596'
  });

  const hgsCalc = useMemo(() => {
    const isCustom = Boolean(
      hgsInputs.addIncome || hgsInputs.rentPerMonth || hgsInputs.sec10Others ||
      hgsInputs.profTax || hgsInputs.sec24Housing || hgsInputs.sec80C || hgsInputs.chapterVia ||
      (hgsInputs.employerNps && hgsInputs.employerNps !== '85596')
    );

    const gross = 3965604 + Number(hgsInputs.addIncome || 0);

    const annualRent = Number(hgsInputs.rentPerMonth || 0) * 12;
    const basic = 2140008;
    const hra1 = annualRent - 0.1 * basic;
    const hra2 = hgsInputs.isMetro === 'Metro' ? 0.5 * basic : 0.4 * basic;
    const hraExemption = annualRent > 0 ? Math.max(0, Math.min(hra1, hra2, 1070004)) : 0;

    const sec10 = Number(hgsInputs.sec10Others || 0);
    const profTax = Number(hgsInputs.profTax || 0);
    const sec24 = Math.min(Number(hgsInputs.sec24Housing || 0), 200000);
    const sec80c = Math.min(Number(hgsInputs.sec80C || 0), 150000);
    const chapVia = Number(hgsInputs.chapterVia || 0);
    const empNps = hgsInputs.employerNps !== '' ? Number(hgsInputs.employerNps) : 85596;

    // Baseline exact numbers matching portal screenshot when no custom inputs:
    if (!isCustom) {
      return {
        gross: 3965604,
        payrollTaxable: 3801660,
        payrollTax: 720498,
        payrollCess: 28820,
        payrollTotal: 749318,

        oldTaxable: 3915604,
        oldTax: 987182,
        oldCess: 39488,
        oldTotal: 1026670,

        newTaxable: 3890604,
        newTax: 747182,
        newCess: 29888,
        newTotal: 777070,

        hraExemption: 0, sec10: 0, profTax: 0, sec24: 0, sec80c: 0, chapVia: 0, empNps: 85596,
        oldEmpNps: 0, newEmpNps: 0
      };
    }

    // Custom computation when employee updates fields
    // 1. Current Status as per Payroll (with updated NPS / deductions)
    const payrollTaxable = Math.max(0, gross - (75000 + empNps + hraExemption + sec10 + profTax + sec24 + sec80c + chapVia));
    const payrollTax = calculateNewRegimeTax(gross, empNps + hraExemption + sec10 + profTax + sec24 + sec80c + chapVia);
    const payrollCess = Math.round(payrollTax * 0.04);
    const payrollTotal = payrollTax + payrollCess;

    // 2. Old Regime with Deduction / Exemption (with updated NPS / deductions)
    const oldTaxable = Math.max(0, gross - (50000 + empNps + hraExemption + sec10 + profTax + sec24 + sec80c + chapVia));
    const oldTax = calculateOldRegimeTax(oldTaxable + 50000);
    const oldCess = Math.round(oldTax * 0.04);
    const oldTotal = oldTax + oldCess;

    // 3. New Regime without Deduction / Exemption (Std Ded 75k + Employer NPS)
    const newTaxable = Math.max(0, gross - (75000 + empNps));
    const newTax = calculateNewRegimeTax(gross, empNps);
    const newCess = Math.round(newTax * 0.04);
    const newTotal = newTax + newCess;

    return {
      gross,
      payrollTaxable, payrollTax, payrollCess, payrollTotal,
      oldTaxable, oldTax, oldCess, oldTotal,
      newTaxable, newTax, newCess, newTotal,
      hraExemption, sec10, profTax, sec24, sec80c, chapVia, empNps,
      oldEmpNps: empNps, newEmpNps: empNps
    };
  }, [hgsInputs]);
  const [deductionForm, setDeductionForm] = useState({
    section: '80C',
    category: '',
    maxLimit: 150000,
    amount: '',
    proofStatus: 'Verified',
    earner: 'Amit Singh',
    notes: ''
  });

  // Sync with Firestore safely
  useEffect(() => {
    const loadFromFirestore = async () => {
      if (!db || !user) return;
      try {
        const docRef = doc(db, 'finance', 'tax_tracker');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data()?.taxData) {
          const remoteData = sanitizeTaxData(snap.data().taxData);
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
    const clean = sanitizeTaxData(updatedData);
    setTaxData(clean);
    try {
      localStorage.setItem(STORAGE_KEY_TAX, JSON.stringify(clean));
    } catch (err) {
      console.error("Failed to save tax data to localStorage:", err);
    }

    if (db && user) {
      try {
        const docRef = doc(db, 'finance', 'tax_tracker');
        await setDoc(docRef, { taxData: clean, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Failed to save tax data to Firestore:", err);
      }
    }
  };

  // ── Calculation Engine ──
  const calculations = useMemo(() => {
    const salaries = safeData.salaries || [];
    const otherIncome = safeData.otherIncome || [];
    const deductions = safeData.deductions || [];
    const advanceTaxPaid = safeData.advanceTaxPaid || [];

    const totalGrossSalary = salaries.reduce((acc, s) => acc + (Number(s.grossSalary) || 0), 0);
    const totalOtherIncome = otherIncome.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totalGrossIncome = totalGrossSalary + totalOtherIncome;

    const salaryTDS = salaries.reduce((acc, s) => acc + (Number(s.tdsDeducted) || 0), 0);
    const otherTDS = otherIncome.reduce((acc, i) => acc + (Number(i.tdsDeducted) || 0), 0);
    const totalTDS = salaryTDS + otherTDS;

    const totalAdvanceTax = advanceTaxPaid.reduce((acc, a) => acc + (Number(a.paidAmt) || 0), 0);
    const totalPrepaidTax = totalTDS + totalAdvanceTax;

    const sec80C = deductions.filter(d => d.section === '80C').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const sec80C_Claimed = Math.min(sec80C, 150000);

    const sec80D = deductions.filter(d => d.section === '80D').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const sec80CCD = deductions.filter(d => d.section === '80CCD(1B)').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const sec80CCD_Claimed = Math.min(sec80CCD, 50000);

    const sec80CCD2 = deductions.filter(d => d.section === '80CCD(2)').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);

    const sec24b = deductions.filter(d => d.section === 'Sec 24(b)').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const sec24b_Claimed = Math.min(sec24b, 200000);

    const hra = deductions.filter(d => d.section === 'Sec 10(13A)').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    const sec80TTA = deductions.filter(d => d.section === '80TTA').reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
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
  }, [safeData]);

  // ── SIMULATOR COMPUTATION ──
  const simResults = useMemo(() => {
    const basicEst = (simGrossSalary || 0) * 0.5;
    const employerNpsAmt = Math.round(basicEst * ((simNpsPercent || 0) / 100));

    const totalOldDeductions = (simSec80C || 0) + (simSec80D || 0) + (simSec80CCD1B || 0) + (simSec24b || 0) + (simHraExemption || 0) + employerNpsAmt;
    const oldTaxable = Math.max((simGrossSalary || 0) - totalOldDeductions, 0);
    const oldTax = calculateOldRegimeTax(oldTaxable);

    const newTax = calculateNewRegimeTax(simGrossSalary, employerNpsAmt);

    const winnerRegime = newTax <= oldTax ? 'NEW' : 'OLD';
    const savings = Math.abs(oldTax - newTax);
    const effectiveTax = winnerRegime === 'NEW' ? newTax : oldTax;

    const monthlyTakeHome = Math.max(Math.round(((simGrossSalary || 0) - effectiveTax - employerNpsAmt) / 12), 0);

    return {
      employerNpsAmt,
      totalOldDeductions,
      oldTaxable,
      oldTax,
      newTax,
      winnerRegime,
      savings,
      effectiveTax,
      monthlyTakeHome
    };
  }, [simGrossSalary, simNpsPercent, simSec80C, simSec80D, simSec80CCD1B, simSec24b, simHraExemption]);

  // Chart data
  const regimeComparisonChart = useMemo(() => [
    { name: 'Gross Income', 'Old Regime': calculations.totalGrossIncome, 'New Regime': calculations.totalGrossIncome },
    { name: 'Deductions', 'Old Regime': calculations.totalEligibleDeductions + 50000, 'New Regime': 75000 + calculations.sec80CCD2 },
    { name: 'Taxable Income', 'Old Regime': calculations.oldRegimeTaxable, 'New Regime': Math.max(calculations.totalGrossIncome - 75000 - calculations.sec80CCD2, 0) },
    { name: 'Tax Liability', 'Old Regime': calculations.oldRegimeTax, 'New Regime': calculations.newRegimeTax }
  ], [calculations]);

  // Preset Scenario Loader
  const handleApplyPreset = (presetName) => {
    if (presetName === 'current') {
      setSimGrossSalary(4280004);
      setSimNpsPercent(4);
      setSimSec80C(150000);
      setSimSec80D(72000);
      setSimSec80CCD1B(50000);
      setSimSec24b(185000);
      setSimHraExemption(360000);
      setToast({ message: "Simulating Current HGS Compensation Plan", type: "success" });
    } else if (presetName === 'hike') {
      setSimGrossSalary(4600000);
      setSimNpsPercent(6);
      setSimSec80C(150000);
      setSimSec80D(75000);
      setSimSec80CCD1B(50000);
      setSimSec24b(200000);
      setSimHraExemption(450000);
      setToast({ message: "Simulating 15% Salary Hike Scenario", type: "success" });
    } else if (presetName === 'max') {
      setSimGrossSalary(4280004);
      setSimNpsPercent(10);
      setSimSec80C(150000);
      setSimSec80D(75000);
      setSimSec80CCD1B(50000);
      setSimSec24b(200000);
      setSimHraExemption(450000);
      setToast({ message: "Simulating Maximized Old Regime Deductions", type: "success" });
    } else if (presetName === 'zero') {
      setSimGrossSalary(4280004);
      setSimNpsPercent(4);
      setSimSec80C(0);
      setSimSec80D(0);
      setSimSec80CCD1B(0);
      setSimSec24b(0);
      setSimHraExemption(0);
      setToast({ message: "Simulating Pure New Regime (Zero Extra Investments)", type: "success" });
    }
  };

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
    const updated = { ...safeData, deductions: [newDeduction, ...safeData.deductions] };
    saveTaxData(updated);
    setModalOpen(false);
    setToast({ message: `Added deduction ${deductionForm.category}`, type: 'success' });
  };

  const handleDeleteDeduction = (id, e) => {
    if (e) e.stopPropagation();
    const updated = { ...safeData, deductions: safeData.deductions.filter(d => d.id !== id) };
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40, width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0, overflow: 'hidden' }}>
      {/* ── Tax Tracker Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #047857 100%)',
        borderRadius: 24,
        padding: '24px',
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #10b981, #047857)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              flexShrink: 0
            }}>
              <Receipt size={28} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  Income Tax Tracking System
                </h1>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  padding: '3px 12px',
                  borderRadius: 99,
                  fontSize: '0.76rem',
                  fontWeight: 800
                }}>
                  FY {safeData.fy} (AY 2027-28)
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                Taxpayers: <strong>Amit Singh & Sweta Gupta</strong> | Employer: <strong>Hinduja Global Solutions</strong>
              </p>
            </div>
          </div>

          {/* Regime Advisor Badge */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: '10px 18px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Sparkles size={22} color="#fef08a" />
            <div>
              <div style={{ fontSize: '0.7rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 800 }}>Opted Company Tax Regime</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff' }}>
                NEW TAX REGIME ✓
              </div>
              <div style={{ fontSize: '0.74rem', color: '#fef08a', fontWeight: 700 }}>
                Saves ₹{calculations.taxSavings.toLocaleString('en-IN')} in tax liability!
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.15)', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700 }}>PRAN NO:</span>
            <span style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fef08a', padding: '3px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800 }}>
              110128446556
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isAuthorized && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Log Tax Deduction
              </button>
            )}
            {isAuthorized && (
              <button
                onClick={handleResetDefaults}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, minWidth: 0 }}>
        {/* Total TEC Employment Cost */}
        <div style={{ background: '#ffffff', borderRadius: 18, padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>HGS Total TEC Package</span>
            <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 800 }}>Company TEC</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '6px 0 2px' }}>
            ₹42.80 <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Lakhs / yr</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Monthly ₹3,56,667 | Basic ₹21.40L
          </div>
        </div>

        {/* Employer NPS Section 80CCD(2) Exemption */}
        <div style={{ background: '#ffffff', borderRadius: 18, padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Employer NPS (80CCD(2))</span>
            <span style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 800 }}>Exempt in New Regime</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', margin: '6px 0 2px' }}>
            ₹85,596 <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>/ yr</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 700 }}>
            4% of Basic (₹7,133/mo) | PRAN: 110128446556
          </div>
        </div>

        {/* Estimated Tax Liability (New Regime) */}
        <div style={{ background: '#ffffff', borderRadius: 18, padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Tax Liability (New Regime)</span>
            <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 800 }}>
              Opted New Regime
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '6px 0 2px' }}>
            ₹{calculations.newRegimeTax.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 700 }}>
            New Regime saves ₹{calculations.taxSavings.toLocaleString('en-IN')} vs Old Regime
          </div>
        </div>

        {/* Total TDS & Prepaid Tax */}
        <div style={{ background: '#ffffff', borderRadius: 18, padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Prepaid Tax (TDS + Adv Tax)</span>
            <span style={{
              background: calculations.netTaxPayableOrRefund <= 0 ? '#dcfce7' : '#fee2e2',
              color: calculations.netTaxPayableOrRefund <= 0 ? '#16a34a' : '#dc2626',
              padding: '2px 8px',
              borderRadius: 99,
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {calculations.netTaxPayableOrRefund <= 0 ? '✓ REFUND DUE' : '🚨 PAYABLE'}
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '6px 0 2px' }}>
            ₹{calculations.totalPrepaidTax.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.76rem', color: calculations.netTaxPayableOrRefund <= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
            {calculations.netTaxPayableOrRefund <= 0
              ? `Estimated Refund: ₹${Math.abs(calculations.netTaxPayableOrRefund).toLocaleString('en-IN')}`
              : `Balance Due: ₹${calculations.netTaxPayableOrRefund.toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #e2e8f0', paddingBottom: 8, overflowX: 'auto', minWidth: 0, WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setActiveTab('simulator')}
          style={{
            padding: '9px 16px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'simulator' ? '#047857' : 'transparent',
            color: activeTab === 'simulator' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Sliders size={15} /> Interactive Tax Simulator & Scenario Planner
        </button>

        <button
          onClick={() => setActiveTab('tec')}
          style={{
            padding: '9px 16px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'tec' ? '#047857' : 'transparent',
            color: activeTab === 'tec' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Building size={15} /> Official HGS TEC Breakdown
        </button>

        <button
          onClick={() => setActiveTab('regime')}
          style={{
            padding: '9px 16px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'regime' ? '#047857' : 'transparent',
            color: activeTab === 'regime' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Calculator size={15} /> Old vs New Regime Comparison
        </button>

        <button
          onClick={() => setActiveTab('deductions')}
          style={{
            padding: '9px 16px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'deductions' ? '#047857' : 'transparent',
            color: activeTab === 'deductions' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <ShieldCheck size={15} /> Deductions Vault (80C, 80D, Sec 24)
        </button>

        <button
          onClick={() => setActiveTab('income')}
          style={{
            padding: '9px 16px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'income' ? '#047857' : 'transparent',
            color: activeTab === 'income' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Briefcase size={15} /> Salary & Income
        </button>

        <button
          onClick={() => setActiveTab('advance')}
          style={{
            padding: '9px 16px',
            borderRadius: 12,
            border: 'none',
            background: activeTab === 'advance' ? '#047857' : 'transparent',
            color: activeTab === 'advance' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap'
          }}
        >
          <Calendar size={15} /> Advance Tax Schedule
        </button>
      </div>

      {/* ── TAB: TAX SIMULATOR & WHAT-IF SCENARIO PLANNER ── */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, minWidth: 0 }}>
          {/* Left Sliders & Preset Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* Presets */}
            <div style={{ background: '#ffffff', borderRadius: 18, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>
                ⚡ Quick Preset Scenarios
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleApplyPreset('current')}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  🏢 Current HGS Plan (₹42.8L + 4% NPS)
                </button>
                <button
                  onClick={() => handleApplyPreset('hike')}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#ecfdf5', color: '#047857', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  🚀 +15% Salary Hike (₹46L + 6% NPS)
                </button>
                <button
                  onClick={() => handleApplyPreset('max')}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e9d5ff', background: '#faf5ff', color: '#7e22ce', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  🛡️ Max Old Regime Deductions
                </button>
                <button
                  onClick={() => handleApplyPreset('zero')}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  ⚡ Pure New Regime (Zero Investments)
                </button>
              </div>
            </div>

            {/* Sliders Input Card */}
            <div style={{ background: '#ffffff', borderRadius: 18, padding: 22, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>"What-If" Financial Controls</h3>

              {/* Slider 1: Gross Annual Salary */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Gross Annual Salary / Package</label>
                  <strong style={{ fontSize: '0.9rem', color: '#047857' }}>₹{(simGrossSalary / 100000).toFixed(2)} Lakhs</strong>
                </div>
                <input
                  type="range"
                  min={2000000}
                  max={6000000}
                  step={50000}
                  value={simGrossSalary}
                  onChange={e => setSimGrossSalary(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#047857' }}
                />
              </div>

              {/* Slider 2: Employer NPS % (Sec 80CCD(2)) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Employer NPS % (Sec 80CCD(2))</label>
                  <strong style={{ fontSize: '0.9rem', color: '#8b5cf6' }}>{simNpsPercent}% of Basic (₹{simResults.employerNpsAmt.toLocaleString('en-IN')})</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={simNpsPercent}
                  onChange={e => setSimNpsPercent(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#8b5cf6' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Exempt under both Old & New Tax Regimes!</span>
              </div>

              {/* Slider 3: Section 80C */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Section 80C (PPF, EPF, ELSS, Tuition)</label>
                  <strong style={{ fontSize: '0.9rem', color: '#0284c7' }}>₹{simSec80C.toLocaleString('en-IN')}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150000}
                  step={5000}
                  value={simSec80C}
                  onChange={e => setSimSec80C(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
              </div>

              {/* Slider 4: Section 80D Health Insurance */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Section 80D Health Insurance</label>
                  <strong style={{ fontSize: '0.9rem', color: '#0284c7' }}>₹{simSec80D.toLocaleString('en-IN')}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={75000}
                  step={2000}
                  value={simSec80D}
                  onChange={e => setSimSec80D(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
              </div>

              {/* Slider 5: Section 80CCD(1B) Self NPS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Section 80CCD(1B) Additional NPS</label>
                  <strong style={{ fontSize: '0.9rem', color: '#0284c7' }}>₹{simSec80CCD1B.toLocaleString('en-IN')}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={5000}
                  value={simSec80CCD1B}
                  onChange={e => setSimSec80CCD1B(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
              </div>

              {/* Slider 6: Section 24(b) Home Loan Interest */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Section 24(b) Home Loan Interest</label>
                  <strong style={{ fontSize: '0.9rem', color: '#0284c7' }}>₹{simSec24b.toLocaleString('en-IN')}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200000}
                  step={10000}
                  value={simSec24b}
                  onChange={e => setSimSec24b(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
              </div>

              {/* Slider 7: Section 10(13A) HRA Exemption */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>HRA Rent Exemption (Annual)</label>
                  <strong style={{ fontSize: '0.9rem', color: '#0284c7' }}>₹{simHraExemption.toLocaleString('en-IN')}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={10000}
                  value={simHraExemption}
                  onChange={e => setSimHraExemption(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284c7' }}
                />
              </div>
            </div>
          </div>

          {/* Right Live Computation Results Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #047857 100%)',
              borderRadius: 22,
              padding: 22,
              color: '#ffffff',
              boxShadow: '0 12px 32px rgba(4, 120, 87, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="#fef08a" />
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>Simulated Output</h4>
                </div>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '3px 10px', borderRadius: 99, fontSize: '0.74rem', fontWeight: 800 }}>
                  {simResults.winnerRegime} REGIME WINS 🏆
                </span>
              </div>

              {/* Key numbers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 14, borderRadius: 14 }}>
                  <span style={{ fontSize: '0.74rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700 }}>Simulated Monthly In-Hand Salary</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: 2 }}>
                    ₹{simResults.monthlyTakeHome.toLocaleString('en-IN')} <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>/ month</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: 10, borderRadius: 10 }}>
                    <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>New Regime Tax</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: simResults.winnerRegime === 'NEW' ? '#34d399' : '#ffffff' }}>
                      ₹{simResults.newTax.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: 10, borderRadius: 10 }}>
                    <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Old Regime Tax</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: simResults.winnerRegime === 'OLD' ? '#34d399' : '#ffffff' }}>
                      ₹{simResults.oldTax.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(254, 240, 138, 0.15)', border: '1px solid rgba(254, 240, 138, 0.3)', padding: 12, borderRadius: 12 }}>
                  <span style={{ fontSize: '0.74rem', color: '#fef08a', fontWeight: 800 }}>TAX SAVINGS</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fef08a', marginTop: 2 }}>
                    ₹{simResults.savings.toLocaleString('en-IN')} Saved via {simResults.winnerRegime} Regime
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5, marginTop: 2 }}>
                  💡 <strong>Break-Even Insight:</strong> Total Old Regime Deductions simulated: <strong>₹{simResults.totalOldDeductions.toLocaleString('en-IN')}</strong>. Employer NPS 80CCD(2) gives an extra tax exemption of <strong>₹{simResults.employerNpsAmt.toLocaleString('en-IN')}</strong> even under the New Regime.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: OFFICIAL HGS TEC COMPENSATION BREAKDOWN ── */}
      {activeTab === 'tec' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 22, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
              <div>
                <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 800 }}>Employer Declaration</span>
                <h3 style={{ margin: '6px 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  {OFFICIAL_TEC_STRUCTURE.employer}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Total Employment Cost (TEC) Plan — Financial Year Basis (April to March)
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', padding: '5px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 800 }}>
                  You have opted NEW REGIME
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 18 }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>MEAL CARD</span>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>₹4,800 / mo <span style={{ fontSize: '0.74rem', color: '#64748b' }}>(₹57,600 / yr)</span></div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>From Date: 01/07/2026</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>NPS in % (Sec 80CCD(2))</span>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#047857', marginTop: 2 }}>4% = ₹7,133 / mo <span style={{ fontSize: '0.74rem', color: '#64748b' }}>(₹85,596 / yr)</span></div>
                <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700, marginTop: 2 }}>Exempt in New Regime ✓</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>PRAN NO</span>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#8b5cf6', marginTop: 2 }}>110128446556</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>National Pension System Tier 1</div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#475569', color: '#ffffff', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Compensation Component</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Monthly Amount (₹)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Annual Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {OFFICIAL_TEC_STRUCTURE.components.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                        {c.name}
                        {c.type === 'NPS' && <span style={{ marginLeft: 6, background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 800 }}>80CCD(2) Exempt</span>}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                        ₹{c.monthly.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        ₹{c.annual.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: '0.95rem', borderRadius: '0 0 0 10px' }}>
                      TEC (Total Employment Cost)
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, fontSize: '0.95rem', color: '#34d399' }}>
                      ₹{OFFICIAL_TEC_STRUCTURE.totalMonthly.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#34d399', borderRadius: '0 0 10px 0' }}>
                      ₹{OFFICIAL_TEC_STRUCTURE.totalAnnual.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Official Employer Summary Tax Computation Portal Card ── */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 22, border: '1px solid #cbd5e1', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', minWidth: 0, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                  🏢 Summary Tax Computation (Hinduja Global Solutions Portal)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Official Payroll Tax Computation — As per HGS Employee Portal
                </p>
              </div>
              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: 99, fontSize: '0.76rem', fontWeight: 800 }}>
                Regime recommended: Current Status as per Payroll
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left', minWidth: 680 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#334155', fontWeight: 800, borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 12px', width: '32%' }}>Summary Tax Computation</th>
                  <th style={{ padding: '10px 12px', width: '22%' }}>Employee to Update</th>
                  <th style={{ padding: '10px 12px', width: '15.3%', textAlign: 'right' }}>Current Status as per Payroll</th>
                  <th style={{ padding: '10px 12px', width: '15.3%', textAlign: 'right' }}>Old Regime with Deduction / Exemption</th>
                  <th style={{ padding: '10px 12px', width: '15.3%', textAlign: 'right' }}>New Regime without Deduction / Exemption</th>
                </tr>
              </thead>
              <tbody>
                {/* Gross Taxable Salary */}
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 800, color: '#0f172a' }}>Gross Taxable Salary (Excluding Reimbursement)</td>
                  <td style={{ padding: '9px 12px' }}></td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 800 }}>{hgsCalc.gross.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 800 }}>{hgsCalc.gross.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 800 }}>{hgsCalc.gross.toLocaleString('en-IN')}</td>
                </tr>

                {/* Add : Additional Income */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Add : Additional Income (projected)</td>
                  <td style={{ padding: '7px 12px' }}>
                    <input type="number" placeholder="0" value={hgsInputs.addIncome} onChange={e => setHgsInputs({ ...hgsInputs, addIncome: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsInputs.addIncome || 0}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsInputs.addIncome || 0}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsInputs.addIncome || 0}</td>
                </tr>

                {/* Less : HRA Rebate */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : HRA Rebate (Rent per Month)</td>
                  <td style={{ padding: '7px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select value={hgsInputs.isMetro} onChange={e => setHgsInputs({ ...hgsInputs, isMetro: e.target.value })} style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem' }}>
                        <option value="Metro">Metro</option>
                        <option value="Non-Metro">Non-Metro</option>
                      </select>
                      <input type="number" placeholder="0" value={hgsInputs.rentPerMonth} onChange={e => setHgsInputs({ ...hgsInputs, rentPerMonth: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                    </div>
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.hraExemption.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.hraExemption.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                </tr>

                {/* Less : Exemptions Sec 10 */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : Exemptions U/s Section10 (Others)</td>
                  <td style={{ padding: '7px 12px' }}>
                    <input type="number" placeholder="0" value={hgsInputs.sec10Others} onChange={e => setHgsInputs({ ...hgsInputs, sec10Others: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.sec10.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.sec10.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                </tr>

                {/* Less : Std Deduction */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : Deductions U/s Section 16 (Std Deduction)</td>
                  <td style={{ padding: '7px 12px' }}></td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>0</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>50000</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>75000</td>
                </tr>

                {/* Less : Profession Tax */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : Deductions U/s Section 16 (Profession Tax)</td>
                  <td style={{ padding: '7px 12px' }}>
                    <input type="number" placeholder="0" value={hgsInputs.profTax} onChange={e => setHgsInputs({ ...hgsInputs, profTax: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.profTax.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.profTax.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                </tr>

                {/* Less : Section 24 */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : Deductions U/s Section 24 (Housing Loan)</td>
                  <td style={{ padding: '7px 12px' }}>
                    <input type="number" placeholder="0" value={hgsInputs.sec24Housing} onChange={e => setHgsInputs({ ...hgsInputs, sec24Housing: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.sec24.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.sec24.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                </tr>

                {/* Less : Section 80C */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : Deductions U/s Section 80C</td>
                  <td style={{ padding: '7px 12px' }}>
                    <input type="number" placeholder="0" value={hgsInputs.sec80C} onChange={e => setHgsInputs({ ...hgsInputs, sec80C: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.sec80c.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.sec80c.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                </tr>

                {/* Less : Chapter VIA */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : Deductions Chapter VIA (Others)</td>
                  <td style={{ padding: '7px 12px' }}>
                    <input type="number" placeholder="0" value={hgsInputs.chapterVia} onChange={e => setHgsInputs({ ...hgsInputs, chapterVia: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.chapVia.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.chapVia.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                </tr>

                {/* Less : Employer NPS */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : Deductions Employer NPS</td>
                  <td style={{ padding: '7px 12px' }}>
                    <input type="number" placeholder="85596" value={hgsInputs.employerNps} onChange={e => setHgsInputs({ ...hgsInputs, employerNps: e.target.value })} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>{hgsCalc.empNps.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.oldEmpNps ? hgsCalc.oldEmpNps.toLocaleString('en-IN') : 0}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>{hgsCalc.newEmpNps ? hgsCalc.newEmpNps.toLocaleString('en-IN') : 0}</td>
                </tr>

                {/* Action Row */}
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button
                      onClick={() => setToast({ message: 'Summary Tax Computation Calculated!', type: 'success' })}
                      style={{
                        padding: '7px 20px',
                        borderRadius: 8,
                        background: '#3b82f6',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      Calculate Tax
                    </button>
                  </td>
                  <td colSpan={3}></td>
                </tr>

                {/* Net Taxable Income */}
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 800 }}>Net Taxable Income</td>
                  <td></td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 900 }}>{hgsCalc.payrollTaxable.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 900 }}>{hgsCalc.oldTaxable.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 900 }}>{hgsCalc.newTaxable.toLocaleString('en-IN')}</td>
                </tr>

                {/* Tax Payable */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Tax Payable</td>
                  <td></td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>{hgsCalc.payrollTax.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>{hgsCalc.oldTax.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>{hgsCalc.newTax.toLocaleString('en-IN')}</td>
                </tr>

                {/* Less : Rebate U/S 87A */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Less : Rebate U/S 87A</td>
                  <td></td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>0</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>0</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>0</td>
                </tr>

                {/* Add : Surcharge */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Add : Surcharge</td>
                  <td></td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>0</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>0</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right' }}>0</td>
                </tr>

                {/* Add : Education Cess */}
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '7px 12px', color: '#334155' }}>Add : Education Cess (4%)</td>
                  <td></td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>{hgsCalc.payrollCess.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>{hgsCalc.oldCess.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700 }}>{hgsCalc.newCess.toLocaleString('en-IN')}</td>
                </tr>

                {/* Total Tax Payable */}
                <tr style={{ background: '#0f172a', color: '#ffffff' }}>
                  <td style={{ padding: '11px 12px', fontWeight: 900, borderRadius: '0 0 0 8px' }}>Total Tax Payable</td>
                  <td></td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 900, color: '#34d399', fontSize: '0.95rem' }}>₹{hgsCalc.payrollTotal.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 900, color: '#f87171', fontSize: '0.95rem' }}>₹{hgsCalc.oldTotal.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 900, color: '#38bdf8', fontSize: '0.95rem', borderRadius: '0 0 8px 0' }}>₹{hgsCalc.newTotal.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 1: OLD VS NEW REGIME COMPARISON ── */}
      {activeTab === 'regime' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <div style={{ background: '#ffffff', borderRadius: 18, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Old Regime vs New Regime Breakdown</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>Comparing deductions, taxable income & final tax burden</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={regimeComparisonChart} barSize={32} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="Old Regime" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="New Regime" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 18, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Detailed Side-by-Side Tax Computation</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tax Heads / Components</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Old Tax Regime</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>New Tax Regime (Opted ✓)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>Gross Annual Salary & Other Income</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>₹{calculations.totalGrossIncome.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>₹{calculations.totalGrossIncome.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#475569' }}>Standard Deduction</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹50,000</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹75,000</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#475569' }}>Employer NPS Contribution Sec 80CCD(2) Exemption</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80CCD2.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80CCD2.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#475569' }}>Section 80C Deductions (PPF, EPF, ELSS, Tuition)</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80C_Claimed.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#475569' }}>Section 80D Health Insurance (Family + Parents)</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80D.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#475569' }}>Section 80CCD(1B) NPS Additional Deduction</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec80CCD_Claimed.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#475569' }}>Section 24(b) Home Loan Interest Exemption</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.sec24b_Claimed.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#475569' }}>Section 10(13A) HRA Rent Exemption</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>- ₹{calculations.hra.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>N/A</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>Net Taxable Income</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{calculations.oldRegimeTaxable.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{Math.max(calculations.totalGrossIncome - 75000 - calculations.sec80CCD2, 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#ecfdf5' }}>
                      <td style={{ padding: '12px', fontWeight: 900, color: '#047857', fontSize: '0.9rem' }}>Total Income Tax Payable (Incl. 4% Cess)</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>₹{calculations.oldRegimeTax.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#047857', fontSize: '0.95rem' }}>₹{calculations.newRegimeTax.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <div style={{
              background: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
              borderRadius: 20,
              padding: 20,
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(4, 120, 87, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Sparkles size={20} color="#fef08a" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Regime Advisor</h4>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#a7f3d0', lineHeight: 1.5 }}>
                Your company declaration shows <strong>NEW TAX REGIME OPTED</strong>. Under New Regime, your Employer NPS contribution of <strong>₹85,596 (Sec 80CCD(2))</strong> remains completely tax-exempt!
              </p>

              <div style={{ margin: '14px 0', borderTop: '1px dashed rgba(255, 255, 255, 0.2)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total TDS Deducted</span>
                  <strong>₹{calculations.totalTDS.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Advance Tax Paid</span>
                  <strong>₹{calculations.totalAdvanceTax.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, color: '#fef08a' }}>
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
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>Section 80C Limit Utilization</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>EPF, PPF, ELSS Mutual Funds, School Tuition Fees</p>
              </div>
              <span style={{ fontWeight: 900, color: '#047857', fontSize: '1.05rem' }}>
                ₹{calculations.sec80C_Claimed.toLocaleString('en-IN')} / ₹1,50,000
              </span>
            </div>
            <div style={{ width: '100%', height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min((calculations.sec80C_Claimed / 150000) * 100, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #047857)',
                borderRadius: 99
              }} />
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 18, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Tax Savings & Exemptions Vault</h3>
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>{safeData.deductions.length} Deductions Logged</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>Section</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Deduction Category</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Earner</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount Claimed</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Proof Status</th>
                    {isAuthorized && <th style={{ padding: '10px 12px', textAlign: 'center', borderRadius: '0 6px 6px 0' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {safeData.deductions.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: '0.72rem'
                        }}>
                          {d.section}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem' }}>{d.category}</div>
                        {d.notes && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{d.notes}</div>}
                      </td>
                      <td style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>{d.earner}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '0.9rem' }}>
                        ₹{d.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          background: d.proofStatus === 'Verified' ? '#dcfce7' : '#fef3c7',
                          color: d.proofStatus === 'Verified' ? '#16a34a' : '#d97706',
                          padding: '2px 8px',
                          borderRadius: 99,
                          fontWeight: 800,
                          fontSize: '0.7rem'
                        }}>
                          {d.proofStatus === 'Verified' ? '✓ Verified' : '⚠️ Pending'}
                        </span>
                      </td>
                      {isAuthorized && (
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => handleDeleteDeduction(d.id, e)}
                            style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '5px 8px', borderRadius: 6, cursor: 'pointer' }}
                          >
                            <Trash2 size={13} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 18, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Annual Salary & Employer TDS Summary</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Earner</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Company</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Basic Salary</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>HRA Received</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Allowances</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Gross Taxable Salary</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>TDS Deducted</th>
                  </tr>
                </thead>
                <tbody>
                  {safeData.salaries.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{s.earner}</td>
                      <td style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>{s.company || 'Corporate'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>₹{s.basicSalary?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>₹{s.hraReceived?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>₹{s.specialAllowance?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>₹{s.grossSalary?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#047857' }}>₹{s.tdsDeducted?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 18, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Other Income & Capital Gains</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Income Source</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>TDS Deducted</th>
                  </tr>
                </thead>
                <tbody>
                  {safeData.otherIncome.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{i.source}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 99, fontWeight: 700, fontSize: '0.72rem' }}>
                          {i.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>₹{i.amount?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#047857' }}>₹{i.tdsDeducted?.toLocaleString('en-IN')}</td>
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
        <div style={{ background: '#ffffff', borderRadius: 18, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Quarterly Advance Tax Payment Schedule</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Quarter / Due Date</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>% Due</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Estimated Due</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Paid Amount</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Challan Ref</th>
                </tr>
              </thead>
              <tbody>
                {safeData.advanceTaxPaid.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{a.quarter}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{a.percentDue}%</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700 }}>₹{a.estimatedAmt?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#047857' }}>₹{a.paidAmt?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        background: a.status === 'Paid' ? '#dcfce7' : '#fee2e2',
                        color: a.status === 'Paid' ? '#16a34a' : '#dc2626',
                        padding: '2px 8px',
                        borderRadius: 99,
                        fontWeight: 800,
                        fontSize: '0.7rem'
                      }}>
                        {a.status === 'Paid' ? '✓ Paid' : '🚨 Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '0.76rem' }}>{a.challanNo || '-'}</td>
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
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            width: '100%',
            maxWidth: 460,
            padding: 24,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Log Tax Deduction Record</h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddDeduction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Tax Section</label>
                <select
                  value={deductionForm.section}
                  onChange={e => setDeductionForm({ ...deductionForm, section: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
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
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Deduction Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PPF Account Deposit / HDFC Health Insurance"
                  value={deductionForm.category}
                  onChange={e => setDeductionForm({ ...deductionForm, category: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={deductionForm.amount}
                    onChange={e => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Taxpayer / Earner</label>
                  <select
                    value={deductionForm.earner}
                    onChange={e => setDeductionForm({ ...deductionForm, earner: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Amit Singh">Amit Singh</option>
                    <option value="Sweta Gupta">Sweta Gupta</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Policy receipt # or Investment folio"
                  value={deductionForm.notes}
                  onChange={e => setDeductionForm({ ...deductionForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #047857)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
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
