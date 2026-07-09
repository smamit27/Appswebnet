import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

/* ─── Mock Data ──────────────────────────────────────────────────── */
const SWETA_DOCUMENTS = [
  {
    id: 1,
    docType: 'Aadhar Card',
    category: 'Identity Proof',
    docNumber: '877321034057',
    issueDate: '12 Jun 2013',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '10 Jul 2026, 10:30 AM',
  },
  {
    id: 2,
    docType: 'Passport',
    category: 'Identity Proof',
    docNumber: 'P9876543',
    issueDate: '20 Feb 2021',
    expiryDate: '19 Feb 2031',
    daysLeft: 4 * 365,
    status: 'Verified',
    lastUpdated: '11 Jul 2026, 09:15 AM',
  },
  {
    id: 3,
    docType: 'PAN Card',
    category: 'Identity Proof',
    docNumber: 'BQAPG6879G',
    issueDate: '15 Aug 2020',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '10 Jul 2026, 11:20 AM',
  },
  {
    id: 4,
    docType: 'Voter ID',
    category: 'Identity Proof',
    docNumber: 'WGX0605691',
    issueDate: '10 Jan 2019',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '10 Jul 2026, 10:45 AM',
  },
  {
    id: 5,
    docType: 'UAN (Earlier)',
    category: 'Employment Proof',
    docNumber: '100618949449',
    issueDate: '25 Mar 2015',
    expiryDate: null,
    status: 'Inactive',
    lastUpdated: '09 Jul 2026, 04:20 PM',
  },
  {
    id: 6,
    docType: 'UAN (Current)',
    category: 'Employment Proof',
    docNumber: '100888425552',
    issueDate: '14 Jun 2022',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '09 Jul 2026, 04:25 PM',
  },
  {
    id: 7,
    docType: 'Address Proof',
    category: 'Utility Bill',
    docNumber: '—',
    issueDate: '05 Mar 2026',
    expiryDate: '04 Mar 2027',
    daysLeft: 240,
    status: 'Expiring Soon',
    lastUpdated: '08 Jul 2026, 02:10 PM',
  },
];

const AMIT_DOCUMENTS = [
  {
    id: 1,
    docType: 'Aadhar Card',
    category: 'Identity Proof',
    docNumber: '597428568371',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '10 Jul 2026, 09:00 AM',
  },
  {
    id: 2,
    docType: 'PAN Card',
    category: 'Identity Proof',
    docNumber: 'DQSPS8278H',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '10 Jul 2026, 09:10 AM',
  },
  {
    id: 3,
    docType: 'Passport',
    category: 'Identity Proof',
    docNumber: 'M6957774',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '11 Jul 2026, 08:45 AM',
  },
  {
    id: 4,
    docType: 'Passport File No.',
    category: 'Identity Proof',
    docNumber: 'LK2068000496014',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '11 Jul 2026, 08:50 AM',
  },
  {
    id: 5,
    docType: "Driver's License",
    category: 'Identity Proof',
    docNumber: 'UP7820150024046',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '10 Jul 2026, 10:00 AM',
  },
  {
    id: 6,
    docType: 'Voter ID',
    category: 'Identity Proof',
    docNumber: 'TMS2730232',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '10 Jul 2026, 10:05 AM',
  },
  {
    id: 7,
    docType: 'PRAN',
    category: 'Employment Proof',
    docNumber: '110128446556',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '09 Jul 2026, 04:45 PM',
  },
  {
    id: 8,
    docType: 'UAN',
    category: 'Employment Proof',
    docNumber: '100708995548',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '09 Jul 2026, 05:00 PM',
  },
  {
    id: 9,
    docType: 'GPN Access',
    category: 'Others',
    docNumber: '1475',
    issueDate: '—',
    expiryDate: null,
    status: 'Verified',
    lastUpdated: '08 Jul 2026, 03:00 PM',
  },
];

