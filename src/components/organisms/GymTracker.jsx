import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import SectionCard from '../molecules/SectionCard.jsx';
import StatusPill from '../atoms/StatusPill.jsx';
import ProgressBar from '../atoms/ProgressBar.jsx';
import ConfirmDeleteModal from '../molecules/ConfirmDeleteModal.jsx';
import ToastNotification from '../molecules/ToastNotification.jsx';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar
} from 'recharts';

const WORKOUT_TYPES = ['Cardio', 'Strength', 'Yoga', 'Pilates', 'Walk', 'Cycling', 'Swimming', 'HIIT', 'Zumba', 'Custom'];
const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  type: 'Strength',
  duration: 45,
  calories: '',
  notes: '',
};

function calcStreak(items) {
  if (!items.length) return 0;
  const sorted = [...new Set(items.map(i => i.date))].sort((a, b) => b > a ? 1 : -1);
  let streak = 0;
  let cur = new Date();
  cur.setHours(0, 0, 0, 0);
  for (const dateStr of sorted) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((cur - d) / 86400000);
    if (diff <= 1) {
      streak++;
      cur = d;
      cur.setDate(cur.getDate() - 1);
    } else break;
  }
  return streak;
}

function getWeekDates() {
  const dates = [];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function GymTracker({ name, items, isAuthorized, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleConfirmDelete = async () => {
    if (!deleteWorkoutId) return;
    const id = deleteWorkoutId;
    setDeleteWorkoutId(null);

    try {
      await onDelete(id);
      setToast({ message: 'Workout deleted successfully.', type: 'success' });
    } catch (err) {
      console.error('Failed to delete workout:', err);
      setToast({ message: 'Failed to delete workout: ' + err.message, type: 'error' });
    }
  };
  const [filterType, setFilterType] = useState('All');

  const streak = useMemo(() => calcStreak(items), [items]);
  const weekDates = getWeekDates();

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthItems = items.filter(i => (i.date || '').startsWith(thisMonth));
  const gymThisWeek = items.filter(i => weekDates.includes(i.date));

  const totalDuration = monthItems.reduce((s, i) => s + (Number(i.duration) || 0), 0);
  const totalCalories = monthItems.reduce((s, i) => s + (Number(i.calories) || 0), 0);

  // Last 30 days for heatmap
  const last30 = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sessions = items.filter(it => it.date === key);
      const intensity = sessions.length === 0 ? 0 :
        sessions.reduce((s, s2) => s + (Number(s2.duration) || 0), 0) >= 60 ? 4 :
        sessions.reduce((s, s2) => s + (Number(s2.duration) || 0), 0) >= 45 ? 3 :
        sessions.reduce((s, s2) => s + (Number(s2.duration) || 0), 0) >= 30 ? 2 : 1;
      days.push({ date: key, intensity, sessions });
    }
    return days;
  }, [items]);

  // Duration trend (last 8 workouts)
  const durationTrend = useMemo(() =>
    [...items]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-10)
      .map(i => ({ date: i.date?.slice(5), duration: Number(i.duration) || 0, type: i.type })),
    [items]
  );

  // Type distribution
  const byType = useMemo(() => {
    const map = {};
    items.forEach(i => { map[i.type] = (map[i.type] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [items]);

  const filtered = useMemo(() => {
    let arr = [...items].sort((a, b) => (b.date > a.date ? 1 : -1));
    if (filterType !== 'All') arr = arr.filter(i => i.type === filterType);
    return arr;
  }, [items, filterType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: ['duration','calories'].includes(name) ? (value === '' ? '' : Number(value)) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    setSaving(true);
    await onAdd(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Activity Tracker</p>
          <h1>{name}'s Gym Activity 🏋️</h1>
          <p className="page-header__sub">Log workouts, track streaks, and hit your weekly goals.</p>
        </div>
        <div className="page-header__actions">
          <div className="streak-badge">
            <span className="streak-badge__fire">🔥</span>
            <span className="streak-badge__num">{streak}</span>
            <span style={{ fontSize: '0.8rem' }}>Day Streak</span>
          </div>
          {isAuthorized && (
            <button className="btn btn--amber" onClick={() => setShowForm(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Log Workout
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card metric-card--amber">
          <p className="metric-card__label">This Week</p>
          <h3 className="metric-card__value">{gymThisWeek.length} sessions</h3>
          <p className="metric-card__detail">Goal: 4 sessions/week</p>
        </div>
        <div className="metric-card metric-card--teal">
          <p className="metric-card__label">Month Duration</p>
          <h3 className="metric-card__value">{totalDuration} min</h3>
          <p className="metric-card__detail">{monthItems.length} workouts this month</p>
        </div>
        <div className="metric-card metric-card--coral">
          <p className="metric-card__label">Calories Burned</p>
          <h3 className="metric-card__value">{totalCalories > 0 ? `${totalCalories} kcal` : '—'}</h3>
          <p className="metric-card__detail">This month</p>
        </div>
        <div className="metric-card metric-card--purple">
          <p className="metric-card__label">Streak</p>
          <h3 className="metric-card__value">🔥 {streak} days</h3>
          <p className="metric-card__detail">{items.length} total sessions logged</p>
        </div>
      </div>

      {/* Weekly Goals + Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)', gap: 16 }}>
        {/* Weekly Goal */}
        <div className="section-card" style={{ padding: 20 }}>
          <p className="eyebrow">This Week's Progress</p>
          <h3 style={{ marginBottom: 16 }}>Goal: 4 sessions</h3>
          <ProgressBar label={`${gymThisWeek.length} / 4 sessions`} value={gymThisWeek.length} total={4} tone="amber" />
          <div style={{ marginTop: 20 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Week Days</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {['S','M','T','W','T','F','S'].map((day, i) => {
                const dateStr = weekDates[i];
                const done = gymThisWeek.some(g => g.date === dateStr);
                const isToday = dateStr === new Date().toISOString().slice(0, 10);
                return (
                  <div key={i} style={{
                    textAlign: 'center', padding: '8px 4px',
                    borderRadius: 10, background: done ? 'var(--amber-soft)' : isToday ? 'rgba(61,63,52,0.06)' : 'transparent',
                    border: isToday ? '1px solid var(--amber)' : '1px solid transparent',
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 4 }}>{day}</div>
                    <div style={{ fontSize: '1rem' }}>{done ? '💪' : '○'}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Top Workout Types</p>
            {byType.slice(0, 3).map((t, i) => (
              <div key={i} className="stat-line">
                <span className="stat-line__label">{t.name}</span>
                <span className="stat-line__value">{t.count} sessions</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="section-card" style={{ padding: 20 }}>
          <p className="eyebrow">Activity Heatmap</p>
          <h3 style={{ marginBottom: 4 }}>Last 30 Days</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 14 }}>
            Darker = longer workout intensity
          </p>
          <div className="heatmap">
            {last30.map((day, i) => (
              <div
                key={i}
                className={`heatmap-cell heatmap-cell--${day.intensity}`}
                title={`${day.date}: ${day.sessions.length} session(s)`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10, fontSize: '0.72rem', color: 'var(--muted)' }}>
            <span>Less</span>
            {[0,1,2,3,4].map(l => (
              <div key={l} className={`heatmap-cell heatmap-cell--${l}`} style={{ width: 14, height: 14 }} />
            ))}
            <span>More</span>
          </div>

          {/* Duration trend */}
          <div style={{ marginTop: 20 }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>Duration Trend (last 10 sessions)</p>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={durationTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,63,52,0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5f665f' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#5f665f' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}m`} width={32} />
                  <Tooltip formatter={(v) => [`${v} min`, 'Duration']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="duration" stroke="#b98216" strokeWidth={2.5} dot={{ fill: '#b98216', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Workout History */}
      <SectionCard
        badge="History"
        title="Workout Log"
        subtitle="All logged gym sessions in reverse chronological order."
        actions={
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="All">All Types</option>
            {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        }
      >
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Calories</th>
                <th>Notes</th>
                {isAuthorized && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.slice(0, 30).map((w, i) => (
                <tr key={w.id || i}>
                  <td>{w.date || '—'}</td>
                  <td><StatusPill value={w.type?.toLowerCase()} /></td>
                  <td><strong>{w.duration || 0} min</strong></td>
                  <td>{w.calories ? `${w.calories} kcal` : '—'}</td>
                  <td><span className="sub">{w.notes || '—'}</span></td>
                  {isAuthorized && (
                    <td>
                      <button className="btn btn--danger btn--sm btn--icon" onClick={() => setDeleteWorkoutId(w.id)} title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr className="empty-row"><td colSpan={isAuthorized ? 6 : 5}>No workouts logged yet. Hit the gym! 💪</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Log Workout Modal */}
      {showForm && createPortal(
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Log Workout 💪</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid form-grid--2" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label>Date</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Workout Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Duration (minutes)</label>
                  <input type="number" name="duration" value={form.duration} onChange={handleChange}
                    placeholder="45" min="1" max="600" />
                </div>
                <div className="field">
                  <label>Calories Burned (optional)</label>
                  <input type="number" name="calories" value={form.calories} onChange={handleChange}
                    placeholder="e.g. 350" min="0" />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes (optional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange}
                    placeholder="e.g. Legs + core, felt strong today!" style={{ minHeight: 70 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn--amber" disabled={saving}>
                  {saving ? 'Saving…' : '💪 Save Workout'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDeleteModal
        isOpen={deleteWorkoutId !== null}
        onClose={() => setDeleteWorkoutId(null)}
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
