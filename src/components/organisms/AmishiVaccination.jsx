import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  Syringe, CheckCircle2, Clock, Calendar, AlertCircle, TrendingUp, Plus,
  Edit2, Trash2, RotateCcw, ShieldCheck, Heart, Sparkles, User, Award, Info, FileText
} from 'lucide-react';
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import ToastNotification from '../molecules/ToastNotification.jsx';

const STORAGE_KEY_VACCINES = 'appswebnet_amishi_vaccinations';
const STORAGE_KEY_GROWTH = 'appswebnet_amishi_growth';

const CHILD_PROFILE = {
  name: "Amishi",
  dob: "2021-03-24",
  bloodGroup: "AB+",
  deliveryMode: "L.S.C.S. (Cesarean)",
  gestationalAge: "Full Term (FT)",
  hospital: "Motherhood Hospital",
  birthWeight: 3.4, // kg
  birthHeight: 47, // cm
  birthHeadCircum: 35, // cm
  oaeScreen: "Done / Normal",
  neonatalStatus: "Normal (N)"
};

const INITIAL_VACCINES = [
  // Birth - 1 Month
  { id: 'v_1', stage: 'Birth - 1 Month', ageCategory: 'Birth', name: 'BCG', due: '2021-03-24', given: '2021-03-24', status: 'given', brand: 'Motherhood Hospital', notes: 'Tuberculosis immunization' },
  { id: 'v_2', stage: 'Birth - 1 Month', ageCategory: 'Birth', name: 'OPV 0', due: '2021-03-24', given: '2021-03-24', status: 'given', brand: 'Oral Polio Vaccine', notes: 'Birth dose' },
  { id: 'v_3', stage: 'Birth - 1 Month', ageCategory: 'Birth', name: 'Hepatitis B1', due: '2021-03-24', given: '2021-03-24', status: 'given', brand: 'Hep-B', notes: 'Birth dose' },
  { id: 'v_4', stage: 'Birth - 1 Month', ageCategory: 'Birth', name: 'Hepatitis B2', due: '2021-04-24', given: '2021-04-24', status: 'given', brand: 'Hep-B', notes: '1 Month dose' },

  // 6 Weeks
  { id: 'v_5', stage: '6 Weeks', ageCategory: 'Infant', name: 'DTPw1 / DTPa1', due: '2021-05-05', given: '2021-05-05', status: 'given', brand: 'Hexaxim', notes: 'Hexavalent combination' },
  { id: 'v_6', stage: '6 Weeks', ageCategory: 'Infant', name: 'HiB 1', due: '2021-05-05', given: '2021-05-05', status: 'given', brand: 'Hexaxim', notes: '' },
  { id: 'v_7', stage: '6 Weeks', ageCategory: 'Infant', name: 'OPV1 / IPV1', due: '2021-05-05', given: '2021-05-05', status: 'given', brand: 'IPV', notes: '' },
  { id: 'v_8', stage: '6 Weeks', ageCategory: 'Infant', name: 'Rotavirus 1', due: '2021-05-05', given: '2021-05-05', status: 'given', brand: 'Rotavac', notes: 'Oral drops' },
  { id: 'v_9', stage: '6 Weeks', ageCategory: 'Infant', name: 'PCV 1 (Pneumococcal 1)', due: '2021-05-05', given: '2021-05-05', status: 'given', brand: 'Prevenar 13', notes: '' },

  // 10 Weeks
  { id: 'v_10', stage: '10 Weeks', ageCategory: 'Infant', name: 'DTPw2 / DTPa2', due: '2021-05-13', given: '2021-05-13', status: 'given', brand: 'Pentaxim', weight: 5.4, height: 60, headCircum: 40, notes: '' },
  { id: 'v_11', stage: '10 Weeks', ageCategory: 'Infant', name: 'HiB 2', due: '2021-05-13', given: '2021-05-13', status: 'given', brand: 'Pentaxim', notes: '' },
  { id: 'v_12', stage: '10 Weeks', ageCategory: 'Infant', name: 'OPV2 / IPV2', due: '2021-05-13', given: '2021-05-13', status: 'given', brand: 'Pentaxim', notes: '' },
  { id: 'v_13', stage: '10 Weeks', ageCategory: 'Infant', name: 'Rotavirus 2', due: '2021-05-13', given: '2021-05-13', status: 'given', brand: 'Rotavac', notes: '' },
  { id: 'v_14', stage: '10 Weeks', ageCategory: 'Infant', name: 'PCV 2 (Pneumococcal 2)', due: '2021-05-13', given: '2021-05-13', status: 'given', brand: 'Prevenar 13', notes: '' },

  // 14 Weeks
  { id: 'v_15', stage: '14 Weeks', ageCategory: 'Infant', name: 'DTPw3 / DTPa3', due: '2021-07-13', given: '2021-07-15', status: 'given', brand: 'Pentaxim', weight: 6.4, height: 63, headCircum: 42, notes: '' },
  { id: 'v_16', stage: '14 Weeks', ageCategory: 'Infant', name: 'HiB 3', due: '2021-07-13', given: '2021-07-15', status: 'given', brand: 'Pentaxim', notes: '' },
  { id: 'v_17', stage: '14 Weeks', ageCategory: 'Infant', name: 'OPV3 / IPV3', due: '2021-07-13', given: '2021-07-15', status: 'given', brand: 'Pentaxim', notes: '' },
  { id: 'v_18', stage: '14 Weeks', ageCategory: 'Infant', name: 'Rotavirus 3', due: '2021-07-13', given: '2021-07-15', status: 'given', brand: 'Rotavac', notes: '' },
  { id: 'v_19', stage: '14 Weeks', ageCategory: 'Infant', name: 'PCV 3 (Pneumococcal 3)', due: '2021-07-13', given: '2021-07-15', status: 'given', brand: 'Prevenar 13', notes: '' },

  // 14 Wks / 6 Months
  { id: 'v_20', stage: '6 Months', ageCategory: 'Infant', name: 'Hepatitis B3', due: '2021-09-24', given: '2021-09-27', status: 'given', brand: 'Hep-B', weight: 7.7, notes: '' },
  { id: 'v_21', stage: '6 Months', ageCategory: 'Infant', name: 'OPV 4', due: '2021-09-24', given: '2021-09-27', status: 'given', brand: 'OPV', notes: '' },

  // 9 Months
  { id: 'v_22', stage: '9 Months', ageCategory: 'Infant', name: 'MMR 1 + OPV', due: '2021-12-24', given: '2021-12-30', status: 'given', brand: 'MMR', notes: 'Measles, Mumps, Rubella' },

  // 9-12 Months
  { id: 'v_23', stage: '9-12 Months', ageCategory: 'Infant', name: 'Typhoid Conjugate Vaccine', due: '2022-02-01', given: '2022-02-01', status: 'given', brand: 'Tybar-TCV', weight: 9.6, batchNo: '76C20046A', notes: 'Exp 07/22' },

  // 12 Months
  { id: 'v_24', stage: '12 Months', ageCategory: 'Toddler', name: 'Hepatitis A1', due: '2022-03-25', given: '2022-03-31', status: 'given', brand: 'Biovac A', notes: '' },

  // 15 Months
  { id: 'v_25', stage: '15 Months', ageCategory: 'Toddler', name: 'MMR 2', due: '2022-06-25', given: '2022-06-25', status: 'given', brand: 'MMR', notes: '' },
  { id: 'v_26', stage: '15 Months', ageCategory: 'Toddler', name: 'Varicella 1 (Chickenpox)', due: '2022-06-25', given: '2022-06-25', status: 'given', brand: 'Nexipox', batchNo: '202105051-2', notes: 'Exp 01/05/2024' },

  // 16-18 Months
  { id: 'v_27', stage: '16-18 Months', ageCategory: 'Toddler', name: 'Pneumococcal Booster (PCV B)', due: '2022-09-24', given: '2022-09-24', status: 'given', brand: 'Prevenar 13', notes: '' },
  { id: 'v_28', stage: '16-18 Months', ageCategory: 'Toddler', name: 'DTPWB1 / DTPaB1', due: '2022-09-24', given: '2022-09-24', status: 'given', brand: 'Pentaxim', notes: '' },
  { id: 'v_29', stage: '16-18 Months', ageCategory: 'Toddler', name: 'HiB B1', due: '2022-09-24', given: '2022-09-24', status: 'given', brand: 'Pentaxim', notes: '' },
  { id: 'v_30', stage: '16-18 Months', ageCategory: 'Toddler', name: 'OPVB1 / IPVB1', due: '2022-09-24', given: '2022-09-24', status: 'given', brand: 'IPV', notes: '' },

  // 2 Years
  { id: 'v_31', stage: '2 Years', ageCategory: 'Toddler', name: 'Hepatitis A2', due: '2022-10-20', given: '2022-10-21', status: 'given', brand: 'Biovac A', notes: '' },
  { id: 'v_32', stage: '2 Years', ageCategory: 'Toddler', name: 'Typhoid Conjugate Booster', due: '2023-04-01', given: '2023-04-01', status: 'given', brand: 'Tybar-TCV', notes: '' },

  // 5 Years
  { id: 'v_33', stage: '5 Years', ageCategory: 'Childhood', name: 'DTPwB2 / DTPaB2', due: '2026-04-04', given: '2026-04-04', status: 'given', brand: 'Adacel', batchNo: '6CA20C2', notes: 'Exp Feb 2028' },
  { id: 'v_34', stage: '5 Years', ageCategory: 'Childhood', name: 'OPV B2', due: '2026-04-04', given: '2026-04-04', status: 'given', brand: 'OPV', notes: '' },
  { id: 'v_35', stage: '5 Years', ageCategory: 'Childhood', name: 'MMR 3', due: '2026-04-04', given: '2026-04-04', status: 'given', brand: 'MMR', notes: '' },
  { id: 'v_36', stage: '5 Years', ageCategory: 'Childhood', name: 'Varicella 2', due: '2026-05-05', given: '2026-05-18', status: 'given', brand: 'Nexipox', notes: '' },

  // 10 Years
  { id: 'v_37', stage: '10 Years', ageCategory: 'Pre-Teens', name: 'Tdap / Td', due: '2031-03-24', given: '', status: 'upcoming', brand: '', notes: 'Due at age 10' },

  // Annual Influenza Doses
  { id: 'v_flu_1', stage: 'Annual Flu', ageCategory: 'Influenza', name: 'Influenza Dose 1 (2021)', due: '2021-09-24', given: '2021-09-27', status: 'given', brand: 'Fluarix Tetra', notes: 'Quadrivalent Flu' },
  { id: 'v_flu_2', stage: 'Annual Flu', ageCategory: 'Influenza', name: 'Influenza Dose 2 (2022)', due: '2022-10-20', given: '2022-10-21', status: 'given', brand: 'Influvac Tetra', notes: '' },
  { id: 'v_flu_3', stage: 'Annual Flu', ageCategory: 'Influenza', name: 'Influenza Dose 3 (2023)', due: '2023-10-22', given: '2023-12-25', status: 'given', brand: 'Fluarix Tetra', notes: '' },
  { id: 'v_flu_4', stage: 'Annual Flu', ageCategory: 'Influenza', name: 'Influenza Dose 4 (2024)', due: '2024-12-25', given: '2024-12-20', status: 'given', brand: 'Fluarix Tetra', notes: '' },
  { id: 'v_flu_5', stage: 'Annual Flu', ageCategory: 'Influenza', name: 'Influenza Dose 5 (2026)', due: '2026-05-05', given: '2026-05-18', status: 'given', brand: 'Fluarix Tetra', batchNo: 'RFLBA737AC', notes: 'Exp 04/2024' },
  { id: 'v_flu_6', stage: 'Annual Flu', ageCategory: 'Influenza', name: 'Influenza Dose 6 (2027)', due: '2027-05-15', given: '', status: 'upcoming', brand: 'Fluarix Tetra / Influvac', notes: 'Next annual flu booster ⏰' },

  // HPV
  { id: 'v_hpv_1', stage: 'Adolescent (Age 9-14)', ageCategory: 'HPV', name: 'HPV Vaccine Dose 1', due: '2030-03-24', given: '', status: 'upcoming', brand: 'Gardasil', notes: 'Recommended age 9-14 years' },
  { id: 'v_hpv_2', stage: 'Adolescent (Age 9-14)', ageCategory: 'HPV', name: 'HPV Vaccine Dose 2', due: '2030-09-24', given: '', status: 'upcoming', brand: 'Gardasil', notes: '6 months after dose 1' }
];

