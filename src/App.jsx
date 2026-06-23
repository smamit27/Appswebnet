import { useCallback, useEffect, useState } from 'react';
import './styles.css';

// Hooks
import { useAuth } from './hooks/useAuth.js';
import { useCollection } from './hooks/useCollection.js';

// Organisms
import AuthModal        from './components/organisms/AuthModal.jsx';
import OverviewDashboard from './components/organisms/OverviewDashboard.jsx';
import SwetaFinance     from './components/organisms/SwetaFinance.jsx';
import AmishiGym        from './components/organisms/AmishiGym.jsx';
import AmishiActivity   from './components/organisms/AmishiActivity.jsx';
import FamilyCalendar   from './components/organisms/FamilyCalendar.jsx';

import { db } from './firebase.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/* ── Tab Icons ─────────────────────────────────────────────────── */
const ICONS = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  finance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  gym: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  activity: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

/* ── Mock Fallback Data ─────────────────────────────────────────── */
const MOCK_FINANCE = [
  { id: 'm1', date: new Date().toISOString().slice(0,7)+'-01', type: 'Income',  category: 'Salary',    amount: 85000, note: 'June salary' },
  { id: 'm2', date: new Date().toISOString().slice(0,7)+'-05', type: 'Expense', category: 'Groceries', amount: 4500,  note: 'D-Mart' },
  { id: 'm3', date: new Date().toISOString().slice(0,7)+'-10', type: 'Expense', category: 'Utilities',  amount: 2200,  note: 'Electricity + internet' },
  { id: 'm4', date: new Date().toISOString().slice(0,7)+'-15', type: 'Expense', category: 'Dining',    amount: 1800,  note: 'Family dinner' },
  { id: 'm5', date: new Date().toISOString().slice(0,7)+'-20', type: 'Income',  category: 'Freelance', amount: 15000, note: 'Project payment' },
];
const MOCK_GYM = [
  { id: 'g1', date: new Date().toISOString().slice(0,10), type: 'Strength', duration: 50, calories: 320, notes: 'Chest + triceps' },
  { id: 'g2', date: new Date(Date.now()-86400000).toISOString().slice(0,10), type: 'Cardio', duration: 35, calories: 280, notes: '5km run' },
  { id: 'g3', date: new Date(Date.now()-2*86400000).toISOString().slice(0,10), type: 'Yoga', duration: 45, calories: 150, notes: 'Morning yoga flow' },
];
const MOCK_ACTIVITY = [];
const MOCK_CALENDAR = [
  { id: 'c1', date: new Date(Date.now()+3*86400000).toISOString().slice(0,10), title: "Amishi's School Play", tag: 'amishi', time: '18:00', note: 'Annual day event' },
  { id: 'c2', date: new Date(Date.now()+7*86400000).toISOString().slice(0,10), title: 'Family Dinner Out',   tag: 'family', time: '19:30', note: 'Birthday celebration' },
];

