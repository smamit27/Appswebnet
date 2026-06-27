import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import SectionCard from '../molecules/SectionCard.jsx';

const TAGS = [
  { value: 'family', label: '🏠 Family', cls: 'cal-event--family' },
  { value: 'sweta',  label: '💼 Sweta',  cls: 'cal-event--sweta' },
  { value: 'amishi', label: '🌟 Amishi', cls: 'cal-event--amishi' },
];

const ANNUAL_BIRTHDAYS = [
  { month: 9, day: 27, title: "Amit's Birthday 🎂", tag: 'family' },
  { month: 10, day: 24, title: "Sweta's Birthday 🎂", tag: 'sweta' },
  { month: 3, day: 24, title: "Amishi's Birthday 🎂", tag: 'amishi' }
];

const DAYS_HEADER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EMPTY_FORM = { title: '', date: new Date().toISOString().slice(0, 10), time: '', tag: 'family', note: '' };

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const cells = [];
  // prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, currentMonth: false, date: null });
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, currentMonth: true, date });
  }
  // next month
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false, date: null });
  }
  return cells;
}

export default function FamilyCalendar({ items, isAuthorized, onAdd, onDelete }) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const todayStr = today.toISOString().slice(0, 10);

  const mergedEvents = useMemo(() => {
    const all = [...items];
    const currentYear = today.getFullYear();
    ANNUAL_BIRTHDAYS.forEach(bday => {
      all.push({
        id: `bday-${bday.tag}-${currentYear}`,
        title: bday.title,
        date: `${currentYear}-${String(bday.month).padStart(2, '0')}-${String(bday.day).padStart(2, '0')}`,
        time: '',
        tag: bday.tag,
        isStatic: true,
        note: 'Annual Event'
      });
    });
    return all;
  }, [items]);

  const cells = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const eventsForDate = (dateStr) =>
    dateStr ? mergedEvents.filter(e => e.date === dateStr) : [];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    setSaving(true);
    await onAdd(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  // Upcoming events
  const upcoming = useMemo(() =>
    [...mergedEvents]
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date > b.date ? 1 : -1),
    [mergedEvents, todayStr]
  );

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Family Calendar</p>
          <h1>Family Events 📅</h1>
          <p className="page-header__sub">Shared events, birthdays, outings, and appointments.</p>
        </div>
        <div className="page-header__actions">
          {isAuthorized && (
            <button className="btn btn--primary" onClick={() => setShowForm(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Event
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.8fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        {/* Calendar */}
        <SectionCard badge="Calendar" title={monthLabel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button className="btn btn--secondary btn--sm" onClick={prevMonth}>← Prev</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {TAGS.map(t => (
                <span key={t.value} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className={`cal-event ${t.cls}`} style={{ padding: '2px 8px' }}>{t.label}</span>
                </span>
              ))}
            </div>
            <button className="btn btn--secondary btn--sm" onClick={nextMonth}>Next →</button>
          </div>

          <div className="cal-grid">
            {DAYS_HEADER.map(d => (
              <div key={d} className="cal-day-header">{d}</div>
            ))}
            {cells.map((cell, i) => {
              const events = eventsForDate(cell.date);
              const isToday = cell.date === todayStr;
              return (
                <div key={i} className={`cal-cell ${isToday ? 'cal-cell--today' : ''} ${!cell.currentMonth ? 'cal-cell--other-month' : ''}`}>
                  <div className="cal-cell__num">{cell.day}</div>
                  {events.slice(0, 2).map((ev, j) => {
                    const tag = TAGS.find(t => t.value === ev.tag) || TAGS[0];
                    return (
                      <div key={j} className={`cal-event ${tag.cls}`} title={ev.title}>
                        {ev.title}
                      </div>
                    );
                  })}
                  {events.length > 2 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>+{events.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Upcoming Events List */}
        <SectionCard badge="Upcoming" title="Next Events">
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: 24 }}>
              No upcoming events. Add one!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.slice(0, 8).map((ev, i) => {
                const tag = TAGS.find(t => t.value === ev.tag) || TAGS[0];
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.7)', border: '1px solid var(--line)',
                  }}>
                    <div style={{
                      width: 44, height: 44, flexShrink: 0, borderRadius: 10,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', background: 'var(--teal-soft)',
                    }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal)', lineHeight: 1 }}>
                        {new Date(ev.date).toLocaleString('en-IN', { month: 'short' }).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--teal)', lineHeight: 1 }}>
                        {new Date(ev.date + 'T12:00').getDate()}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{ev.title}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={`cal-event ${tag.cls}`}>{tag.label}</span>
                        {ev.time && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>🕐 {ev.time}</span>}
                      </div>
                      {ev.note && <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>{ev.note}</div>}
                    </div>
                    {isAuthorized && !ev.isStatic && (
                      <button className="btn btn--danger btn--sm btn--icon" onClick={() => onDelete(ev.id)} title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Add Event Modal */}
      {showForm && createPortal(
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Add Family Event 📅</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="field">
                  <label>Event Title</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange}
                    placeholder="e.g. Amishi's birthday party" required />
                </div>
                <div className="form-grid form-grid--2">
                  <div className="field">
                    <label>Date</label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required />
                  </div>
                  <div className="field">
                    <label>Time (optional)</label>
                    <input type="time" name="time" value={form.time} onChange={handleChange} />
                  </div>
                </div>
                <div className="field">
                  <label>Tag</label>
                  <select name="tag" value={form.tag} onChange={handleChange}>
                    {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Note (optional)</label>
                  <textarea name="note" value={form.note} onChange={handleChange}
                    placeholder="Additional details…" style={{ minHeight: 70 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : '📅 Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
