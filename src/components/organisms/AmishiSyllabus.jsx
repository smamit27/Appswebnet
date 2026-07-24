import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import SectionCard from '../molecules/SectionCard.jsx';
import ProgressBar from '../atoms/ProgressBar.jsx';
import { AMISHI_SYLLABUS } from '../../data/amishiSyllabus.js';

export default function AmishiSyllabus({ user, isAuthorized }) {
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);
  const [activeSubject, setActiveSubject] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Subjects list
  const subjectsList = ['All', 'Theme & Projects', 'English', 'Hindi', 'Maths', 'Outdoor Play'];

  // Load progress on mount or user change
  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      if (!user) {
        // Load from localStorage
        try {
          const localData = localStorage.getItem('mock-db-amishi_syllabus_progress');
          if (localData) {
            setProgress(JSON.parse(localData));
          }
        } catch (e) {
          console.error("Failed to load local syllabus progress", e);
        }
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'amishi', 'syllabus_progress');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProgress(snap.data().completed || {});
        }
      } catch (err) {
        console.error("Failed to load syllabus progress from Firestore", err);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, [user]);

  // Handle checking/unchecking an outcome
  const handleToggleOutcome = async (key) => {
    if (!isAuthorized) return;
    
    const newProgress = {
      ...progress,
      [key]: !progress[key]
    };
    
    setProgress(newProgress);
    setSaveSuccess(false);
    setSaving(true);

    try {
      if (!user) {
        localStorage.setItem('mock-db-amishi_syllabus_progress', JSON.stringify(newProgress));
      } else {
        const docRef = doc(db, 'amishi', 'syllabus_progress');
        await setDoc(docRef, { completed: newProgress, updatedAt: serverTimestamp() }, { merge: true });
      }
      setSaveSuccess(true);
    } catch (err) {
      console.error("Failed to save syllabus progress", err);
    } finally {
      setSaving(false);
    }
  };

  // Helper to highlight search text
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} style={{ background: 'var(--amber-soft)', color: 'var(--ink)', padding: '0 2px', borderRadius: 4 }}>
              {part}
            </mark>
          ) : part
        )}
      </span>
    );
  };

  // Calculate statistics
  const stats = useMemo(() => {
    let totalOutcomesCount = 0;
    let completedOutcomesCount = 0;
    
    let activeMonthTotal = 0;
    let activeMonthCompleted = 0;

    AMISHI_SYLLABUS.forEach((mObj, mIdx) => {
      Object.keys(mObj.subjects).forEach(subject => {
        const outcomes = mObj.subjects[subject].outcomes || [];
        outcomes.forEach((_, oIdx) => {
          const key = `${mObj.month}_${subject}_${oIdx}`;
          totalOutcomesCount++;
          if (progress[key]) {
            completedOutcomesCount++;
          }

          if (mIdx === activeMonthIdx) {
            activeMonthTotal++;
            if (progress[key]) {
              activeMonthCompleted++;
            }
          }
        });
      });
    });

    return {
      total: totalOutcomesCount,
      completed: completedOutcomesCount,
      activeTotal: activeMonthTotal,
      activeCompleted: activeMonthCompleted,
      percentTotal: totalOutcomesCount > 0 ? Math.round((completedOutcomesCount / totalOutcomesCount) * 100) : 0,
      percentActive: activeMonthTotal > 0 ? Math.round((activeMonthCompleted / activeMonthTotal) * 100) : 0
    };
  }, [progress, activeMonthIdx]);

  // Current selected month
  const currentMonthData = AMISHI_SYLLABUS[activeMonthIdx];

  // Match items based on search term
  const matchesSearch = (text) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
        <p>Loading Syllabus Tracker...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Amishi's Schooling</p>
          <h1>Class Prep Learning Tracker 📚</h1>
          <p className="page-header__sub">DPS Class Preparatory Syllabus (2026-27) & Learning Progress.</p>
        </div>
        <div className="page-header__actions">
          {saving && <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Saving progress...</span>}
          {saveSuccess && <span style={{ fontSize: '0.85rem', color: 'var(--teal)', fontWeight: 600 }}>✅ Progress Saved</span>}
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <SectionCard title="Overall Year Progress" badge="Syllabus Stats">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>Learning Outcomes Mastered</span>
              <span>{stats.completed} / {stats.total} ({stats.percentTotal}%)</span>
            </div>
            <ProgressBar value={stats.completed} total={stats.total} tone="teal" />
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
              Outcomes checked off across all months (April - December).
            </p>
          </div>
        </SectionCard>

        <SectionCard title={`${currentMonthData.month} Progress`} badge="Active Month">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>Monthly Learning Completion</span>
              <span>{stats.activeCompleted} / {stats.activeTotal} ({stats.percentActive}%)</span>
            </div>
            <ProgressBar value={stats.activeCompleted} total={stats.activeTotal} tone="amber" />
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
              Theme: <strong>{currentMonthData.theme}</strong>
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Main Controls Grid */}
      <SectionCard title="Syllabus Explorer" badge="Class Outline">
        {/* Search input */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', paddingLeft: 40, height: 44, borderRadius: 12, background: 'var(--surface-strong)', color: 'var(--ink)' }}
              placeholder="Search syllabus keywords (e.g. phonics, shapes, अ से अः)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{ position: 'absolute', left: 14, color: 'var(--muted)', display: 'flex' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: 14, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Months selection bar */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
          {AMISHI_SYLLABUS.map((mObj, idx) => (
            <button
              key={mObj.month}
              onClick={() => setActiveMonthIdx(idx)}
              style={{
                padding: '10px 18px',
                borderRadius: 20,
                border: 'none',
                background: idx === activeMonthIdx ? 'var(--teal)' : 'var(--surface-strong)',
                color: idx === activeMonthIdx ? '#fff' : 'var(--ink)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                boxShadow: idx === activeMonthIdx ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {mObj.month}
            </button>
          ))}
        </div>

        {/* Subjects selection bar */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
          {subjectsList.map(subj => {
            const isActive = activeSubject === subj;
            return (
              <button
                key={subj}
                onClick={() => setActiveSubject(subj)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  border: isActive ? '1.5px solid var(--teal)' : '1.5px solid transparent',
                  background: isActive ? 'var(--teal-soft)' : 'transparent',
                  color: 'var(--ink)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {subj}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div style={{ marginTop: 24, display: 'grid', gap: 28 }}>
          {Object.keys(currentMonthData.subjects)
            .filter(subj => activeSubject === 'All' || subj === activeSubject)
            .map(subjectKey => {
              const subjObj = currentMonthData.subjects[subjectKey];
              
              // Filter subtopics, outcomes, activities by search
              const filteredSubtopics = subjObj.subtopics.filter(matchesSearch);
              const filteredOutcomes = subjObj.outcomes.filter(matchesSearch);
              const filteredActivities = subjObj.activities.filter(matchesSearch);

              // Skip rendering this subject if search query is active and nothing matches
              if (searchTerm && filteredSubtopics.length === 0 && filteredOutcomes.length === 0 && filteredActivities.length === 0) {
                return null;
              }

              return (
                <div key={subjectKey} className="subject-block" style={{
                  background: 'var(--surface-strong)',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {/* Subject Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, color: 'var(--teal)', fontSize: '1.1rem', fontWeight: 700 }}>
                      {subjectKey}
                    </h3>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      background: 'var(--pine-soft)',
                      color: 'var(--pine)',
                      fontWeight: 600
                    }}>
                      {subjObj.outcomes.filter((_, i) => progress[`${currentMonthData.month}_${subjectKey}_${i}`]).length} / {subjObj.outcomes.length} Outcomes Mastered
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                    {/* Subtopics column */}
                    {subjObj.subtopics && subjObj.subtopics.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Topics & Scope
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', color: 'var(--ink)' }}>
                          {subjObj.subtopics.map((sub, i) => (
                            <li key={i} style={{ lineHeight: 1.4 }}>
                              {highlightText(sub, searchTerm)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Learning Outcomes column (interactive checklist) */}
                    {subjObj.outcomes && subjObj.outcomes.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Learning Outcomes (Check to Master)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {subjObj.outcomes.map((outcome, i) => {
                            const outcomeKey = `${currentMonthData.month}_${subjectKey}_${i}`;
                            const isCompleted = !!progress[outcomeKey];
                            
                            return (
                              <div 
                                key={i}
                                onClick={() => handleToggleOutcome(outcomeKey)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  background: isCompleted ? 'var(--teal-soft)' : '#fff',
                                  border: isCompleted ? '1.5px solid var(--teal)' : '1.5px solid var(--line)',
                                  padding: '10px 12px',
                                  borderRadius: 12,
                                  cursor: isAuthorized ? 'pointer' : 'default',
                                  transition: 'all 0.2s',
                                  opacity: isCompleted ? 1 : 0.85
                                }}
                              >
                                <div style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  border: isCompleted ? '5px solid var(--teal)' : '2px solid var(--muted)',
                                  background: '#fff',
                                  flexShrink: 0,
                                  marginTop: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }} />
                                <span style={{
                                  fontSize: '0.82rem',
                                  color: 'var(--ink)',
                                  lineHeight: 1.4,
                                  textDecoration: isCompleted ? 'line-through' : 'none',
                                  fontWeight: isCompleted ? 500 : 400
                                }}>
                                  {highlightText(outcome, searchTerm)}
                                </span>
                                {isCompleted && (
                                  <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '0.62rem',
                                    background: 'var(--teal)',
                                    color: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: 6,
                                    fontWeight: 700,
                                    textTransform: 'uppercase'
                                  }}>
                                    Mastered
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Activities column */}
                    {subjObj.activities && subjObj.activities.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Activities & Methods
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', color: 'var(--ink)' }}>
                          {subjObj.activities.map((act, i) => (
                            <li key={i} style={{ lineHeight: 1.4 }}>
                              {highlightText(act, searchTerm)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </SectionCard>
    </div>
  );
}
