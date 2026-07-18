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
import LendingTracker    from './components/organisms/LendingTracker.jsx';
import FuturePurchases   from './components/organisms/FuturePurchases.jsx';
import PortfolioPage     from './components/organisms/Portfolio/PortfolioPage.jsx';
import AmishiActivity    from './components/organisms/AmishiActivity.jsx';
import AmishiFees        from './components/organisms/AmishiFees.jsx';
import AmishiProfile     from './components/organisms/AmishiProfile.jsx';
import DietPlan          from './components/organisms/DietPlan.jsx';
import FamilyCalendar    from './components/organisms/FamilyCalendar.jsx';
import CleaningSchedule  from './components/organisms/CleaningSchedule.jsx';
import CombinedHealthDashboard from './components/organisms/CombinedHealthDashboard.jsx';
import DocumentTracker from './components/organisms/DocumentTracker.jsx';
import HealthMetrics from './components/organisms/HealthMetrics.jsx';
import { db } from './firebase.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import AIChatButton from './components/organisms/AIChatButton.jsx';
import AIChatWindow from './components/organisms/AIChatWindow.jsx';

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
  lending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-3.58-6-8-6s-8 2.63-8 6" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </svg>
  ),
  wishlist: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  portfolio: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
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
  document: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  vitals: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      <line x1="9" y1="10" x2="9" y2="10" strokeWidth="3" strokeLinecap="round"/>
      <line x1="12" y1="10" x2="12" y2="10" strokeWidth="3" strokeLinecap="round"/>
      <line x1="15" y1="10" x2="15" y2="10" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
};

/* ── No Mock fallback data ─────────────────────────────────────────── */

/* ── Sidebar nav structure ──────────────────────────────────────── */
const NAV = [
  { group: 'Home',   items: [{ id: 'overview',  label: 'Overview'       }] },
  { group: 'Finance',items: [
    { id: 'finance',   label: 'Income & Expenses' },
    { id: 'lending',   label: 'Money Lent' },
    { id: 'wishlist',  label: 'Future Purchases' },
    { id: 'portfolio', label: 'Investment Portfolio' }
  ] },
  { group: 'Health & Fitness', items: [
    { id: 'gymDiet', label: 'Gym & Diet', iconId: 'diet' },
    { id: 'healthMetrics', label: 'Vitals & Metrics', iconId: 'vitals' }
  ]},
  { group: 'Amishi', items: [
    { id: 'activity', label: 'Daily Activity' },
    { id: 'fees',     label: 'School Fees' },
    { id: 'profile',  label: 'Q&A Profile', iconId: 'profile' }
  ]},
  { group: 'Family', items: [
    { id: 'calendar',  label: 'Family Calendar' },
    { id: 'cleaning',  label: 'Cleaning Schedule' },
    { id: 'documents', label: 'Document Tracker', iconId: 'document' }
  ] },
];

export default function App() {
  const { user, isAuthorized, accessDenied, signInWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab]           = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen]   = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feesSession, setFeesSession]         = useState('2026-27');
  const [isAIChatOpen, setIsAIChatOpen]       = useState(false);

  // Real-time Firestore collections
  const amitGym  = useCollection('activities/amit/gym',     [],   user);
  const swetaGym = useCollection('activities/sweta/gym',    [],   user);
  const activity = useCollection('activities/amishi/daily', [],   user, 'date', 'desc');
  const fees     = useCollection(feesSession === '2026-27' ? 'activities/amishi/fees' : `activities/amishi/fees_${feesSession.replace('-', '_')}`,  [],   user, 'id', 'asc');
  const calendar = useCollection('familyEvents',            [],   user, 'date', 'asc');

  // For the Overview we need a quick summary of finance — fetch latest month snapshot
  const [financeSnap, setFinanceSnap] = useState({ swetaIncome: 0, swetaExpense: 0, amitIncome: 0, amitExpense: 0 });
  // portfolioSummary removed — portfolio now uses static NSDL CAS data

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
            <div className="sidebar__logo" style={{ background: '#fff', padding: '4px' }}>
              <img src="/logo.png" alt="AppsWebNet Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
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
                portfolioSummary={null}
                onNavigate={handleTabChange}
              />
            )}

            {activeTab === 'finance' && (
              <FinancePage isAuthorized={isAuthorized} user={user} />
            )}


            {activeTab === 'lending' && (
              <LendingTracker isAuthorized={isAuthorized} user={user} />
            )}

            {activeTab === 'wishlist' && (
              <FuturePurchases isAuthorized={isAuthorized} user={user} />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioPage isAuthorized={isAuthorized} user={user} />
            )}

            {activeTab === 'gymDiet' && (
              <CombinedHealthDashboard
                amitGymItems={amitGym.items}
                swetaGymItems={swetaGym.items}
                amitGymAdd={amitGym.add}
                amitGymDelete={amitGym.remove}
                swetaGymAdd={swetaGym.add}
                swetaGymDelete={swetaGym.remove}
                isAuthorized={isAuthorized}
              />
            )}

            {activeTab === 'healthMetrics' && (
              <HealthMetrics />
            )}

            {activeTab === 'activity' && (
              <AmishiActivity
                items={activity.items}
                isAuthorized={isAuthorized}
                onSaveDay={handleSaveActivityDay}
              />
            )}

            {activeTab === 'profile' && (
              <AmishiProfile user={user} />
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

            {activeTab === 'documents' && (
              <DocumentTracker />
            )}
          </div>
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        isAuthorized={isAuthorized}
        accessDenied={accessDenied}
        onSignIn={signInWithGoogle}
        onSignOut={logout}
      />

      <AIChatButton isOpen={isAIChatOpen} onClick={() => setIsAIChatOpen(!isAIChatOpen)} />
      <AIChatWindow isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </>
  );
}
