import { useCallback, useEffect, useState } from 'react';
import './styles.css';

// Hooks
import { useAuth } from './hooks/useAuth.js';
import { useCollection } from './hooks/useCollection.js';

// Organisms
import AuthModal         from './components/organisms/AuthModal.jsx';
import OverviewDashboard from './components/organisms/OverviewDashboard.jsx';
import FinancePage       from './components/organisms/FinancePage.jsx';
import GymTracker        from './components/organisms/GymTracker.jsx';
import AmishiActivity    from './components/organisms/AmishiActivity.jsx';
import AmishiFees        from './components/organisms/AmishiFees.jsx';
import DietPlan          from './components/organisms/DietPlan.jsx';
import FamilyCalendar    from './components/organisms/FamilyCalendar.jsx';
import CleaningSchedule  from './components/organisms/CleaningSchedule.jsx';
import PurchasesTracker  from './components/organisms/PurchasesTracker.jsx';
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
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  amitGym: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  swetaGym: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
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
  cleaning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16Z"/>
      <path d="M12 12v6"/><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
    </svg>
  ),
  purchases: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  fees: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  diet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  ),
};

/* ── No Mock fallback data ─────────────────────────────────────────── */

/* ── Sidebar nav structure ──────────────────────────────────────── */
const NAV = [
  { group: 'Home',   items: [{ id: 'overview',  label: 'Overview'       }] },
  { group: 'Finance',items: [
    { id: 'finance',   label: 'Income & Expenses' },
    { id: 'purchases', label: 'Purchases Tracker' }
  ] },
  { group: 'Amit', items: [
    { id: 'amitDiet', label: 'Gym & Diet', iconId: 'diet' }
  ]},
  { group: 'Sweta', items: [
    { id: 'swetaDiet', label: 'Gym & Diet', iconId: 'diet' }
  ]},
  { group: 'Amishi', items: [
    { id: 'activity', label: 'Daily Activity' },
    { id: 'fees',     label: 'School Fees' }
  ]},
  { group: 'Family', items: [
    { id: 'calendar',  label: 'Family Calendar' },
    { id: 'cleaning',  label: 'Cleaning Schedule' }
  ] },
];

export default function App() {
  const { user, isAuthorized, signInWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab]           = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feesSession, setFeesSession]         = useState('2026-27');

  // Real-time Firestore collections
  const amitGym  = useCollection('activities/amit/gym',     [],   user);
  const swetaGym = useCollection('activities/sweta/gym',    [],   user);
  const activity = useCollection('activities/amishi/daily', [],   user, 'date', 'desc');
  const fees     = useCollection(feesSession === '2026-27' ? 'activities/amishi/fees' : `activities/amishi/fees_${feesSession.replace('-', '_')}`,  [],   user, 'id', 'asc');
  const calendar = useCollection('familyEvents',            [],   user, 'date', 'asc');

  // For the Overview we need a quick summary of finance — fetch latest month snapshot
  const [financeSnap, setFinanceSnap] = useState({ swetaIncome: 0, swetaExpense: 0, amitIncome: 0, amitExpense: 0 });

  const handleTabChange = useCallback((tabId) => {
    if (tabId === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsSidebarOpen(false);
      setIsTransitioning(false);
    }, 160);
  }, [activeTab]);

  const handleSaveActivityDay = async (data) => {
    if (!db || !user) return;
    const ref = doc(db, 'activities/amishi/daily', data.date);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp(), createdBy: user.uid }, { merge: true });
  };

  const handleSaveFeePayment = async (data) => {
    if (!db || !user) return;
    const collectionPath = feesSession === '2026-27' ? 'activities/amishi/fees' : `activities/amishi/fees_${feesSession.replace('-', '_')}`;
    const ref = doc(db, collectionPath, data.id);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp(), createdBy: user.uid }, { merge: true });
  };

  const activeLabel = NAV.flatMap(g => g.items).find(n => n.id === activeTab)?.label || '';
  const userInitials = user && !user.isAnonymous
    ? (user.displayName || user.email || 'U').slice(0, 2).toUpperCase()
    : '?';

  // Finance source indicator
  const financeSource = 'firebase';

  return (
    <>
      <div className={`dashboard-shell dashboard-shell--sidebar ${isSidebarCollapsed ? 'dashboard-shell--collapsed' : ''}`}>
        <div className="backdrop backdrop--top" />
        <div className="backdrop backdrop--bottom" />
        <div className="backdrop backdrop--purple" />

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
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>

          {/* User card */}
          <div className="sidebar__user" onClick={() => setIsAuthModalOpen(true)} title="Account">
            <div className="sidebar__avatar">
              {user?.photoURL ? <img src={user.photoURL} alt="avatar" /> : userInitials}
            </div>
            {!isSidebarCollapsed && (
              <div>
                <div className="sidebar__user-name">
                  {user && !user.isAnonymous ? (user.displayName?.split(' ')[0] || 'User') : 'Guest'}
                </div>
                <div className="sidebar__user-role">
                  {isAuthorized ? '✅ Full Access' : user && !user.isAnonymous ? '⚠️ Restricted' : 'Click to sign in'}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="sidebar__nav" role="tablist" aria-orientation="vertical">
            {NAV.map(({ group, items }) => (
              <div key={group}>
                <div className="sidebar-group-header">{group}</div>
                {items.map(item => (
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
                    <span className="sidebar-item__icon">{ICONS[item.iconId || item.id]}</span>
                    {!isSidebarCollapsed && <span className="sidebar-item__label">{item.label}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Bottom sync indicator */}
          {!isSidebarCollapsed && (
            <div style={{ marginTop: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '8px 0', lineHeight: 1.5 }}>
              {user && !user.isAnonymous ? '🟢 Firebase synced' : '🟡 Preview mode'}
              <br />Sweta · Amit · Amishi
            </div>
          )}
        </aside>

        {/* ── Main Panel ── */}
        <main className="main-panel">
          {/* Mobile header */}
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

          <div
            id={`panel-${activeTab}`}
            className={`tab-content-panel ${isTransitioning ? 'tab-content-panel--exit' : ''}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'overview' && (
              <OverviewDashboard
                financeItems={[]}
                gymItems={[...amitGym.items, ...swetaGym.items]}
                activityItems={activity.items}
                calendarItems={calendar.items}
              />
            )}

            {activeTab === 'finance' && (
              <FinancePage isAuthorized={isAuthorized} />
            )}


            {(activeTab === 'amitDiet' || activeTab === 'swetaDiet') && (
              <DietPlan name={activeTab === 'amitDiet' ? 'Amit' : 'Sweta'} />
            )}

            {activeTab === 'activity' && (
              <AmishiActivity
                items={activity.items}
                isAuthorized={isAuthorized}
                onSaveDay={handleSaveActivityDay}
              />
            )}

            {activeTab === 'fees' && (
              <AmishiFees
                items={fees.items}
                session={feesSession}
                onSessionChange={setFeesSession}
                isAuthorized={isAuthorized}
                onSavePayment={handleSaveFeePayment}
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

            {activeTab === 'cleaning' && (
              <CleaningSchedule />
            )}

            {activeTab === 'purchases' && (
              <PurchasesTracker />
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