export default function App() {
  const { user, isAuthorized, signInWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab]           = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Firestore collections
  const finance  = useCollection('finance/sweta/transactions',  MOCK_FINANCE,  user);
  const gym      = useCollection('activities/amishi/gym',       MOCK_GYM,      user);
  const activity = useCollection('activities/amishi/daily',     MOCK_ACTIVITY, user, 'date', 'desc');
  const calendar = useCollection('family/events',               MOCK_CALENDAR, user, 'date', 'asc');

  const handleTabChange = useCallback((tabId) => {
    if (tabId === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsSidebarOpen(false);
      setIsTransitioning(false);
    }, 160);
  }, [activeTab]);

  // Save activity day (uses doc set instead of addDoc)
  const handleSaveActivityDay = async (data) => {
    if (!db || !user) return;
    const ref = doc(db, 'activities/amishi/daily', data.date);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp(), createdBy: user.uid }, { merge: true });
  };

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview',         group: 'Home' },
    { id: 'finance',  label: 'Sweta – Finance',  group: 'Sweta' },
    { id: 'gym',      label: 'Amishi – Gym',      group: 'Amishi' },
    { id: 'activity', label: 'Amishi – Activity', group: 'Amishi' },
    { id: 'calendar', label: 'Family Calendar',   group: 'Family' },
  ];

  const activeLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label || '';

  const userInitials = user && !user.isAnonymous
    ? (user.displayName || user.email || 'U').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <div className={`dashboard-shell dashboard-shell--sidebar ${isSidebarCollapsed ? 'dashboard-shell--collapsed' : ''}`}>
        <div className="backdrop backdrop--top" />
        <div className="backdrop backdrop--bottom" />
        <div className="backdrop backdrop--purple" />

        {/* Mobile overlay */}
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className={`sidebar ${isSidebarOpen ? 'sidebar--open' : ''} ${isSidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
          {/* Brand */}
          <div className="sidebar__brand">
            <div className="sidebar__logo">🏠</div>
            {!isSidebarCollapsed && (
              <div className="sidebar__brand-text">
                <p className="sidebar__kicker">Personal Hub</p>
                <h2 className="sidebar__title">Family Dashboard</h2>
              </div>
            )}
            <button
              className="sidebar-collapse-toggle"
              onClick={() => setIsSidebarCollapsed(c => !c)}
              title={isSidebarCollapsed ? 'Expand' : 'Collapse'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>

          {/* User */}
          <div className="sidebar__user" onClick={() => setIsAuthModalOpen(true)} title="Account">
            <div className="sidebar__avatar">
              {user?.photoURL
                ? <img src={user.photoURL} alt="avatar" />
                : userInitials}
            </div>
            {!isSidebarCollapsed && (
              <div>
                <div className="sidebar__user-name">
                  {user && !user.isAnonymous ? (user.displayName?.split(' ')[0] || 'User') : 'Guest'}
                </div>
                <div className="sidebar__user-role">
                  {isAuthorized ? '✅ Full Access' : user && !user.isAnonymous ? '⚠️ Restricted' : 'Sign in to edit'}
                </div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="sidebar__nav" role="tablist" aria-orientation="vertical">
            {['Home', 'Sweta', 'Amishi', 'Family'].map(group => (
              <div key={group}>
                <div className="sidebar-group-header">{group}</div>
                {NAV_ITEMS.filter(n => n.group === group).map(item => (
                  <button
                    key={item.id}
                    id={`tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === item.id}
                    aria-controls={`panel-${item.id}`}
                    className={`sidebar-item ${activeTab === item.id ? 'sidebar-item--active' : ''}`}
                    onClick={() => handleTabChange(item.id)}
                    title={isSidebarCollapsed ? item.label : ''}
                  >
                    <span className="sidebar-item__icon">{ICONS[item.id]}</span>
                    {!isSidebarCollapsed && <span className="sidebar-item__label">{item.label}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Bottom: Firebase sync status */}
          {!isSidebarCollapsed && (
            <div style={{ marginTop: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '8px 0' }}>
              {finance.source === 'firebase' ? '🟢 Firebase synced' : '🟡 Preview mode'}
            </div>
          )}
        </aside>

        {/* ── Main Panel ── */}
        <main className="main-panel">
          {/* Mobile Header */}
          <div className="mobile-header">
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h2>{activeLabel}</h2>
          </div>

          {/* Tab Content */}
          <div
            id={`panel-${activeTab}`}
            className={`tab-content-panel ${isTransitioning ? 'tab-content-panel--exit' : ''}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'overview' && (
              <OverviewDashboard
                financeItems={finance.items}
                gymItems={gym.items}
                activityItems={activity.items}
                calendarItems={calendar.items}
              />
            )}
            {activeTab === 'finance' && (
              <SwetaFinance
                items={finance.items}
                isAuthorized={isAuthorized}
                onAdd={finance.add}
                onDelete={finance.remove}
              />
            )}
            {activeTab === 'gym' && (
              <AmishiGym
                items={gym.items}
                isAuthorized={isAuthorized}
                onAdd={gym.add}
                onDelete={gym.remove}
              />
            )}
            {activeTab === 'activity' && (
              <AmishiActivity
                items={activity.items}
                isAuthorized={isAuthorized}
                onSaveDay={handleSaveActivityDay}
              />
            )}
            {activeTab === 'calendar' && (
              <FamilyCalendar
                items={calendar.items}
                isAuthorized={isAuthorized}
                onAdd={calendar.add}
                onDelete={calendar.remove}
              />
            )}
          </div>
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        isAuthorized={isAuthorized}
        onSignIn={signInWithGoogle}
        onSignOut={logout}
      />
    </>
  );
}