const AMISHI_DOCUMENTS = [
  {
    id: 1,
    docType: 'Aadhar Card',
    category: 'Identity Proof',
    docNumber: '—',
    issueDate: '—',
    expiryDate: null,
    status: 'Pending',
    lastUpdated: '—',
  },
  {
    id: 2,
    docType: 'PAN Card',
    category: 'Identity Proof',
    docNumber: '—',
    issueDate: '—',
    expiryDate: null,
    status: 'Pending',
    lastUpdated: '—',
  },
  {
    id: 3,
    docType: 'Passport',
    category: 'Identity Proof',
    docNumber: '—',
    issueDate: '—',
    expiryDate: null,
    status: 'Pending',
    lastUpdated: '—',
  },
  {
    id: 4,
    docType: 'Birth Certificate',
    category: 'Identity Proof',
    docNumber: '—',
    issueDate: '—',
    expiryDate: null,
    status: 'Pending',
    lastUpdated: '—',
  },
];

const PERSONS = [
  {
    key: 'sweta',
    name: 'Sweta Gupta',
    initials: 'SG',
    pan: 'BQAPG6879G',
    aadhar: '8773 2103 4057',
    voterId: 'WGX0605691',
    uan: '100888425552',
    documents: SWETA_DOCUMENTS,
  },
  {
    key: 'amit',
    name: 'Amit Singh',
    initials: 'AS',
    pan: 'DQSPS8278H',
    aadhar: '5974 2856 8371',
    voterId: 'TMS2730232',
    uan: '100708995548',
    documents: AMIT_DOCUMENTS,
  },
  {
    key: 'amishi',
    name: 'Amishi',
    initials: 'AM',
    pan: '—',
    aadhar: '—',
    voterId: '—',
    uan: '—',
    documents: AMISHI_DOCUMENTS,
  },
];

const RECENT_ACTIVITY = [
  { id: 1, text: 'Passport verified by Admin', date: '11 Jul 2026, 09:15 AM', icon: '🛂' },
  { id: 2, text: 'Aadhar Card verified by Admin', date: '10 Jul 2025, 10:30 AM', icon: '🪪' },
  { id: 3, text: 'UAN (Current) uploaded', date: '09 Jul 2026, 04:25 PM', icon: '📤' },
];

