import React, { useState, useMemo } from 'react';
import SectionCard from '../molecules/SectionCard.jsx';
import ProgressBar from '../atoms/ProgressBar.jsx';
import ConfirmDeleteModal from '../molecules/ConfirmDeleteModal.jsx';
import ToastNotification from '../molecules/ToastNotification.jsx';

const DEFAULT_HABITS = [
  { id: 'water', label: '💧 Drink 8 glasses of water', done: false },
  { id: 'reading', label: '📚 Read for 20 minutes', done: false },
  { id: 'homework', label: '📝 Complete homework', done: false },
  { id: 'walk', label: '🚶 Walk / Outdoor activity', done: false },
  { id: 'screen', label: '📵 Screen-free time (1 hour)', done: false },
];

const MOODS = [
  { emoji: '😄', label: 'Great', value: 'great' },
  { emoji: '😊', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Low', value: 'low' },
  { emoji: '😤', label: 'Stressed', value: 'stressed' },
];

export default function AmishiActivity({ items, isAuthorized, onSaveDay }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayItem = items.find(i => i.date === todayStr) || null;

  const [habits, setHabits]     = useState(todayItem?.habits || DEFAULT_HABITS.map(h => ({ ...h })));
  const [mood, setMood]         = useState(todayItem?.mood || '');
  const [notes, setNotes]       = useState(todayItem?.notes || '');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [newHabit, setNewHabit] = useState('');

  const doneCnt  = habits.filter(h => h.done).length;
  const totalCnt = habits.length;

  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
    setSaved(false);
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const id = Date.now().toString();
    setHabits(prev => [...prev, { id, label: newHabit.trim(), done: false }]);
    setNewHabit('');
    setSaved(false);
  };

  const [deleteHabitId, setDeleteHabitId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleConfirmDelete = () => {
    if (!deleteHabitId) return;
    const id = deleteHabitId;
    setDeleteHabitId(null);
    setHabits(prev => prev.filter(h => h.id !== id));
    setSaved(false);
    setToast({ message: 'Habit removed. Remember to save your day.', type: 'success' });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveDay({ date: todayStr, habits, mood, notes });
    setSaving(false);
    setSaved(true);
  };

  // Last 7 days summary
  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleString('en-IN', { weekday: 'short' });
      const item = items.find(it => it.date === key);
      const done = item?.habits?.filter(h => h.done).length || 0;
      const total = item?.habits?.length || DEFAULT_HABITS.length;
      days.push({ key, label, done, total, mood: item?.mood || '', isToday: key === todayStr });
    }
    return days;
  }, [items, todayStr]);

  const moodEmoji = (m) => MOODS.find(mo => mo.value === m)?.emoji || '—';

  // Overall habit completion this week
  const weekDone  = last7.reduce((s, d) => s + d.done, 0);
  const weekTotal = last7.reduce((s, d) => s + d.total, 0);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Daily Activities</p>
          <h1>Amishi's Activity Tracker 🌟</h1>
          <p className="page-header__sub">Track daily habits, mood, and personal growth.</p>
        </div>
        <div className="page-header__actions">
          <span style={{
            padding: '8px 16px', borderRadius: 12,
            background: 'var(--amber-soft)', color: 'var(--amber)',
            fontWeight: 700, fontSize: '0.85rem'
          }}>
            {doneCnt}/{totalCnt} habits today ✨
          </span>
          {isAuthorized && (
            <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : saved ? '✅ Saved!' : '💾 Save Today'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        {/* Daily Habits */}
        <SectionCard badge="Today's Habits" title={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
          <ProgressBar label={`${doneCnt} of ${totalCnt} habits completed`} value={doneCnt} total={totalCnt} tone="teal" />
          <div style={{ marginTop: 20, marginBottom: 16 }}>
            <div className="habit-list">
              {habits.map(h => (
                <div
                  key={h.id}
                  className={`habit-item ${h.done ? 'habit-item--done' : ''}`}
                  onClick={() => isAuthorized && toggleHabit(h.id)}
                  style={{ cursor: isAuthorized ? 'pointer' : 'default' }}
                >
                  <div className="habit-checkbox">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span className="habit-label">{h.label}</span>
                  {isAuthorized && (
                    <button
                      className="btn btn--danger btn--sm btn--icon"
                      style={{ marginLeft: 'auto' }}
                      onClick={e => { e.stopPropagation(); setDeleteHabitId(h.id); }}
                      title="Remove habit"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add habit */}
          {isAuthorized && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="search-input"
                style={{ flex: 1 }}
                placeholder="Add a custom habit…"
                value={newHabit}
                onChange={e => setNewHabit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHabit()}
              />
              <button className="btn btn--secondary" onClick={addHabit}>Add</button>
            </div>
          )}
        </SectionCard>

        {/* Mood + Notes */}
        <div style={{ display: 'grid', gap: 16 }}>
          <SectionCard badge="Mood Tracker" title="How are you feeling? 😊">
            <div className="mood-row">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  className={`mood-btn ${mood === m.value ? 'mood-btn--selected' : ''}`}
                  onClick={() => { if (isAuthorized) { setMood(m.value); setSaved(false); }}}
                  disabled={!isAuthorized}
                >
                  <span className="mood-btn__emoji">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard badge="Diary" title="Notes & Reflections 📖">
            <textarea
              className="field"
              style={{
                width: '100%', minHeight: 120, padding: 12,
                border: '1px solid var(--line)', borderRadius: 12,
                background: '#fffefb', color: 'var(--ink)', resize: 'vertical',
                fontFamily: 'var(--body-font)', fontSize: '0.9rem'
              }}
              placeholder="Write about your day, achievements, thoughts…"
              value={notes}
              onChange={e => { setNotes(e.target.value); setSaved(false); }}
              disabled={!isAuthorized}
            />
          </SectionCard>
        </div>
      </div>

      {/* Last 7 Days Summary */}
      <SectionCard badge="Weekly Review" title="Last 7 Days" subtitle="Habit completion and daily mood for the past week.">
        <div style={{ marginBottom: 16 }}>
          <ProgressBar label={`Weekly habit completion: ${weekDone}/${weekTotal}`} value={weekDone} total={weekTotal || 1} tone="teal" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {last7.map((day, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '14px 8px',
              borderRadius: 14, border: `1px solid ${day.isToday ? 'var(--teal)' : 'var(--line)'}`,
              background: day.isToday ? 'rgba(25,108,108,0.05)' : 'rgba(255,255,255,0.6)',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{day.label}</div>
              <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{moodEmoji(day.mood)}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: day.done === day.total && day.total > 0 ? 'var(--pine)' : 'var(--ink)' }}>
                {day.done}/{day.total}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>habits</div>
            </div>
          ))}
        </div>

        {/* History table */}
        {items.length > 1 && (
          <div style={{ marginTop: 20 }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>History Log</p>
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Habits Done</th>
                    <th>Mood</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[...items].sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 10).map((item, i) => (
                    <tr key={i}>
                      <td>{item.date}</td>
                      <td>
                        <strong>
                          {item.habits?.filter(h => h.done).length || 0}
                          /{item.habits?.length || 0}
                        </strong>
                      </td>
                      <td>{moodEmoji(item.mood)} {item.mood || '—'}</td>
                      <td><span className="sub">{item.notes || '—'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      <ConfirmDeleteModal
        isOpen={deleteHabitId !== null}
        onClose={() => setDeleteHabitId(null)}
        onConfirm={handleConfirmDelete}
      />

      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