const INITIAL_GROWTH_RECORDS = [
  { date: '2021-03-24', ageLabel: 'Birth', weight: 3.4, height: 47, headCircum: 35 },
  { date: '2021-05-13', ageLabel: '10 Weeks', weight: 5.4, height: 60, headCircum: 40 },
  { date: '2021-07-15', ageLabel: '14 Weeks', weight: 6.4, height: 63, headCircum: 42 },
  { date: '2021-09-27', ageLabel: '6 Months', weight: 7.7, height: 67, headCircum: 43.5 },
  { date: '2022-02-01', ageLabel: '10 Months', weight: 9.6, height: 74, headCircum: 45 }
];

export default function AmishiVaccination({ user, isAuthorized }) {
  const [activeSubTab, setActiveSubTab] = useState('vaccines'); // 'vaccines' | 'growth' | 'vault' | 'cardScan'
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState(null);

  // Vaccines state with localStorage fallback
  const [vaccines, setVaccines] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VACCINES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load Amishi vaccines from localStorage", e);
    }
    return INITIAL_VACCINES;
  });

  // Growth metrics state
  const [growthRecords, setGrowthRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROWTH);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load growth records from localStorage", e);
    }
    return INITIAL_GROWTH_RECORDS;
  });

  // Form State for Add / Edit Vaccine
  const [formData, setFormData] = useState({
    name: '',
    stage: '5 Years',
    ageCategory: 'Childhood',
    due: new Date().toISOString().slice(0, 10),
    given: '',
    status: 'given',
    brand: '',
    batchNo: '',
    notes: '',
    weight: '',
    height: '',
    headCircum: ''
  });

  // Firestore Sync
  useEffect(() => {
    const loadFromFirestore = async () => {
      if (!db || !user) return;
      try {
        const docRef = doc(db, 'activities/amishi', 'vaccinations');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.vaccines) && data.vaccines.length > 0) {
            setVaccines(data.vaccines);
            localStorage.setItem(STORAGE_KEY_VACCINES, JSON.stringify(data.vaccines));
          }
          if (Array.isArray(data.growth) && data.growth.length > 0) {
            setGrowthRecords(data.growth);
            localStorage.setItem(STORAGE_KEY_GROWTH, JSON.stringify(data.growth));
          }
        }
      } catch (err) {
        console.error("Error fetching Amishi vaccinations from Firestore:", err);
      }
    };
    loadFromFirestore();
  }, [user]);

  // Persist Vaccines
  const saveVaccines = async (updatedVaccines, updatedGrowth = growthRecords) => {
    setVaccines(updatedVaccines);
    setGrowthRecords(updatedGrowth);
    try {
      localStorage.setItem(STORAGE_KEY_VACCINES, JSON.stringify(updatedVaccines));
      localStorage.setItem(STORAGE_KEY_GROWTH, JSON.stringify(updatedGrowth));
    } catch (err) {
      console.error("Error saving to localStorage", err);
    }

    if (db && user) {
      try {
        const docRef = doc(db, 'activities/amishi', 'vaccinations');
        await setDoc(docRef, {
          vaccines: updatedVaccines,
          growth: updatedGrowth,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error saving to Firestore", err);
      }
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = vaccines.length;
    const completed = vaccines.filter(v => v.status === 'given').length;
    const upcoming = vaccines.filter(v => v.status === 'upcoming');
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Find next upcoming vaccine
    const sortedUpcoming = [...upcoming].sort((a, b) => new Date(a.due) - new Date(b.due));
    const nextVaccine = sortedUpcoming[0] || null;

    return { total, completed, upcomingCount: upcoming.length, completionRate, nextVaccine };
  }, [vaccines]);

  // Filtered vaccines list
  const filteredVaccines = useMemo(() => {
    return vaccines.filter(v => {
      const matchesCategory = filterCategory === 'All' || v.ageCategory === filterCategory || v.stage === filterCategory;
      const matchesSearch = searchQuery.trim() === '' ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.brand && v.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        v.stage.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [vaccines, filterCategory, searchQuery]);

  // Unique categories / stages for filter tabs
  const categories = ['All', 'Birth', 'Infant', 'Toddler', 'Childhood', 'Influenza', 'Pre-Teens', 'HPV'];

  // Calculate Amishi Age
  const currentAge = useMemo(() => {
    const dob = new Date(CHILD_PROFILE.dob);
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years} Yrs ${months} Mos`;
  }, []);

  // Handlers
  const handleToggleStatus = (id) => {
    const updated = vaccines.map(v => {
      if (v.id === id) {
        const nextStatus = v.status === 'given' ? 'upcoming' : 'given';
        const nextGiven = nextStatus === 'given' ? (v.given || new Date().toISOString().slice(0, 10)) : '';
        return { ...v, status: nextStatus, given: nextGiven };
      }
      return v;
    });
    saveVaccines(updated);
    const target = vaccines.find(v => v.id === id);
    setToast({
      message: `${target?.name} marked as ${target?.status === 'given' ? 'UPCOMING' : 'COMPLETED ✓'}`,
      type: 'success'
    });
  };

  const handleDeleteVaccine = (id, e) => {
    if (e) e.stopPropagation();
    const target = vaccines.find(v => v.id === id);
    if (window.confirm(`Delete ${target?.name} record?`)) {
      const updated = vaccines.filter(v => v.id !== id);
      saveVaccines(updated);
      setToast({ message: `Deleted ${target?.name}`, type: 'success' });
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset Amishi's vaccination card back to official original record data?")) {
      saveVaccines(INITIAL_VACCINES, INITIAL_GROWTH_RECORDS);
      setToast({ message: "Reset to default vaccination card records", type: "success" });
    }
  };

  const handleOpenEditModal = (vaccine) => {
    setEditingVaccine(vaccine);
    setFormData({
      name: vaccine.name,
      stage: vaccine.stage,
      ageCategory: vaccine.ageCategory || 'Childhood',
      due: vaccine.due || '',
      given: vaccine.given || '',
      status: vaccine.status || 'given',
      brand: vaccine.brand || '',
      batchNo: vaccine.batchNo || '',
      notes: vaccine.notes || '',
      weight: vaccine.weight || '',
      height: vaccine.height || '',
      headCircum: vaccine.headCircum || ''
    });
    setModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingVaccine(null);
    setFormData({
      name: '',
      stage: '5 Years',
      ageCategory: 'Childhood',
      due: new Date().toISOString().slice(0, 10),
      given: new Date().toISOString().slice(0, 10),
      status: 'given',
      brand: '',
      batchNo: '',
      notes: '',
      weight: '',
      height: '',
      headCircum: ''
    });
    setModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    let updatedVaccines = [...vaccines];
    let updatedGrowth = [...growthRecords];

    if (editingVaccine) {
      updatedVaccines = vaccines.map(v => v.id === editingVaccine.id ? {
        ...v,
        name: formData.name,
        stage: formData.stage,
        ageCategory: formData.ageCategory,
        due: formData.due,
        given: formData.given,
        status: formData.status,
        brand: formData.brand,
        batchNo: formData.batchNo,
        notes: formData.notes,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        headCircum: formData.headCircum ? parseFloat(formData.headCircum) : undefined
      } : v);
    } else {
      const newVaccine = {
        id: `v_${Date.now()}`,
        name: formData.name,
        stage: formData.stage,
        ageCategory: formData.ageCategory,
        due: formData.due,
        given: formData.given,
        status: formData.status,
        brand: formData.brand,
        batchNo: formData.batchNo,
        notes: formData.notes,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        headCircum: formData.headCircum ? parseFloat(formData.headCircum) : undefined
      };
      updatedVaccines = [newVaccine, ...vaccines];
    }

    // If growth weight/height provided, update or push to growth records
    if (formData.weight || formData.height) {
      const gDate = formData.given || formData.due || new Date().toISOString().slice(0, 10);
      const existingGIndex = updatedGrowth.findIndex(g => g.date === gDate);
      const gObj = {
        date: gDate,
        ageLabel: formData.stage,
        weight: parseFloat(formData.weight) || (existingGIndex >= 0 ? updatedGrowth[existingGIndex].weight : undefined),
        height: parseFloat(formData.height) || (existingGIndex >= 0 ? updatedGrowth[existingGIndex].height : undefined),
        headCircum: parseFloat(formData.headCircum) || (existingGIndex >= 0 ? updatedGrowth[existingGIndex].headCircum : undefined)
      };
      if (existingGIndex >= 0) {
        updatedGrowth[existingGIndex] = { ...updatedGrowth[existingGIndex], ...gObj };
      } else {
        updatedGrowth = [...updatedGrowth, gObj].sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    }

    saveVaccines(updatedVaccines, updatedGrowth);
    setModalOpen(false);
    setToast({
      message: editingVaccine ? `Updated ${formData.name}` : `Added new vaccine record for ${formData.name}`,
      type: 'success'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* ── Amishi Childhood Hero Card Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #0f172a 100%)',
        borderRadius: 24,
        padding: '28px',
        color: '#ffffff',
        boxShadow: '0 16px 40px rgba(236, 72, 153, 0.25)',
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
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #f43f5e, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(244, 63, 94, 0.4)',
              fontSize: '1.8rem',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              👶
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  Amishi's Immunization & Health Record
                </h1>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  backdropFilter: 'blur(4px)',
                  padding: '3px 12px',
                  borderRadius: 99,
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {currentAge}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#fbcfe8' }}>
                DOB: <strong>24 March 2021</strong> | Blood Group: <strong style={{ color: '#fff' }}>AB+</strong> | Mode: <strong>L.S.C.S.</strong>
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {isAuthorized && (
              <button
                onClick={handleOpenNewModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 20px',
                  borderRadius: 14,
                  background: '#ffffff',
                  color: '#be185d',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={18} /> Log Vaccine / Metric
              </button>
            )}
            {isAuthorized && (
              <button
                onClick={handleResetDefaults}
                title="Reset to official record card data"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '11px 16px',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} /> Reset Default Card
              </button>
            )}
          </div>
        </div>

        {/* Hospital Card Metadata Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginTop: 24,
          paddingTop: 18,
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#fbcfe8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Hospital of Birth</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginTop: 2 }}>🏥 {CHILD_PROFILE.hospital}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#fbcfe8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Birth Physical Vitals</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginTop: 2 }}>⚖️ 3.4 kg | 📏 47 cm | 🧠 35 cm</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#fbcfe8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Neonatal Screening & OAE</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fef08a', marginTop: 2 }}>✓ Normal (N) / Screening Done</div>
          </div>
        </div>
      </div>

      {/* ── 4 Overview Metric Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {/* Total Immunization Status */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Immunization Progress</span>
            <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>{stats.completionRate}% Complete</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            {stats.completed} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>/ {stats.total} Doses</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
            ✓ All core childhood boosters up to 5 yrs given
          </div>
        </div>

        {/* Next Due Vaccination */}
        <div style={{ background: stats.nextVaccine ? '#fff7ed' : '#ffffff', borderRadius: 20, padding: '20px', border: stats.nextVaccine ? '1px solid #ffedd5' : '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Next Booster Due</span>
            <span style={{ background: '#ffedd5', color: '#ea580c', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>⏰ Upcoming</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stats.nextVaccine ? stats.nextVaccine.name : 'All up to date'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700 }}>
            {stats.nextVaccine ? `Scheduled for ${stats.nextVaccine.due} (${stats.nextVaccine.stage})` : 'No immediate pending doses'}
          </div>
        </div>

        {/* Latest Recorded Weight */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Recorded Weight Growth</span>
            <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>+6.2 kg</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px' }}>
            9.6 kg <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>(from 3.4 kg)</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Card record at 10 months milestone
          </div>
        </div>

        {/* Vaccines Vault Brands */}
        <div style={{ background: '#ffffff', borderRadius: 20, padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Certified Brands Logged</span>
            <span style={{ background: '#f3e8ff', color: '#9333ea', padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>8 Brands</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '8px 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Hexaxim, Pentaxim, Prevenar
          </div>
          <div style={{ fontSize: '0.78rem', color: '#9333ea', fontWeight: 600 }}>
            Tybar-TCV, Nexipox, Fluarix, Adacel
          </div>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '2px solid #e2e8f0', paddingBottom: 8 }}>
        <button
          onClick={() => setActiveSubTab('vaccines')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeSubTab === 'vaccines' ? '#ec4899' : 'transparent',
            color: activeSubTab === 'vaccines' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Syringe size={16} /> Vaccination Schedule ({filteredVaccines.length})
        </button>

        <button
          onClick={() => setActiveSubTab('growth')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeSubTab === 'growth' ? '#8b5cf6' : 'transparent',
            color: activeSubTab === 'growth' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <TrendingUp size={16} /> Growth Metrics & Vitals
        </button>

        <button
          onClick={() => setActiveSubTab('vault')}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeSubTab === 'vault' ? '#0284c7' : 'transparent',
            color: activeSubTab === 'vault' ? '#ffffff' : '#64748b',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <ShieldCheck size={16} /> Vaccine Brands Vault
        </button>
      </div>

      {/* ── SUB TAB 1: VACCINATION SCHEDULE ── */}
      {activeSubTab === 'vaccines' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Filters & Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 99,
                    border: '1px solid',
                    borderColor: filterCategory === cat ? '#ec4899' : '#cbd5e1',
                    background: filterCategory === cat ? '#fce7f3' : '#ffffff',
                    color: filterCategory === cat ? '#be185d' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="🔍 Search vaccine, brand or stage..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                width: 240
              }}
            />
          </div>

          {/* Table of Vaccines */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', borderRadius: '8px 0 0 8px' }}>Age Stage</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Vaccine Name</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Brand / Sticker</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Due Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Given Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                    {isAuthorized && <th style={{ padding: '12px 14px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredVaccines.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}>
                          {v.stage}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{v.name}</div>
                        {v.notes && <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>{v.notes}</div>}
                        {v.weight && <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: 4, marginRight: 6, fontWeight: 700 }}>Wt: {v.weight} kg</span>}
                        {v.height && <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Ht: {v.height} cm</span>}
                      </td>
                      <td style={{ padding: '14px' }}>
                        {v.brand ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.82rem' }}>{v.brand}</span>
                            {v.batchNo && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Batch: {v.batchNo}</span>}
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {v.due || '-'}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center', color: v.status === 'given' ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
                        {v.given || '-'}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <button
                          onClick={() => isAuthorized && handleToggleStatus(v.id)}
                          style={{
                            border: 'none',
                            background: v.status === 'given' ? '#dcfce7' : '#ffedd5',
                            color: v.status === 'given' ? '#16a34a' : '#c2410c',
                            padding: '5px 14px',
                            borderRadius: 99,
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            cursor: isAuthorized ? 'pointer' : 'default'
                          }}
                        >
                          {v.status === 'given' ? '✓ GIVEN' : '⏰ UPCOMING'}
                        </button>
                      </td>
                      {isAuthorized && (
                        <td style={{ padding: '14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditModal(v)}
                              title="Edit record"
                              style={{ border: 'none', background: '#f1f5f9', color: '#475569', padding: '6px', borderRadius: 8, cursor: 'pointer' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteVaccine(v.id, e)}
                              title="Delete record"
                              style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '6px', borderRadius: 8, cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* ── SUB TAB 2: GROWTH METRICS & VITALS CHART ── */}
      {activeSubTab === 'growth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Weight Growth Chart */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Weight Growth Trajectory (kg)</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Childhood weight progression recorded on vaccination visits</p>
              </div>
              <span style={{ background: '#ecfdf5', color: '#047857', padding: '4px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 800 }}>Birth 3.4kg ➔ 9.6kg (10 Mos)</span>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={growthRecords} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ageLabel" tick={{ fontSize: 11 }} />
                <YAxis unit="kg" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} />
                <Line type="monotone" dataKey="weight" stroke="#ec4899" strokeWidth={3} dot={{ r: 6, fill: '#be185d' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Height & Head Circumference Chart */}
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Height (cm) & Head Circumference (cm)</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Pediatric physical development tracking</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={growthRecords} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ageLabel" tick={{ fontSize: 11 }} />
                <YAxis unit="cm" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => [`${v} cm`, name === 'height' ? 'Height' : 'Head Circumference']} />
                <Line type="monotone" dataKey="height" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#6d28d9' }} name="height" />
                <Line type="monotone" dataKey="headCircum" stroke="#0284c7" strokeWidth={3} dot={{ r: 5, fill: '#0369a1' }} name="headCircum" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── SUB TAB 3: VACCINE BRANDS VAULT ── */}
      {activeSubTab === 'vault' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>💉</span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Hexaxim (Sanofi Pasteur)</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              6-in-1 fully liquid hexavalent vaccine protecting against DTP, Hepatitis B, Polio (IPV), and HiB.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>🛡️</span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Pentaxim (Sanofi Pasteur)</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              5-in-1 pentavalent vaccine protecting against Diphtheria, Tetanus, Pertussis, Polio, and Haemophilus Influenzae type B.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>🦠</span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Prevenar 13 (Pfizer / Wyeth)</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Pneumococcal 13-valent conjugate vaccine preventing pneumonia, meningitis, and bacteremia.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>💧</span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Rotavac (Bharat Biotech)</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Oral rotavirus vaccine protecting infants against severe rotavirus gastroenteritis and diarrhea.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>🏷️</span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Tybar-TCV (Bharat Biotech)</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Typhoid Conjugate Vaccine giving long-term immunity against Salmonella Typhi (Batch #76C20046A).
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>⭐</span>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Nexipox (Chickenpox)</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Live attenuated Varicella Zoster virus vaccine protecting against chickenpox (Batch #202105051-2).
            </p>
          </div>
        </div>
      )}

      {/* ── Add / Edit Vaccine Modal ── */}
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
            maxWidth: 520,
            padding: 28,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                {editingVaccine ? 'Edit Vaccine Record' : 'Log Vaccine / Health Visit'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Vaccine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Varicella 2 / Annual Flu"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Age Stage</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Years / 15 Months"
                    value={formData.stage}
                    onChange={e => setFormData({ ...formData, stage: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category</label>
                  <select
                    value={formData.ageCategory}
                    onChange={e => setFormData({ ...formData, ageCategory: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Due Date</label>
                  <input
                    type="date"
                    value={formData.due}
                    onChange={e => setFormData({ ...formData, due: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Given Date</label>
                  <input
                    type="date"
                    value={formData.given}
                    onChange={e => setFormData({ ...formData, given: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Brand / Sticker Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Hexaxim / Fluarix"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Batch / Lot No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 76C20046A"
                    value={formData.batchNo}
                    onChange={e => setFormData({ ...formData, batchNo: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Vitals metrics optional */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8 }}>Vitals / Growth Metrics (Optional)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#475569' }}>Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 9.6"
                      value={formData.weight}
                      onChange={e => setFormData({ ...formData, weight: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#475569' }}>Height (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 74"
                      value={formData.height}
                      onChange={e => setFormData({ ...formData, height: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#475569' }}>Head (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 45"
                      value={formData.headCircum}
                      onChange={e => setFormData({ ...formData, headCircum: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                >
                  <option value="given">✓ Given / Administered</option>
                  <option value="upcoming">⏰ Upcoming / Due</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Notes</label>
                <textarea
                  placeholder="Doctor's recommendations, reactions or comments..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
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
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #ec4899, #be185d)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Record
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