/* ─── SVG Icons ─────────────────────────────────────────────────── */
const IconSearch = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconBell = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconUpload = () => (
  <svg width="28" height="28" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IconFilter = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconDoc = (category) => {
  const map = {
    'Identity Proof': '🪪',
    'Employment Proof': '👷',
    'Utility Bill': '📄',
  };
  return map[category] || '📋';
};

/* ─── Status Badge ───────────────────────────────────────────────── */
const STATUS_STYLES = {
  Verified:        { bg: '#e6f9f0', color: '#1a7a4a', dot: '#22c55e' },
  'Expiring Soon': { bg: '#fff7e6', color: '#b45309', dot: '#f59e0b' },
  Inactive:        { bg: '#eef2ff', color: '#4338ca', dot: '#6366f1' },
  Expired:         { bg: '#fff1f2', color: '#be123c', dot: '#ef4444' },
  Pending:         { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Verified;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color, fontWeight: 600,
      fontSize: '0.78rem', padding: '4px 12px', borderRadius: '20px',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
const TABS = ['All Documents', 'Identity Proof', 'Address Proof', 'Employment Proof', 'Others'];

export default function DocumentTracker() {
  const [activeTab, setActiveTab] = useState('All Documents');
  const [search, setSearch] = useState('');
  const [activePerson, setActivePerson] = useState('sweta');

  const person = PERSONS.find(p => p.key === activePerson);
  const DOCUMENTS = person.documents;

  const filteredDocs = useMemo(() => {
    let docs = [...DOCUMENTS];
    if (activeTab !== 'All Documents') {
      docs = docs.filter(d => d.category === activeTab || (activeTab === 'Others' && !['Identity Proof', 'Employment Proof'].includes(d.category)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(d => d.docType.toLowerCase().includes(q) || d.docNumber.toLowerCase().includes(q));
    }
    return docs;
  }, [activeTab, search, activePerson]);

  const verified    = DOCUMENTS.filter(d => d.status === 'Verified').length;
  const expiringSoon = DOCUMENTS.filter(d => d.status === 'Expiring Soon').length;
  const expired     = DOCUMENTS.filter(d => d.status === 'Expired').length;

  const donutData = [
    { name: 'Verified',      value: verified,     color: '#22c55e' },
    { name: 'Expiring Soon', value: expiringSoon,  color: '#f59e0b' },
    { name: 'Expired',       value: expired,       color: '#ef4444' },
  ].filter(d => d.value > 0);

  /* ── Styles ── */
  const s = {
    wrap: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: '#f8f9fc',
      minHeight: '100%',
      borderRadius: '16px',
      overflow: 'hidden',
      color: '#111827',
    },
    topBar: {
      background: '#fff',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      borderBottom: '1px solid #e5e7eb',
    },
    breadcrumb: { fontSize: '0.85rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' },
    breadActive: { color: '#111827', fontWeight: 600 },
    searchWrap: {
      marginLeft: 'auto',
      position: 'relative', display: 'flex', alignItems: 'center',
    },
    searchInput: {
      padding: '8px 14px 8px 36px',
      border: '1px solid #e5e7eb', borderRadius: '8px',
      fontSize: '0.85rem', outline: 'none', width: '220px', background: '#f9fafb',
    },
    searchIcon: { position: 'absolute', left: '12px', color: '#9ca3af' },
    notifBtn: {
      position: 'relative', background: '#f3f4f6', border: 'none', borderRadius: '8px',
      width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: '#374151',
    },
    badge: {
      position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444',
      color: '#fff', fontSize: '0.65rem', width: '16px', height: '16px',
      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
    },
    avatar: {
      width: '36px', height: '36px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff', fontWeight: 700, fontSize: '0.85rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    userName: { fontSize: '0.85rem', fontWeight: 600, color: '#111827' },
    userRole: { fontSize: '0.72rem', color: '#6b7280' },
    body: { padding: '20px 24px', display: 'grid', gap: '20px' },
    profileRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    profileCard: {
      background: '#fff', borderRadius: '12px', padding: '20px 24px',
      border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px', flex: '0 0 auto',
    },
    profileAvatar: {
      width: '60px', height: '60px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: '#fff', fontWeight: 700, fontSize: '1.4rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    profileName: { fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' },
    profileMeta: { fontSize: '0.8rem', color: '#6b7280', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' },
    activeBadge: { background: '#d1fae5', color: '#065f46', fontSize: '0.72rem', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 },
    statCard: (accent) => ({
      background: '#fff', borderRadius: '12px', padding: '16px 20px',
      border: '1px solid #e5e7eb', flex: '1 1 120px', minWidth: '110px',
    }),
    statNum: (accent) => ({ fontSize: '1.8rem', fontWeight: 700, color: accent }),
    statLabel: { fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' },
    tableCard: { background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' },
    tabRow: { display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb', padding: '0 20px', overflowX: 'auto' },
    tab: (active) => ({
      padding: '14px 16px',
      fontWeight: active ? 600 : 400,
      fontSize: '0.875rem',
      color: active ? '#2563eb' : '#6b7280',
      borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
      background: 'none',
      border: 'none',
      borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s',
    }),
    actionRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 20px', borderBottom: '1px solid #f3f4f6',
    },
    filterBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '7px 14px', borderRadius: '7px', border: '1px solid #e5e7eb',
      fontSize: '0.8rem', background: '#fff', cursor: 'pointer', color: '#374151',
    },
    uploadBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '8px 16px', borderRadius: '8px', border: 'none',
      fontSize: '0.85rem', background: '#2563eb', cursor: 'pointer', color: '#fff', fontWeight: 600,
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.855rem' },
    th: { textAlign: 'left', padding: '12px 16px', color: '#6b7280', fontWeight: 600, fontSize: '0.78rem', borderBottom: '1px solid #f3f4f6', background: '#fafafa' },
    td: { padding: '14px 16px', borderBottom: '1px solid #f3f4f6', color: '#374151', verticalAlign: 'middle' },
    docIcon: { fontSize: '1.4rem', marginRight: '10px', lineHeight: 1 },
    docName: { fontWeight: 600, color: '#111827' },
    docSub: { fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' },
    monoNum: { fontFamily: 'monospace', fontSize: '0.875rem', color: '#374151' },
    actionBtn: {
      background: '#f3f4f6', border: 'none', borderRadius: '6px',
      width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', cursor: 'pointer', color: '#374151',
    },
    bottomRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
    bottomCard: {
      background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
      padding: '20px',
    },
    sectionTitle: { fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: '16px' },
    activityItem: { display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'flex-start' },
    activityIcon: {
      width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
    },
    activityText: { fontWeight: 500, fontSize: '0.82rem', color: '#374151' },
    activityDate: { fontSize: '0.73rem', color: '#9ca3af', marginTop: '2px' },
    viewAll: { fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', cursor: 'pointer' },
    uploadZone: {
      border: '2px dashed #d1d5db', borderRadius: '10px', padding: '24px',
      textAlign: 'center', color: '#9ca3af',
    },
    uploadSubText: { fontSize: '0.78rem', marginTop: '6px' },
    browseBtn: {
      marginTop: '12px', padding: '7px 18px', borderRadius: '7px',
      border: '1px solid #2563eb', background: '#fff', color: '#2563eb',
      fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
    },
    donutLegend: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' },
    legendRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' },
    legendDot: (c) => ({ width: '10px', height: '10px', borderRadius: '50%', background: c, display: 'inline-block', marginRight: '8px' }),
  };

  const expiryLabelMap = {
    'Expiring Soon': <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.8rem' }}>11 months left</span>,
  };

  return (
    <div style={s.wrap}>

      {/* ── Body ── */}
      <div style={s.body}>

        {/* ── Top Actions Row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Person Selector */}
          <div style={{ display: 'flex', gap: '8px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
            {PERSONS.map(p => (
              <button
                key={p.key}
                onClick={() => { setActivePerson(p.key); setActiveTab('All Documents'); setSearch(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 16px', borderRadius: '8px', border: 'none',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  background: activePerson === p.key ? '#fff' : 'transparent',
                  color: activePerson === p.key ? '#111827' : '#6b7280',
                  boxShadow: activePerson === p.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: activePerson === p.key ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#d1d5db',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{p.initials}</div>
                {p.name}
              </button>
            ))}
          </div>
          <button style={s.uploadBtn}>+ Upload Document</button>
        </div>

        {/* ── Profile + Stats Row ── */}
        <div style={s.profileRow}>
          <div style={s.profileCard}>
            <div style={s.profileAvatar}>{person.initials}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={s.profileName}>{person.name}</p>
                <span style={s.activeBadge}>Active</span>
              </div>
              <div style={s.profileMeta}>
                <span>PAN: {person.pan}</span>
                <span>|</span>
                <span>Aadhar: {person.aadhar}</span>
              </div>
              <div style={{ ...s.profileMeta, marginTop: '6px' }}>
                <span>Voter ID: {person.voterId}</span>
                <span>|</span>
                <span>UAN: {person.uan}</span>
              </div>
            </div>
          </div>

          <div style={s.statCard()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem' }}>📄</span>
              <div style={{ ...s.statNum(), color: '#111827', fontSize: '1.5rem' }}>{DOCUMENTS.length}</div>
            </div>
            <div style={s.statLabel}>Total Documents</div>
          </div>

          <div style={s.statCard()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem', color: '#22c55e' }}>✅</span>
              <div style={{ ...s.statNum(), color: '#22c55e', fontSize: '1.5rem' }}>{verified}</div>
            </div>
            <div style={s.statLabel}>Verified</div>
          </div>

          <div style={s.statCard()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem', color: '#f59e0b' }}>⏰</span>
              <div style={{ ...s.statNum(), color: '#f59e0b', fontSize: '1.5rem' }}>{expiringSoon}</div>
            </div>
            <div style={s.statLabel}>Expiring Soon</div>
          </div>

          <div style={s.statCard()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem', color: '#ef4444' }}>⚠️</span>
              <div style={{ ...s.statNum(), color: '#ef4444', fontSize: '1.5rem' }}>{expired}</div>
            </div>
            <div style={s.statLabel}>Expired</div>
          </div>
        </div>

        {/* ── Document Table ── */}
        <div style={s.tableCard}>
          {/* Tabs */}
          <div style={s.tabRow}>
            {TABS.map(t => (
              <button key={t} style={s.tab(activeTab === t)} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '4px' }}>
              <button style={s.filterBtn}><IconFilter /> Status ▾</button>
              <button style={s.filterBtn}><IconFilter /> Document Type ▾</button>
              <button style={{ ...s.filterBtn, border: '1px solid #d1d5db' }}>⬇ Download All</button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Document Type</th>
                  <th style={s.th}>Document Number</th>
                  <th style={s.th}>Issue Date</th>
                  <th style={s.th}>Expiry Date</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Last Updated</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                      No documents found.
                    </td>
                  </tr>
                ) : filteredDocs.map(doc => (
                  <tr key={doc.id} style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={s.docIcon}>{IconDoc(doc.category)}</span>
                        <div>
                          <div style={s.docName}>{doc.docType}</div>
                          <div style={s.docSub}>{doc.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.monoNum}>{doc.docNumber}</span></td>
                    <td style={s.td}>{doc.issueDate}</td>
                    <td style={s.td}>
                      {doc.expiryDate ? (
                        <div>
                          <div>{doc.expiryDate}</div>
                          {doc.daysLeft && (
                            <div style={{ color: doc.status === 'Expiring Soon' ? '#f59e0b' : '#22c55e', fontSize: '0.78rem', fontWeight: 600, marginTop: '2px' }}>
                              {doc.status === 'Expiring Soon' ? '11 months left' : `${Math.round(doc.daysLeft / 365)} yrs left`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={s.td}><StatusBadge status={doc.status} /></td>
                    <td style={s.td}><span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{doc.lastUpdated}</span></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={s.actionBtn} title="View"><IconEye /></button>
                        <button style={s.actionBtn} title="Download"><IconDownload /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div style={s.bottomRow}>

          {/* Donut Chart */}
          <div style={s.bottomCard}>
            <div style={s.sectionTitle}>Document Expiry Summary</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.8rem' }}
                  itemStyle={{ color: '#374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={s.donutLegend}>
              {donutData.map(d => (
                <div key={d.name} style={s.legendRow}>
                  <span><span style={s.legendDot(d.color)} />{d.name}</span>
                  <span style={{ fontWeight: 600 }}>{d.value} ({Math.round(d.value / DOCUMENTS.length * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={s.bottomCard}>
            <div style={s.sectionTitle}>Recent Activity</div>
            {RECENT_ACTIVITY.map(a => (
              <div key={a.id} style={s.activityItem}>
                <div style={s.activityIcon}>{a.icon}</div>
                <div>
                  <div style={s.activityText}>{a.text}</div>
                  <div style={s.activityDate}>{a.date}</div>
                </div>
              </div>
            ))}
            <div style={s.viewAll}>View All Activity <span>›</span></div>
          </div>

          {/* Quick Upload */}
          <div style={s.bottomCard}>
            <div style={s.sectionTitle}>Quick Upload</div>
            <div style={s.uploadZone}>
              <div><IconUpload /></div>
              <div style={{ fontSize: '0.85rem', color: '#374151', marginTop: '8px', fontWeight: 500 }}>Drag & drop files here</div>
              <div style={{ ...s.uploadSubText }}>or</div>
              <button style={s.browseBtn}>Browse Files</button>
              <div style={{ ...s.uploadSubText, marginTop: '12px' }}>Supported formats: PDF, JPG, PNG (Max. 10MB)</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
