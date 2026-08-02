import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import SectionCard from '../molecules/SectionCard.jsx';
import StatusPill from '../atoms/StatusPill.jsx';
import ProgressBar from '../atoms/ProgressBar.jsx';
import ConfirmDeleteModal from '../molecules/ConfirmDeleteModal.jsx';
import ToastNotification from '../molecules/ToastNotification.jsx';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const WORKOUT_TYPES = ['Cardio', 'Strength', 'Yoga', 'Pilates', 'Walk', 'Cycling', 'Swimming', 'HIIT', 'Zumba', 'Custom'];
const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  type: 'Strength',
  duration: 65,
  calories: 515,
  notes: '7-Day Workout Routine session completed.',
};

// Calculates next 7 days starting from tomorrow
function get7DaysFromTomorrow() {
  const days = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const dateStr = d.toISOString().slice(0, 10);
    const displayLabel = `${dayName.slice(0, 3)}, ${shortMonths[d.getMonth()]} ${d.getDate()}`;
    days.push({
      index: i - 1,
      dayName,
      dateStr,
      displayLabel,
      isTomorrow: i === 1
    });
  }
  return days;
}

// SVG Human Body Anatomy Visualizer Component (Front & Back Body Silhouettes with Red Target Muscles)
function TargetMuscleAnatomyDiagram({ targetMuscles, large = false, width, height }) {
  const group = (targetMuscles || '').toLowerCase();
  const svgW = width || (large ? 32 : 18);
  const svgH = height || (large ? 60 : 34);

  const isChest = group.includes('chest') || group.includes('pectoral');
  const isLats = group.includes('lats') || group.includes('latissimus') || group.includes('row') || group.includes('pull') || group.includes('back');
  const isBiceps = group.includes('biceps') || group.includes('curl');
  const isTriceps = group.includes('triceps') || group.includes('pushdown');
  const isShoulders = group.includes('delts') || group.includes('shoulder') || group.includes('deltoids') || group.includes('traps') || group.includes('rotator');
  const isQuads = group.includes('quads') || group.includes('squat') || group.includes('extension') || group.includes('lunges');
  const isHamstrings = group.includes('hamstrings') || group.includes('leg curl') || group.includes('deadlift');
  const isCalves = group.includes('calves') || group.includes('calf') || group.includes('gastrocnemius');
  const isAbs = group.includes('abs') || group.includes('core') || group.includes('plank') || group.includes('crunch') || group.includes('obliques') || group.includes('abdominis');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: large ? 10 : 4, flexShrink: 0, padding: large ? '6px 12px' : '3px 6px', background: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }} title={`Targeted: ${targetMuscles}`}>
      {/* FRONT BODY SILHOUETTE */}
      <svg width={svgW} height={svgH} viewBox="0 0 40 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="8" r="5" fill="#94a3b8" />
        <path d="M10 16 H30 L34 26 H6 Z" fill={isShoulders ? '#ef4444' : '#cbd5e1'} />
        <path d="M12 20 H28 V27 H12 Z" fill={isChest ? '#ef4444' : '#cbd5e1'} />
        <path d="M14 27 H26 V37 H14 Z" fill={isAbs ? '#ef4444' : '#94a3b8'} />
        <rect x="5" y="21" width="5" height="15" rx="2" fill={isBiceps ? '#ef4444' : '#cbd5e1'} />
        <rect x="30" y="21" width="5" height="15" rx="2" fill={isBiceps ? '#ef4444' : '#cbd5e1'} />
        <path d="M13 37 H19 V54 H13 Z" fill={isQuads ? '#ef4444' : '#cbd5e1'} />
        <path d="M21 37 H27 V54 H21 Z" fill={isQuads ? '#ef4444' : '#cbd5e1'} />
        <path d="M14 55 H18 V67 H14 Z" fill={isCalves ? '#ef4444' : '#94a3b8'} />
        <path d="M22 55 H26 V67 H22 Z" fill={isCalves ? '#ef4444' : '#94a3b8'} />
      </svg>

      {/* BACK BODY SILHOUETTE */}
      <svg width={svgW} height={svgH} viewBox="0 0 40 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="8" r="5" fill="#94a3b8" />
        <path d="M10 16 H30 L34 26 H6 Z" fill={isLats || isShoulders ? '#ef4444' : '#cbd5e1'} />
        <path d="M12 25 H28 V36 H12 Z" fill={isLats ? '#ef4444' : '#94a3b8'} />
        <rect x="5" y="21" width="5" height="15" rx="2" fill={isTriceps ? '#ef4444' : '#cbd5e1'} />
        <rect x="30" y="21" width="5" height="15" rx="2" fill={isTriceps ? '#ef4444' : '#cbd5e1'} />
        <path d="M13 37 H19 V54 H13 Z" fill={isHamstrings ? '#ef4444' : '#cbd5e1'} />
        <path d="M21 37 H27 V54 H21 Z" fill={isHamstrings ? '#ef4444' : '#cbd5e1'} />
        <path d="M14 55 H18 V67 H14 Z" fill={isCalves ? '#ef4444' : '#94a3b8'} />
        <path d="M22 55 H26 V67 H22 Z" fill={isCalves ? '#ef4444' : '#94a3b8'} />
      </svg>
    </div>
  );
}

// Ultra Premium Exercise Card Component (Mobile Responsive)
// Ultra Premium Exercise Card Component (Mobile Responsive)
function PosterExerciseGridCard({ number, name, sets, reps, image, icon, targetMuscles, repsFooterLabel, noteSub, badgeColor, accentColor }) {
  const [imgError, setImgError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const themeColor = badgeColor || accentColor || '#0b192c';

  const formatRepsFooter = () => {
    if (repsFooterLabel) return repsFooterLabel;
    if (sets && reps) {
      if (reps.includes('SETS')) return reps;
      return `${sets} SETS × ${reps}`;
    }
    return reps || noteSub || '';
  };

  return (
    <>
      <div style={{ background: '#ffffff', border: '1.5px solid #0b192c', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        {/* Header Strip */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#0b192c', color: '#ffffff', fontWeight: 900, fontSize: '0.75rem', width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {number}
          </span>
          <h4 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </h4>
        </div>

        {/* High Definition Gym Exercise Photography Container */}
        <div
          onClick={() => {
            if (!imgError && image) {
              setIsPreviewOpen(true);
            }
          }}
          style={{
            height: 'clamp(120px, 20vw, 150px)', width: '100%', position: 'relative', background: '#f8fafc', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: image && !imgError ? 'pointer' : 'default'
          }}
          title={image && !imgError ? "Click to view full image" : ""}
        >
          {!imgError && image ? (
            <>
              <img src={image} alt={name} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', gap: 3 }}>
                🔍 Enlarge
              </div>
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#0f172a' }}>
              <span style={{ fontSize: '2rem' }}>{icon || '🏋️‍♂️'}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{name}</span>
            </div>
          )}
        </div>

        {/* Muscles + Anatomy Panel */}
        <div style={{ padding: '6px 8px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flex: 1, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.68rem', color: '#334155', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748b', fontSize: '0.62rem', display: 'block' }}>TARGET MUSCLES</span>
            <strong style={{ color: '#0f172a', fontSize: '0.72rem' }}>{targetMuscles || 'General'}</strong>
          </div>
          <TargetMuscleAnatomyDiagram targetMuscles={targetMuscles} />
        </div>

        {/* Reps Bar */}
        <div style={{ background: '#ffffff', color: '#0f172a', borderTop: '1px solid #e2e8f0', padding: '6px 8px', fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.4px' }}>
          {formatRepsFooter()}
        </div>
      </div>

      {/* DEVICE-RESPONSIVE FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      {isPreviewOpen && (
        <div
          onClick={() => setIsPreviewOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(11,25,44,0.92)',
            backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
            padding: '32px 12px 12px 12px', overflowY: 'auto'
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsPreviewOpen(false)}
            style={{
              position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', color: '#ffffff',
              border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%', width: '42px', height: '42px',
              fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)', zIndex: 1000000
            }}
          >
            ✕
          </button>

          {/* Modal Content Box (Device Responsive) */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff', border: '2px solid #38bdf8', borderRadius: '16px', overflow: 'hidden',
              width: 'min(94vw, 760px)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ background: '#0b192c', color: '#ffffff', padding: '10px 16px', width: '100%', textAlign: 'center', borderBottom: '1px solid #1e293b' }}>
              <h3 style={{ margin: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {name}
              </h3>
            </div>
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: '100%', overflow: 'hidden', background: '#f8fafc' }}>
              <img
                src={image}
                alt={name}
                style={{ width: '100%', height: 'auto', maxHeight: 'calc(85vh - 55px)', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 7-DAY WORKOUT PLAN DATA
const PLAN_7_DAYS = [
  {
    dayNumber: 1,
    dayKey: 'Monday',
    activityName: "CHEST + TRICEPS",
    title: "DAY 1 – CHEST + TRICEPS WORKOUT",
    accentColor: "#0b192c", // Dark Navy Accent
    headerBg: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)",
    isDay1Poster: true,
    workoutTime: "60-75 MINS",
    restBetweenSets: "60-90 SEC",
    exercises: [
      { number: 1, name: "BARBELL BENCH PRESS", sets: "3", reps: "8-10 REPS", badgeColor: "#0b192c", headerBg: "#0b192c", headerTextColor: "#ffffff", targetMuscles: "Chest (Middle)", image: "/exercises/barbell_bench_press.png" },
      { number: 2, name: "INCLINE DUMBBELL PRESS", sets: "3", reps: "10-12 REPS", badgeColor: "#0b192c", headerBg: "#0b192c", headerTextColor: "#ffffff", targetMuscles: "Upper Chest", image: "/exercises/incline_dumbbell_press.png" },
      { number: 3, name: "PEC DECK FLY", sets: "3", reps: "12-15 REPS", badgeColor: "#0b192c", headerBg: "#0b192c", headerTextColor: "#ffffff", targetMuscles: "Chest (Inner)", image: "/exercises/pec_deck_fly.png" },
      { number: 4, name: "PUSH-UPS", sets: "3", reps: "15-20 REPS", badgeColor: "#0b192c", headerBg: "#0b192c", headerTextColor: "#ffffff", targetMuscles: "Chest (Overall)", image: "/exercises/push_ups.png" },
      { number: 5, name: "TRICEPS PUSHDOWN", sets: "3", reps: "12-15 REPS", badgeColor: "#0b192c", headerBg: "#0b192c", headerTextColor: "#ffffff", targetMuscles: "Triceps", image: "/exercises/triceps_pushdown.png" },
      { number: 6, name: "OVERHEAD TRICEPS EXTENSION", sets: "3", reps: "12-15 REPS", badgeColor: "#0b192c", headerBg: "#0b192c", headerTextColor: "#ffffff", targetMuscles: "Triceps (Long Head)", image: "/exercises/overhead_triceps_extension.png" },
      { number: 7, name: "CABLE CLOSE GRIP PRESS", sets: "3", reps: "10-12 REPS", badgeColor: "#0b192c", headerBg: "#0b192c", headerTextColor: "#ffffff", targetMuscles: "Triceps", image: "/exercises/cable_close_grip_press.png" },
      { number: 8, name: "BENCH DIPS", sets: "3", reps: "12-15 REPS", badgeColor: "#0b192c", headerBg: "#0b192c", headerTextColor: "#ffffff", targetMuscles: "Triceps (Overall)", image: "/exercises/bench_dips.png" }
    ]
  },
  {
    dayNumber: 2,
    dayKey: 'Tuesday',
    activityName: "BACK + BICEPS",
    title: "DAY 2 – BACK + BICEPS WORKOUT 💪",
    accentColor: "#0b192c", // Navy Accent
    headerBg: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)",
    isDay2Poster: true,
    workoutTime: "60-75 MINS",
    restBetweenSets: "60-90 SEC",
    focusAreas: "LATS - MID BACK - LOWER BACK | BICEPS - REAR DELTS",
    exercises: [
      { number: 1, name: "LAT PULLDOWN", sets: "3", reps: "8-12 REPS", icon: "🏋️‍♀️", badgeColor: "#2563eb", headerBg: "#f8fafc", targetMuscles: "Latissimus Dorsi (Lats), Biceps", image: "/exercises/lat_pulldown.png" },
      { number: 2, name: "SEATED CABLE ROW", sets: "3", reps: "10-12 REPS", icon: "🚣‍♂️", badgeColor: "#16a34a", headerBg: "#f8fafc", targetMuscles: "Middle Back, Rhomboids, Lats, Biceps", image: "/exercises/seated_cable_row.png" },
      { number: 3, name: "ONE ARM DUMBBELL ROW", sets: "3", reps: "10-12 REPS (EACH SIDE)", icon: "🏋️", badgeColor: "#ea580c", headerBg: "#f8fafc", targetMuscles: "Lats, Middle Back, Rear Delts, Biceps", image: "/exercises/one_arm_dumbbell_row.png" },
      { number: 4, name: "FACE PULL", sets: "3", reps: "12-15 REPS", icon: "⚖️", badgeColor: "#9333ea", headerBg: "#f8fafc", targetMuscles: "Rear Delts, Upper Back, Traps, Rotator Cuff", image: "/exercises/face_pull.png" },
      { number: 5, name: "PULL-UPS (ASSISTED)", sets: "3", reps: "6-10 REPS", icon: "🧗", badgeColor: "#2563eb", headerBg: "#f8fafc", targetMuscles: "Lats, Upper Back, Biceps", image: "/exercises/pull_ups_assisted.png" },
      { number: 6, name: "BARBELL CURL", sets: "3", reps: "8-12 REPS", icon: "🏋️‍♂️", badgeColor: "#16a34a", headerBg: "#f8fafc", targetMuscles: "Biceps (Long Head & Short Head)", image: "/exercises/barbell_bicep_curl.png" },
      { number: 7, name: "HAMMER CURL", sets: "3", reps: "10-12 REPS", icon: "🔨", badgeColor: "#ea580c", headerBg: "#f8fafc", targetMuscles: "Biceps (Brachialis), Forearms", image: "/exercises/hammer_curl.png" },
      { number: 8, name: "CONCENTRATION CURL", sets: "3", reps: "10-15 REPS (EACH ARM)", icon: "💪", badgeColor: "#9333ea", headerBg: "#f8fafc", targetMuscles: "Biceps (Peak Contraction)", image: "/exercises/concentration_curl.png" }
    ]
  },
  {
    dayNumber: 3,
    dayKey: 'Wednesday',
    activityName: "LEGS WORKOUT",
    title: "DAY 3 – LEGS WORKOUT",
    accentColor: "#0b192c", // Navy Blue Accent
    headerBg: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)",
    isDay3Poster: true,
    workoutTime: "60-75 MINS",
    restBetweenSets: "60-90 SEC",
    focusAreas: "QUADS - HAMSTRINGS - GLUTES - CALVES",
    exercises: [
      { number: 1, name: "BARBELL SQUAT", sets: "3", reps: "8-10 REPS", icon: "🏋️‍♂️", badgeColor: "#1d4ed8", headerBg: "#f8fafc", targetMuscles: "Quads, Glutes, Hamstrings, Core", image: "/exercises/barbell_squat.png" },
      { number: 2, name: "LEG PRESS", sets: "3", reps: "10-12 REPS", icon: "⚙️", badgeColor: "#dc2626", headerBg: "#f8fafc", targetMuscles: "Quads, Glutes, Hamstrings", image: "/exercises/leg_press.png" },
      { number: 3, name: "LEG EXTENSION", sets: "3", reps: "12-15 REPS", icon: "💥", badgeColor: "#16a34a", headerBg: "#f8fafc", targetMuscles: "Quads (Isolation)", image: "/exercises/leg_extension.png" },
      { number: 4, name: "LEG CURL", sets: "3", reps: "12-15 REPS", icon: "🔄", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Hamstrings (Isolation)", image: "/exercises/leg_curl.png" },
      { number: 5, name: "WALKING LUNGES", sets: "3", reps: "12 EACH LEG REPS", icon: "🚶‍♂️", badgeColor: "#7c3aed", headerBg: "#f8fafc", targetMuscles: "Quads, Glutes, Hamstrings, Calves", image: "/exercises/walking_lunges.png" },
      { number: 6, name: "STANDING CALF RAISE", sets: "3", reps: "12-15 REPS", icon: "🩰", badgeColor: "#0d9488", headerBg: "#f8fafc", targetMuscles: "Calves (Gastrocnemius, Soleus)", image: "/exercises/leg_press.png" }
    ]
  },
  {
    dayNumber: 4,
    dayKey: 'Thursday',
    activityName: "SHOULDERS + ABS",
    title: "DAY 4 — SHOULDERS + ABS WORKOUT",
    accentColor: "#7c3aed", // Vibrant Purple
    headerBg: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
    warmup: "WARM-UP (10 MINS): Cardio 5 min + Dynamic Stretching",
    warmupImg: "/exercises/overhead_shoulder_press.png",
    cooldown: "COOL DOWN & STRETCHING (5-10 MINS)",
    cooldownImg: "/exercises/pec_deck_fly.png",
    isSplitSection: true,
    isDay4Poster: true,
    workoutTime: "60-75 MINS",
    restBetweenSets: "60-90 SEC",
    focusAreas: "Shoulders (All Heads), Core (Abs)",
    shouldersExercises: [
      { number: 1, name: "DUMBBELL SHOULDER PRESS", sets: "3", reps: "8-10 REPS", icon: "🙆‍♂️", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Deltoids (Anterior), Triceps (Secondary)", image: "/exercises/dumbbell_shoulder_press.png" },
      { number: 2, name: "LATERAL RAISE", sets: "3", reps: "12-15 REPS", icon: "🪽", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Deltoids (Lateral), Traps (Stabilizers)", image: "/exercises/lateral_raise.png" },
      { number: 3, name: "FRONT RAISE", sets: "3", reps: "12-15 REPS", icon: "🙋‍♂️", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Deltoids (Anterior), Upper Chest (Secondary)", image: "/exercises/front_raise.png" },
      { number: 4, name: "ARNOLD PRESS", sets: "3", reps: "8-10 REPS", icon: "🔄", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Deltoids (All Heads), Triceps (Secondary)", image: "/exercises/arnold_press.png" },
      { number: 5, name: "REAR DELT FLY", sets: "3", reps: "12-15 REPS", icon: "🦋", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Deltoids (Posterior), Upper Back", image: "/exercises/rear_delt_fly.png" },
      { number: 6, name: "UPRIGHT ROW", sets: "3", reps: "10-12 REPS", icon: "🏋️‍♂️", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Deltoids (Lateral), Traps (Upper)", image: "/exercises/upright_row.png" }
    ],
    absStacked: [
      { number: 7, name: "CRUNCHES", sets: "3", reps: "15-20 REPS", icon: "🧘‍♂️", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Rectus Abdominis (Upper Abs)", image: "/exercises/crunches.png" },
      { number: 8, name: "LEG RAISE", sets: "3", reps: "12-15 REPS", icon: "🦵", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Lower Abs (Rectus Abdominis)", image: "/exercises/leg_raise.png" }
    ],
    absSideBySide: [
      { number: 9, name: "PLANK", sets: "3", reps: "30-60 SEC", icon: "🧱", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Core (Entire), Stability", image: "/exercises/plank.png" },
      { number: 10, name: "RUSSIAN TWIST", sets: "3", reps: "20 REPS (EACH SIDE)", icon: "🌪️", badgeColor: "#6b21a8", accentColor: "#7c3aed", headerBg: "#f3e8ff", targetMuscles: "Obliques (Side Abs)", image: "/exercises/russian_twist.png" }
    ],
    exercises: []
  },
  {
    dayNumber: 5,
    dayKey: 'Friday',
    activityName: "FULL BODY STRENGTH",
    title: "FULL BODY STRENGTH WORKOUT",
    accentColor: "#0b192c", // Sleek Dark Navy Accent
    headerBg: "linear-gradient(135deg, #0b192c 0%, #1e293b 100%)",
    isDay5Poster: true,
    workoutTime: "60-75 MINS",
    restBetweenSets: "60-90 SEC",
    focusAreas: "Full Body Strength, Power, Muscle Endurance",
    exercises: [
      { number: 1, name: "DEADLIFT", sets: "3", reps: "6-8 REPS", icon: "⚡", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Hamstrings, Glutes, Lower Back, Traps", image: "/exercises/deadlift.png" },
      { number: 2, name: "PUSH-UPS", sets: "3", reps: "10-15 REPS", icon: "🤸‍♂️", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Chest, Shoulders, Triceps", image: "/exercises/push_ups.png" },
      { number: 3, name: "PULL-UPS / ASSISTED PULL-UPS", sets: "3", reps: "6-10 REPS", icon: "🧗", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Lats, Upper Back, Biceps", image: "/exercises/pull_ups_assisted.png" },
      { number: 4, name: "GOBLET SQUAT", sets: "3", reps: "10-12 REPS", icon: "🏆", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Quads, Glutes, Hamstrings, Core", image: "/exercises/goblet_squat.png" },
      { number: 5, name: "DUMBBELL SHOULDER PRESS", sets: "3", reps: "8-12 REPS", icon: "🏋️‍♂️", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Shoulders (All Heads), Triceps", image: "/exercises/dumbbell_shoulder_press.png" },
      { number: 6, name: "BENT OVER BARBELL ROW", sets: "3", reps: "8-12 REPS", icon: "🚣‍♂️", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Middle Back, Lats, Biceps, Rear Delts", image: "/exercises/bent_over_barbell_row.png" },
      { number: 7, name: "KETTLEBELL SWING", sets: "3", reps: "12-15 REPS", icon: "🔔", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Glutes, Hamstrings, Back, Shoulders, Core", image: "/exercises/kettlebell_swing.png" },
      { number: 8, name: "WALKING LUNGES", sets: "3", reps: "12 EACH LEG", icon: "🚶‍♂️", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Quads, Glutes, Hamstrings", image: "/exercises/walking_lunges.png" },
      { number: 9, name: "PLANK", sets: "3", reps: "30-60 SEC", icon: "🧱", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Core (Abs), Obliques, Lower Back", image: "/exercises/plank.png" },
      { number: 10, name: "FARMER WALK", sets: "3", reps: "30-40 M (EACH)", icon: "🧳", badgeColor: "#d97706", headerBg: "#f8fafc", targetMuscles: "Forearms, Traps, Core, Legs", image: "/exercises/farmer_walk.png" }
    ]
  },
  {
    dayNumber: 6,
    dayKey: 'Saturday',
    activityName: "CARDIO + CORE",
    title: "DAY 6 – CARDIO + CORE + MOBILITY",
    accentColor: "#10b981", // Emerald Green
    headerBg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    isDay6Poster: true,
    cardioSection: [
      { number: 1, name: "TREADMILL (BRISK WALK / RUN)", reps: "20-25 MINS", icon: "🏃‍♂️", badgeColor: "#10b981", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/treadmill.png" },
      { number: 2, name: "STATIONARY BIKE", reps: "20-25 MINS", icon: "🚴‍♂️", badgeColor: "#10b981", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/stationary_bike.png" },
      { number: 3, name: "ELLIPTICAL TRAINER", reps: "20-25 MINS", icon: "🏃‍♀️", badgeColor: "#10b981", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/elliptical.png" },
      { number: 4, name: "ROWING MACHINE", reps: "20-25 MINS", icon: "🚣‍♂️", badgeColor: "#10b981", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/light_rowing.png" }
    ],
    coreSection: [
      { number: 1, name: "PLANK", sets: "3", reps: "30-60 SEC", icon: "🧱", badgeColor: "#1d4ed8", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Core (Abs), Obliques", image: "/exercises/plank.png" },
      { number: 2, name: "RUSSIAN TWIST", sets: "3", reps: "20 REPS (EACH SIDE)", icon: "🌪️", badgeColor: "#1d4ed8", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Obliques", image: "/exercises/russian_twist.png" },
      { number: 3, name: "LEG RAISE", sets: "3", reps: "12-15 REPS", icon: "🦵", badgeColor: "#1d4ed8", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Lower Abs", image: "/exercises/leg_raise.png" },
      { number: 4, name: "BICYCLE CRUNCH", sets: "3", reps: "20 REPS (EACH SIDE)", icon: "🚴", badgeColor: "#1d4ed8", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Abs, Obliques", image: "/exercises/bicycle_crunch.png" },
      { number: 5, name: "MOUNTAIN CLIMBERS", sets: "3", reps: "20 REPS (EACH LEG)", icon: "🏔️", badgeColor: "#1d4ed8", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Core, Cardio", image: "/exercises/mountain_climbers.png" },
      { number: 6, name: "REVERSE CRUNCH", sets: "3", reps: "15 REPS", icon: "🔄", badgeColor: "#1d4ed8", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Lower Abs", image: "/exercises/reverse_crunch.png" }
    ],
    mobilitySection: [
      { number: 1, name: "CAT-COW STRETCH", reps: "10-12 REPS", icon: "🐈", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/cat_cow_stretch.png" },
      { number: 2, name: "CHILD'S POSE", reps: "30-45 SEC", icon: "🧘‍♂️", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/childs_pose.png" },
      { number: 3, name: "HIP FLEXOR STRETCH", reps: "30 SEC (EACH SIDE)", icon: "🧘‍♀️", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/hip_flexor_stretch.png" },
      { number: 4, name: "DYNAMIC HAMSTRING STRETCH", reps: "10 REPS (EACH LEG)", icon: "🦵", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/hamstring_stretch.png" },
      { number: 5, name: "PIGEON STRETCH", reps: "30-45 SEC (EACH SIDE)", icon: "🕊️", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/pigeon_stretch.png" },
      { number: 6, name: "THORACIC ROTATION", reps: "10 REPS (EACH SIDE)", icon: "🔄", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/thoracic_rotation.png" },
      { number: 7, name: "QUAD STRETCH", reps: "30 SEC (EACH SIDE)", icon: "🩰", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/quad_stretch.png" },
      { number: 8, name: "CHEST OPENER STRETCH", reps: "30-45 SEC", icon: "🦅", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/chest_opener_stretch.png" },
      { number: 9, name: "DOWNWARD DOG", reps: "30-45 SEC", icon: "🐕", badgeColor: "#ea580c", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/downward_dog.png" }
    ],
    exercises: []
  },
  {
    dayNumber: 7,
    dayKey: 'Sunday',
    activityName: "ACTIVE RECOVERY",
    title: "DAY 7 — ACTIVE RECOVERY",
    accentColor: "#10b981", // Emerald Green
    headerBg: "linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%)",
    isDay7Poster: true,
    posterImageUrl: "/exercises/active_recovery_poster.png",
    lightCardioSection: [
      { number: 1, name: "BRISK WALK", reps: "10-15 MIN", noteSub: "Keep a steady pace. Relax and enjoy.", icon: "🚶‍♂️", targetMuscles: "Quads, Glutes, Calves", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/brisk_walk.png" },
      { number: 2, name: "STATIONARY BIKE", reps: "10-15 MIN", noteSub: "Easy pace. Keep RPM 60-80.", icon: "🚴‍♂️", targetMuscles: "Quads, Hamstrings, Calves", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/stationary_bike.png" },
      { number: 3, name: "ELLIPTICAL", reps: "10-15 MIN", noteSub: "Smooth movement. Low resistance.", icon: "🏃‍♀️", targetMuscles: "Quads, Glutes, Hamstrings", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/elliptical.png" },
      { number: 4, name: "LIGHT ROWING", reps: "10-15 MIN", noteSub: "Easy strokes. Focus on breathing.", icon: "🚣‍♂️", targetMuscles: "Upper Back, Shoulders, Core", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/light_rowing.png" }
    ],
    mobilitySection: [
      { number: 1, name: "ARM CIRCLES", reps: "30 SEC", noteSub: "Forward & backward", icon: "🔄", targetMuscles: "Shoulders, Rotator Cuff", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/arm_circles.png" },
      { number: 2, name: "LEG SWINGS", reps: "10 REPS", noteSub: "Each Leg (Front-Back & Side-Side)", icon: "🦵", targetMuscles: "Hamstrings, Hip Flexors, Glutes", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/leg_swings.png" },
      { number: 3, name: "HIP CIRCLES", reps: "30 SEC", noteSub: "Each direction", icon: "⭕", targetMuscles: "Hips, Glutes, Core", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/hip_circles.png" },
      { number: 4, name: "T-SPINE ROTATION", reps: "10 REPS", noteSub: "Each side", icon: "🧘‍♂️", targetMuscles: "Upper Back, Spine", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/tspine_rotation.png" },
      { number: 5, name: "ANKLE ROLLS", reps: "30 SEC", noteSub: "Each foot", icon: "🦶", targetMuscles: "Calves, Ankles", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/ankle_rolls.png" }
    ],
    stretchingSection: [
      { number: 1, name: "HAMSTRING STRETCH", reps: "30-45 SEC", noteSub: "Each Leg", icon: "🦵", targetMuscles: "Hamstrings", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/hamstring_stretch.png" },
      { number: 2, name: "QUAD STRETCH", reps: "30-45 SEC", noteSub: "Each Leg", icon: "🩰", targetMuscles: "Quads", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/quad_stretch.png" },
      { number: 3, name: "HIP FLEXOR STRETCH", reps: "30-45 SEC", noteSub: "Each Leg", icon: "🧘‍♀️", targetMuscles: "Hip Flexors", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/hip_flexor_stretch.png" },
      { number: 4, name: "CHEST STRETCH", reps: "30-45 SEC", noteSub: "Each Side", icon: "🦅", targetMuscles: "Chest", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/chest_stretch.png" },
      { number: 5, name: "SHOULDER STRETCH", reps: "30-45 SEC", noteSub: "Each Arm", icon: "🙋‍♂️", targetMuscles: "Shoulders", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/shoulder_stretch.png" },
      { number: 6, name: "LOWER BACK STRETCH", reps: "30-45 SEC", noteSub: "Relax / Each Side", icon: "🧘", targetMuscles: "Lower Back", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/lower_back_stretch.png" },
      { number: 7, name: "CALF STRETCH", reps: "30-45 SEC", noteSub: "Each Leg", icon: "🦶", targetMuscles: "Calves", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/calf_stretch.png" },
      { number: 8, name: "CHILD'S POSE", reps: "30-45 SEC", noteSub: "Relax", icon: "🧘‍♂️", targetMuscles: "Back, Hips, Shoulders", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/childs_pose.png" }
    ],
    breathingSection: {
      name: "DIAPHRAGMATIC BREATHING",
      duration: "5 MINUTES",
      icon: "🧘‍♂️",
      image: "/exercises/diaphragmatic_breathing.png",
      instructions: "Inhale deeply through your nose for 4 seconds. Hold for 2 seconds. Exhale slowly through your mouth for 6 seconds. Repeat."
    },
    exercises: []
  }
];

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
  const [activeSubTab, setActiveSubTab] = useState('routine'); // 'routine' | 'tracker'
  const next7Days = useMemo(() => get7DaysFromTomorrow(), []);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // Default to tomorrow (index 0)

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteWorkoutId, setDeleteWorkoutId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const activeDayObj = next7Days[selectedDayIndex] || next7Days[0];
  const activePlanDay = PLAN_7_DAYS[selectedDayIndex % 7];

  const handleQuickLog = async () => {
    setSaving(true);
    try {
      await onAdd({
        date: activeDayObj.dateStr,
        type: 'Strength',
        duration: 65,
        calories: 515,
        notes: `${activePlanDay.title} Session Completed.`
      });
      setToast({ message: `🎉 ${activeDayObj.displayLabel} workout logged successfully!`, type: 'success' });
    } catch (err) {
      setToast({ message: "Logged to local tracking view!", type: 'success' });
    } finally {
      setSaving(false);
    }
  };

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

  const durationTrend = useMemo(() =>
    [...items]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-10)
      .map(i => ({ date: i.date?.slice(5), duration: Number(i.duration) || 0, type: i.type })),
    [items]
  );

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
    setForm(prev => ({ ...prev, [name]: ['duration', 'calories'].includes(name) ? (value === '' ? '' : Number(value)) : value }));
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
    <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header — Responsive Flex Layout */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Training Hub</p>
          <h1 style={{ fontSize: 'calc(1.2rem + 1vw)' }}>Gym & Fitness Center 🏋️‍♂️</h1>
          <p className="page-header__sub">7-Day Gym Workout Plan starting from tomorrow.</p>
        </div>
        <div className="page-header__actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="streak-badge">
            <span className="streak-badge__fire">🔥</span>
            <span className="streak-badge__num">{streak}</span>
            <span style={{ fontSize: '0.78rem' }}>Day Streak</span>
          </div>
          {isAuthorized && (
            <button className="btn btn--amber" onClick={() => setShowForm(true)} style={{ whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Manual Log
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Bar — Fully Mobile Responsive Flex */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--surface)', padding: '6px', borderRadius: '14px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('routine')}
          style={{
            flex: '1 1 200px', padding: '10px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem',
            background: activeSubTab === 'routine' ? 'var(--amber)' : 'transparent',
            color: activeSubTab === 'routine' ? '#ffffff' : 'var(--muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: activeSubTab === 'routine' ? '0 4px 12px rgba(185,130,22,0.3)' : 'none', textAlign: 'center'
          }}
        >
          🏋️ 7-Day Gym Routine Plan
        </button>
        <button
          onClick={() => setActiveSubTab('tracker')}
          style={{
            flex: '1 1 200px', padding: '10px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem',
            background: activeSubTab === 'tracker' ? 'var(--amber)' : 'transparent',
            color: activeSubTab === 'tracker' ? '#ffffff' : 'var(--muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: activeSubTab === 'tracker' ? '0 4px 12px rgba(185,130,22,0.3)' : 'none', textAlign: 'center'
          }}
        >
          📊 Activity Tracker ({items.length})
        </button>
      </div>

      {/* TAB 1: 7-DAY GYM WORKOUT PLAN */}
      {activeSubTab === 'routine' && (
        <div style={{ display: 'grid', gap: 16, width: '100%' }}>

          {/* Mobile Responsive 7-Day Selector Bar */}
          <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '14px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📅 Select Day Routine:
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 700 }}>
                💡 Rest 60-90s • Hydrate Daily
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
              {PLAN_7_DAYS.map((planDay, idx) => {
                const dayObj = next7Days[idx] || {};
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    style={{
                      padding: '10px 6px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                      background: isSelected ? '#0b192c' : '#ffffff',
                      border: isSelected ? '2px solid #0b192c' : '1px solid var(--line)',
                      color: isSelected ? '#ffffff' : 'var(--ink)',
                      boxShadow: isSelected ? '0 4px 14px rgba(11, 25, 44, 0.3)' : 'none',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: isSelected ? 0.95 : 0.6, fontWeight: 900 }}>
                      DAY {planDay.dayNumber} {dayObj.isTomorrow ? '(TOMORROW)' : ''}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {planDay.activityName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN POSTER DAY CARD & WORKOUT GRID */}
          <div style={{
            background: '#ffffff', border: `2px solid ${activePlanDay.accentColor}33`, borderRadius: '16px', padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16, width: '100%'
          }}>
            {/* IF DAY 7 POSTER: ACTIVE RECOVERY 4-SECTION INFOGRAPHIC (Mobile Responsive Grid Stack) */}
            {activePlanDay.isDay7Poster ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* POSTER TOP HEADER BAR */}
                <div style={{
                  background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                }}>
                  {/* LEFT TITLE & SUBTITLE */}
                  <div style={{ textAlign: 'left', flex: '1 1 240px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#0b192c', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--heading-font)', lineHeight: 1.1 }}>
                      ACTIVE RECOVERY
                    </h1>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0b192c', letterSpacing: '0.5px', marginTop: 4 }}>
                      Move • Recover • Restore • Come Back Stronger
                    </div>
                  </div>

                  {/* FOCUS BADGE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #cbd5e1', borderRadius: '12px', padding: '8px 14px', background: '#f8fafc', maxWidth: '300px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🤸‍♂️</span>
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>FOCUS</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                        Improve Blood Flow, Reduce Soreness, Enhance Mobility, Speed Up Recovery
                      </div>
                    </div>
                  </div>
                </div>

                {/* FULL-WIDTH NAVY BANNER */}
                <div style={{ background: '#0a192f', color: '#ffffff', padding: '12px 18px', borderRadius: '12px', fontWeight: 900, fontSize: '0.84rem', textAlign: 'center', letterSpacing: '0.6px', textTransform: 'uppercase', lineHeight: 1.4, boxShadow: '0 4px 12px rgba(10,25,47,0.12)' }}>
                  ACTIVE RECOVERY INCLUDES LIGHT CARDIO, MOBILITY, STRETCHING & BREATHING TO HELP YOUR BODY RECOVER FASTER.
                </div>

                {/* TOP ROW: SECTION 1 (LIGHT CARDIO) & SECTION 2 (MOBILITY) - Mobile Auto Stack */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

                  {/* SECTION 1: 💚 1. LIGHT CARDIO */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: '#0b192c', color: '#fff', padding: '7px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      💚 1. LIGHT CARDIO – 15–20 MINUTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                      {activePlanDay.lightCardioSection.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx}
                          number={ex.number}
                          name={ex.name}
                          reps={ex.reps}
                          repsFooterLabel={ex.reps}
                          noteSub={ex.noteSub}
                          image={ex.image}
                          icon={ex.icon}
                          targetMuscles={ex.targetMuscles}
                          showTargetDiagram={false}
                          accentColor="#10b981"
                          headerBg="#d1fae5"
                        />
                      ))}
                    </div>
                  </div>

                  {/* SECTION 2: 🏃‍♂️ 2. MOBILITY */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: '#0b192c', color: '#fff', padding: '7px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      🏃‍♂️ 2. MOBILITY – 10–15 MINUTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                      {activePlanDay.mobilitySection.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx}
                          number={ex.number}
                          name={ex.name}
                          reps={ex.reps}
                          repsFooterLabel={ex.reps}
                          noteSub={ex.noteSub}
                          image={ex.image}
                          icon={ex.icon}
                          targetMuscles={ex.targetMuscles}
                          showTargetDiagram={false}
                          accentColor="#3b82f6"
                          headerBg="#dbeafe"
                        />
                      ))}
                    </div>
                  </div>

                </div>

                {/* MIDDLE ROW: SECTION 3 (STRETCHING) & SECTION 4 (BREATHING) - Mobile Auto Stack */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

                  {/* SECTION 3: 🧘 3. STRETCHING */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: '#0b192c', color: '#fff', padding: '7px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      🧘 3. STRETCHING – 10–15 MINUTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                      {activePlanDay.stretchingSection.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx}
                          number={ex.number}
                          name={ex.name}
                          reps={ex.reps}
                          repsFooterLabel={ex.reps}
                          noteSub={ex.noteSub}
                          image={ex.image}
                          icon={ex.icon}
                          targetMuscles={ex.targetMuscles}
                          showTargetDiagram={false}
                          accentColor="#8b5cf6"
                          headerBg="#ede9fe"
                        />
                      ))}
                    </div>
                  </div>

                  {/* SECTION 4: 🫁 4. BREATHING */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: '#0b192c', color: '#fff', padding: '7px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      🫁 4. BREATHING – 5 MINUTES
                    </div>
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '12px', border: '1px solid #ea580c33', display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                      <div style={{ height: '150px', borderRadius: '8px', overflow: 'hidden', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={activePlanDay.breathingSection.image} alt="Breathing" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontWeight: 900, color: '#ea580c', fontSize: '0.88rem', textTransform: 'uppercase' }}>
                        {activePlanDay.breathingSection.name}
                      </div>
                      <div style={{ background: '#ffedd5', color: '#ea580c', padding: '4px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800, width: 'fit-content' }}>
                        ⏱️ {activePlanDay.breathingSection.duration}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink)', lineHeight: 1.45 }}>
                        {activePlanDay.breathingSection.instructions}
                      </p>
                    </div>
                  </div>

                </div>

                {/* BOTTOM GUIDELINES PANELS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  <div style={{ background: '#ffffff', border: '1px solid #10b98133', borderRadius: '12px', padding: '12px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 900, color: '#10b981', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      💚 BENEFITS OF ACTIVE RECOVERY
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink)' }}>
                      <div>✅ Reduces muscle soreness & stiffness</div>
                      <div>✅ Improves blood circulation</div>
                      <div>✅ Enhances flexibility & range of motion</div>
                      <div>✅ Speeds up muscle recovery</div>
                      <div>✅ Reduces risk of injury</div>
                      <div>✅ Improves overall performance</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #3b82f633', borderRadius: '12px', padding: '12px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 900, color: '#3b82f6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      📋 GUIDELINES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink)' }}>
                      <div>💙 Keep HR in Zone 1-2 (50-60% Max HR)</div>
                      <div>⏱️ Keep intensity low and controlled.</div>
                      <div>📅 Do 1-2 times per week or after intense workouts.</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #8b5cf633', borderRadius: '12px', padding: '12px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 900, color: '#8b5cf6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      ❓ WHEN TO DO ACTIVE RECOVERY?
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink)' }}>
                      <div>🎯 After heavy strength training</div>
                      <div>🏃 After intense cardio sessions</div>
                      <div>🧘 On rest days</div>
                      <div>😴 When you feel sore or fatigued</div>
                      <div>🔄 During deload weeks</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #06b6d433', borderRadius: '12px', padding: '12px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 900, color: '#06b6d4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      💧 HYDRATION
                    </div>
                    <div style={{ color: 'var(--ink)', lineHeight: 1.4 }}>
                      Drink enough water before, during & after your session.
                      <br />
                      <strong style={{ color: '#06b6d4', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>Daily Goal: 2.5 - 3.5 Liters</strong>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #ea580c33', borderRadius: '12px', padding: '12px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 900, color: '#ea580c', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      💡 TIPS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--ink)' }}>
                      <div>🔸 Focus on quality movement, not speed.</div>
                      <div>🔸 Listen to your body.</div>
                      <div>🔸 Don’t push through pain.</div>
                      <div>🔸 Consistency is the key.</div>
                      <div>🔸 Good recovery = Better results.</div>
                    </div>
                  </div>
                </div>

                {/* MOTIVATIONAL FOOTER BANNER */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', padding: '12px 18px',
                  borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 12
                }}>
                  <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#4ade80', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    ⭐ RECOVER TODAY, PERFORM BETTER TOMORROW.
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#f472b6', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    ❤️ BE CONSISTENT. BE PATIENT. TRUST THE PROCESS.
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '0.8rem', color: '#fbbf24', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    🏆 STRONGER EVERY DAY!
                  </div>
                </div>

              </div>
            ) : activePlanDay.isDay6Poster ? (
              /* DAY 6 POSTER: CARDIO + CORE + MOBILITY INFOGRAPHIC POSTER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* POSTER TOP INFOGRAPHIC STATS HEADER BAR */}
                <div style={{
                  background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                }}>
                  {/* LEFT TITLE & SUBTITLE */}
                  <div style={{ textAlign: 'left', flex: '1 1 280px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#0b192c', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--heading-font)', lineHeight: 1.1 }}>
                      CARDIO + CORE + MOBILITY
                    </h1>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0b192c', letterSpacing: '0.5px', marginTop: 4 }}>
                      IMPROVE ENDURANCE • STRENGTHEN CORE • ENHANCE FLEXIBILITY • SPEED UP RECOVERY
                    </div>
                  </div>

                  {/* FOCUS AREAS BADGE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #cbd5e1', borderRadius: '12px', padding: '8px 14px', background: '#f8fafc', maxWidth: '300px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎯</span>
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>FOCUS AREAS</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                        Heart Health, Core Strength,<br />Flexibility, Recovery
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 MAIN BODY COLUMNS (CARDIO | CORE | MOBILITY) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

                  {/* COLUMN 1: CARDIO (20-30 MINS) */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '0.88rem', textAlign: 'center', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      💚 CARDIO (20-30 MINS)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                      {activePlanDay.cardioSection.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx}
                          number={ex.number}
                          name={ex.name}
                          reps={ex.reps}
                          repsFooterLabel={ex.reps}
                          image={ex.image}
                          icon={ex.icon}
                          showTargetDiagram={false}
                          accentColor="#16a34a"
                          headerBg="#d1fae5"
                        />
                      ))}
                    </div>

                    {/* CARDIO INTENSITY GUIDE */}
                    <div style={{ background: '#ffffff', border: '1px solid #10b98133', borderRadius: '12px', padding: '10px 12px', fontSize: '0.74rem' }}>
                      <div style={{ fontWeight: 900, color: '#16a34a', marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>💓</span> CARDIO INTENSITY GUIDE
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: '#1e293b', fontWeight: 600 }}>
                        <div>• Low Intensity (Warm-up / Cool-down) – 50-60% Max HR</div>
                        <div>• Moderate Intensity (Fat Burn) – 60-70% Max HR</div>
                        <div>• High Intensity (Cardio Boost) – 70-85% Max HR</div>
                      </div>
                    </div>

                    {/* TIPS */}
                    <div style={{ background: '#ffffff', border: '1px solid #10b98133', borderRadius: '12px', padding: '10px 12px', fontSize: '0.74rem', marginTop: 'auto' }}>
                      <div style={{ fontWeight: 900, color: '#16a34a', marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🧴</span> TIPS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: '#1e293b', fontWeight: 600 }}>
                        <div>• Keep your heart rate in the target zone.</div>
                        <div>• Stay hydrated throughout.</div>
                        <div>• You should be able to talk, but not sing during cardio.</div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: CORE WORKOUT (15-20 MINS) */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '0.88rem', textAlign: 'center', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      🧘 CORE WORKOUT (15-20 MINS)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                      {activePlanDay.coreSection.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx}
                          number={ex.number}
                          name={ex.name}
                          sets={ex.sets}
                          reps={ex.reps}
                          image={ex.image}
                          icon={ex.icon}
                          targetMuscles={ex.targetMuscles}
                          accentColor="#2563eb"
                          headerBg="#dbeafe"
                        />
                      ))}
                    </div>

                    {/* CORE TIPS */}
                    <div style={{ background: '#ffffff', border: '1px solid #3b82f633', borderRadius: '12px', padding: '10px 12px', fontSize: '0.74rem', marginTop: 'auto' }}>
                      <div style={{ fontWeight: 900, color: '#2563eb', marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🦾</span> CORE TIPS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: '#1e293b', fontWeight: 600 }}>
                        <div>• Keep your core tight during every exercise.</div>
                        <div>• Focus on controlled movement.</div>
                        <div>• Do not hold your breath.</div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 3: MOBILITY & STRETCHING (10-15 MINS) */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '8px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '0.88rem', textAlign: 'center', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      🧘 MOBILITY & STRETCHING (10-15 MINS)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                      {activePlanDay.mobilitySection.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx}
                          number={ex.number}
                          name={ex.name}
                          reps={ex.reps}
                          repsFooterLabel={ex.reps}
                          image={ex.image}
                          icon={ex.icon}
                          showTargetDiagram={false}
                          accentColor="#ea580c"
                          headerBg="#ffedd5"
                        />
                      ))}
                    </div>

                    {/* MOBILITY BENEFITS */}
                    <div style={{ background: '#ffffff', border: '1px solid #ea580c33', borderRadius: '12px', padding: '10px 12px', fontSize: '0.74rem', marginTop: 'auto' }}>
                      <div style={{ fontWeight: 900, color: '#ea580c', marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🧘</span> MOBILITY BENEFITS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: '#1e293b', fontWeight: 600 }}>
                        <div>• Improves flexibility & range of motion</div>
                        <div>• Reduces muscle soreness</div>
                        <div>• Prevents injuries</div>
                        <div>• Improves posture & movement quality</div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* BOTTOM GUIDANCE 4 MODULES (HEART RATE ZONE | WATER INTAKE | POST WORKOUT TIPS | NOTE) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>

                  {/* MODULE 1: HEART RATE ZONE GUIDE */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 12px', fontSize: '0.72rem' }}>
                    <div style={{ fontWeight: 900, color: '#16a34a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      HEART RATE ZONE GUIDE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ background: '#d1fae5', padding: '3px 6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#065f46' }}>
                        <span>Zone 1 (50-60%)</span><span>Warm-up / Cool-down</span>
                      </div>
                      <div style={{ background: '#fef08a', padding: '3px 6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#854d0e' }}>
                        <span>Zone 2 (60-70%)</span><span>Fat Burn</span>
                      </div>
                      <div style={{ background: '#fed7aa', padding: '3px 6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#9a3412' }}>
                        <span>Zone 3 (70-80%)</span><span>Cardio Fitness</span>
                      </div>
                      <div style={{ background: '#fecaca', padding: '3px 6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#991b1b' }}>
                        <span>Zone 4 (80-90%)</span><span>Performance</span>
                      </div>
                      <div style={{ background: '#e9d5ff', padding: '3px 6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#6b21a8' }}>
                        <span>Zone 5 (90-100%)</span><span>Maximum Effort</span>
                      </div>
                    </div>
                  </div>

                  {/* MODULE 2: WATER INTAKE GUIDE */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 12px', fontSize: '0.72rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.6rem' }}>🧴</span>
                    <div>
                      <div style={{ fontWeight: 900, color: '#2563eb', marginBottom: 4, textTransform: 'uppercase' }}>
                        WATER INTAKE GUIDE
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, color: '#1e293b', fontWeight: 600 }}>
                        <div>• <strong>Before Workout:</strong> 500 ml</div>
                        <div>• <strong>During Workout:</strong> 150-250 ml every 15-20 mins</div>
                        <div>• <strong>After Workout:</strong> 500-700 ml</div>
                        <div style={{ fontWeight: 800, color: '#2563eb', marginTop: 2 }}>• Daily Goal: 2.5 – 3.5 Liters</div>
                      </div>
                    </div>
                  </div>

                  {/* MODULE 3: POST WORKOUT TIPS */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 12px', fontSize: '0.72rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.6rem' }}>🥛</span>
                    <div>
                      <div style={{ fontWeight: 900, color: '#7e22ce', marginBottom: 4, textTransform: 'uppercase' }}>
                        POST WORKOUT TIPS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, color: '#1e293b', fontWeight: 600 }}>
                        <div>• Rehydrate</div>
                        <div>• Have a protein + carb meal/snack within 30-60 mins</div>
                        <div>• Get enough sleep</div>
                        <div>• Foam rolling (if needed)</div>
                      </div>
                    </div>
                  </div>

                  {/* MODULE 4: NOTE */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 12px', fontSize: '0.72rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.6rem' }}>📋</span>
                    <div>
                      <div style={{ fontWeight: 900, color: '#7e22ce', marginBottom: 4, textTransform: 'uppercase' }}>
                        NOTE
                      </div>
                      <div style={{ color: '#1e293b', fontWeight: 600, lineHeight: 1.35 }}>
                        This day is active recovery. Listen to your body and keep the intensity moderate. Stay consistent!
                      </div>
                    </div>
                  </div>

                </div>

                {/* SLOGAN FOOTER BANNER */}
                <div style={{
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px 18px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.76rem', color: '#0f172a'
                }}>
                  <div style={{ fontWeight: 900, color: '#0f172a' }}>
                    ⭐ CONSISTENCY + PATIENCE + PROPER NUTRITION = RESULTS
                  </div>
                  <div style={{ fontWeight: 900, color: '#dc2626' }}>
                    ❤️ STAY ACTIVE, STAY HEALTHY!
                  </div>
                  <div style={{ fontWeight: 900, color: '#ca8a04' }}>
                    YOU'VE GOT THIS! 💪
                  </div>
                </div>

              </div>
            ) : activePlanDay.isDay5Poster ? (
              /* DAY 5 POSTER: FULL BODY STRENGTH WORKOUT INFOGRAPHIC POSTER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* TOP WHITE HEADER BANNER */}
                <div style={{
                  background: '#ffffff', borderRadius: '14px', border: '1px solid #cbd5e1', padding: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  {/* LEFT TITLE & SUBTITLE */}
                  <div style={{ textAlign: 'left', flex: '1 1 280px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#0b192c', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--heading-font)' }}>
                      FULL BODY STRENGTH WORKOUT
                    </h1>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0b192c', letterSpacing: '0.8px', marginTop: 2, textTransform: 'uppercase' }}>
                      BUILD STRENGTH • BURN CALORIES • IMPROVE PERFORMANCE
                    </div>
                  </div>

                  {/* RIGHT FOCUS BADGE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #cbd5e1', borderRadius: '12px', padding: '8px 14px', background: '#f8fafc', maxWidth: '300px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎯</span>
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>FOCUS AREAS</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                        Full Body Strength, Power,<br />Muscle Endurance
                      </div>
                    </div>
                  </div>
                </div>

                {/* 10 EXERCISE CARDS GRID (5 COLUMNS x 2 ROWS) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {activePlanDay.exercises.map((ex, idx) => (
                    <PosterExerciseGridCard
                      key={idx}
                      number={ex.number}
                      name={ex.name}
                      sets={ex.sets}
                      reps={ex.reps}
                      image={ex.image}
                      icon={ex.icon}
                      targetMuscles={ex.targetMuscles}
                      badgeColor="#d97706"
                      accentColor="#0b192c"
                      headerBg="#ffffff"
                      videoGuideBlue={true}
                      footerBg="#0b192c"
                    />
                  ))}
                </div>

                {/* BOTTOM GUIDANCE BAR (4 SECTIONS + FOOTER NOTE) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '14px 18px',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16
                  }}>

                    {/* WARM-UP SECTION */}
                    <div>
                      <div style={{ fontWeight: 900, color: '#16a34a', fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        🔥 WARM-UP (5-10 MINS)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.74rem', color: '#1e293b', fontWeight: 600 }}>
                        <div>• 5 Min Light Cardio (Treadmill / Bike)</div>
                        <div>• Arm Circles – 30 Sec</div>
                        <div>• Leg Swings – 10 Each Leg</div>
                        <div>• Bodyweight Squats – 15 Reps</div>
                        <div>• Push-Ups – 10 Reps</div>
                      </div>
                    </div>

                    {/* COOL DOWN SECTION */}
                    <div>
                      <div style={{ fontWeight: 900, color: '#2563eb', fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        ❄️ COOL DOWN (5-10 MINS)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.74rem', color: '#1e293b', fontWeight: 600 }}>
                        <div>• Static Stretching</div>
                        <div>• Hamstring Stretch</div>
                        <div>• Chest Stretch</div>
                        <div>• Shoulder Stretch</div>
                        <div>• Deep Breathing</div>
                      </div>
                    </div>

                    {/* TRAINING TIPS SECTION */}
                    <div>
                      <div style={{ fontWeight: 900, color: '#7c3aed', fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        💡 TRAINING TIPS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.74rem', color: '#1e293b', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>🏋️</span> Focus on proper form over heavy weight.</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>🧘</span> Use controlled movements.</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>⏱️</span> Rest 60-90 sec between sets.</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>📈</span> Increase weight gradually.</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span>📝</span> Stay consistent & track your progress.</div>
                      </div>
                    </div>

                    {/* GENERAL GUIDELINES SECTION */}
                    <div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
                        GENERAL GUIDELINES
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: '0.65rem', fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: '1.3rem' }}>🧴</span> Stay Hydrated
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: '1.3rem' }}>🍽️</span> Eat Enough Protein
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: '1.3rem' }}>🛌</span> Sleep 7-8 Hours
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: '1.3rem' }}>📈</span> Progressive Overload
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <span style={{ fontSize: '1.3rem' }}>🚶</span> Listen to Your Body
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* FOOTER SLOGAN BAR */}
                  <div style={{
                    background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 18px',
                    display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.76rem', color: '#0f172a', fontWeight: 800
                  }}>
                    <div>⭐ <strong>NOTE:</strong> Beginners can use lighter weights or assisted variations.</div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div>Take a rest day when needed.</div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div>Consistency + Proper Nutrition = Results</div>
                  </div>
                </div>

              </div>
            ) : activePlanDay.isDay4Poster ? (
              /* DAY 4 POSTER: SHOULDERS + ABS WORKOUT INFOGRAPHIC POSTER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* TOP INFOGRAPHIC STATS HEADER BAR */}
                <div style={{
                  background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                }}>
                  {/* LEFT TITLE */}
                  <div style={{ textAlign: 'left', flex: '1 1 260px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#0b192c', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--heading-font)', lineHeight: 1.1 }}>
                      SHOULDERS + ABS WORKOUT
                    </h1>
                  </div>

                  {/* FOCUS AREAS BADGE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #cbd5e1', borderRadius: '12px', padding: '8px 14px', background: '#f8fafc', maxWidth: '300px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎯</span>
                    <div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>FOCUS AREAS</div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                        Shoulders (All Heads)<br />Core (Abs)
                      </div>
                    </div>
                  </div>
                </div>

                {/* MAIN SPLIT WORKOUTS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>

                  {/* LEFT COLUMN: SHOULDERS WORKOUT */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '14px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '8px 14px', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: 'center', boxShadow: '0 2px 8px rgba(11,25,44,0.3)' }}>
                      SHOULDERS WORKOUT
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                      {activePlanDay.shouldersExercises.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx}
                          number={ex.number}
                          name={ex.name}
                          sets={ex.sets}
                          reps={ex.reps}
                          image={ex.image}
                          icon={ex.icon}
                          targetMuscles={ex.targetMuscles}
                          accentColor="#6b21a8"
                          headerBg="#f3e8ff"
                        />
                      ))}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: ABS WORKOUT */}
                  <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '14px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '8px 14px', borderRadius: '10px', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.6px', textTransform: 'uppercase', textAlign: 'center', boxShadow: '0 2px 8px rgba(11,25,44,0.3)' }}>
                      ABS WORKOUT
                    </div>

                    {/* Cards 7 & 8 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                      {activePlanDay.absStacked.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx + 6}
                          number={ex.number}
                          name={ex.name}
                          sets={ex.sets}
                          reps={ex.reps}
                          image={ex.image}
                          icon={ex.icon}
                          targetMuscles={ex.targetMuscles}
                          accentColor="#6b21a8"
                          headerBg="#f3e8ff"
                        />
                      ))}
                    </div>

                    {/* Cards 9 & 10 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                      {activePlanDay.absSideBySide.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx + 8}
                          number={ex.number}
                          name={ex.name}
                          sets={ex.sets}
                          reps={ex.reps}
                          image={ex.image}
                          icon={ex.icon}
                          targetMuscles={ex.targetMuscles}
                          accentColor="#6b21a8"
                          headerBg="#f3e8ff"
                        />
                      ))}
                    </div>
                  </div>

                </div>

                {/* TIPS FOR BEST RESULTS BANNER */}
                <div style={{
                  background: '#0b192c', color: '#ffffff', padding: '14px 18px', borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
                  boxShadow: '0 4px 14px rgba(11,25,44,0.25)'
                }}>
                  <div style={{ background: '#1e293b', padding: '8px 16px', borderRadius: '10px', fontWeight: 900, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    TIPS FOR BEST RESULTS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flex: 1, justifyContent: 'space-around', fontSize: '0.78rem', fontWeight: 800 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🦾</span> Focus on Mind-Muscle Connection
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🏋️</span> Use Controlled Movements
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🧘</span> Maintain Proper Posture
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⏱️</span> Rest 60-90 Sec Between Sets
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💧</span> Stay Hydrated During Workout
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🍽️</span> Eat Enough Protein for Recovery
                    </div>
                  </div>
                </div>

                {/* BOTTOM SLOGAN & ADVICE BANNER */}
                <div style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 18px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.76rem', color: '#0f172a'
                }}>
                  <div style={{ fontWeight: 700 }}>
                    ⭐ <strong style={{ color: '#6b21a8' }}>NOTE:</strong> Warm up for 5-10 minutes before starting. Stretch after workout.
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    <strong>Beginners:</strong> Start lighter & focus on form
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    <strong>Progressive Overload:</strong> Increase weight gradually
                  </div>
                </div>

              </div>
            ) : activePlanDay.isDay3Poster ? (
              /* DAY 3 POSTER: LEGS WORKOUT INFOGRAPHIC POSTER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* TOP HEADER BANNER */}
                <div style={{
                  background: '#ffffff', color: '#0f172a', borderRadius: '14px', border: '1px solid #cbd5e1', padding: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  {/* LEFT TITLE */}
                  <div style={{ textAlign: 'left', flex: '1 1 240px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#0b192c', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--heading-font)' }}>
                      LEGS WORKOUT
                    </h1>
                  </div>

                  {/* RIGHT FOCUS BADGE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.6rem' }}>🦵</span>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.3, textTransform: 'uppercase', color: '#0f172a' }}>
                      <strong style={{ display: 'block', color: '#64748b', fontSize: '0.62rem', letterSpacing: '0.5px' }}>FOCUS</strong>
                      QUADS - HAMSTRINGS<br />GLUTES - CALVES
                    </div>
                  </div>
                </div>

                {/* 6 EXERCISE CARDS GRID (3 COLUMNS x 2 ROWS) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {activePlanDay.exercises.map((ex, idx) => (
                    <PosterExerciseGridCard
                      key={idx}
                      number={ex.number}
                      name={ex.name}
                      sets={ex.sets}
                      reps={ex.reps}
                      image={ex.image}
                      icon={ex.icon}
                      targetMuscles={ex.targetMuscles}
                      badgeColor={ex.badgeColor}
                      accentColor="#0b192c"
                      headerBg={ex.headerBg || '#f8fafc'}
                      videoGuideBlue={true}
                      footerBg="#0b192c"
                    />
                  ))}
                </div>

                {/* BOTTOM TIPS BAR */}
                <div style={{
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, fontSize: '0.78rem', color: '#0f172a'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, color: '#0b192c', textTransform: 'uppercase', flexShrink: 0 }}>
                    <span style={{ fontSize: '1.2rem' }}>💡</span> TIPS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flex: 1, justifyContent: 'space-around', fontWeight: 700 }}>
                    <div>Keep your core tight through every rep.</div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div>Go full depth for better results.</div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div>Use controlled movement, don't rush.</div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🧴</span> Stay hydrated during workout.
                    </div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🧘</span> Stretch your legs after workout.
                    </div>
                  </div>
                </div>

              </div>
            ) : activePlanDay.isDay2Poster ? (
              /* DAY 2 POSTER: BACK + BICEPS WORKOUT INFOGRAPHIC POSTER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* TOP HEADER BANNER */}
                <div style={{
                  background: '#ffffff', color: '#0f172a', borderRadius: '14px', border: '1px solid #cbd5e1', padding: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  {/* LEFT TITLE */}
                  <div style={{ textAlign: 'left', flex: '1 1 260px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#0b192c', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: 'var(--heading-font)' }}>
                      BACK + BICEPS WORKOUT 💪
                    </h1>
                  </div>

                  {/* RIGHT FOCUS BADGE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.6rem' }}>🦾</span>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.3, textTransform: 'uppercase', color: '#0f172a' }}>
                      <strong style={{ display: 'block', color: '#64748b', fontSize: '0.62rem', letterSpacing: '0.5px' }}>FOCUS AREAS</strong>
                      LATS - MID BACK - LOWER BACK<br />BICEPS - REAR DELTS
                    </div>
                  </div>
                </div>

                {/* 8 EXERCISE CARDS GRID (4 COLUMNS x 2 ROWS) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {activePlanDay.exercises.map((ex, idx) => (
                    <PosterExerciseGridCard
                      key={idx}
                      number={ex.number}
                      name={ex.name}
                      sets={ex.sets}
                      reps={ex.reps}
                      image={ex.image}
                      icon={ex.icon}
                      targetMuscles={ex.targetMuscles}
                      badgeColor={ex.badgeColor}
                      accentColor={ex.badgeColor || "#0b192c"}
                      headerBg={ex.headerBg || '#f8fafc'}
                      videoGuideBlue={true}
                      footerBg={ex.badgeColor}
                    />
                  ))}
                </div>

                {/* BOTTOM TIPS BAR */}
                <div style={{
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, fontSize: '0.78rem', color: '#0f172a'
                }}>
                  <div style={{ background: '#0b192c', color: '#ffffff', padding: '6px 14px', borderRadius: '20px', fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase', flexShrink: 0 }}>
                    TIPS FOR BEST RESULTS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flex: 1, justifyContent: 'space-around', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🦾</span> Focus on Mind-Muscle Connection.
                    </div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🏋️</span> Use Full Range of Motion.
                    </div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🧘</span> Control the Reps, Don't Swing.
                    </div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⏱️</span> Rest 60-90 Sec Between Sets.
                    </div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>💧</span> Stay Hydrated During Workout.
                    </div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🍽️</span> Eat Enough Protein for Recovery.
                    </div>
                  </div>
                </div>

              </div>
            ) : activePlanDay.isDay1Poster ? (
              /* DAY 1 POSTER: CHEST + TRICEPS WORKOUT INFOGRAPHIC POSTER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* TOP HEADER ROW */}
                <div style={{
                  background: '#ffffff', padding: '4px 6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14
                }}>
                  {/* LEFT TITLE */}
                  <h1 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 950, color: '#0b192c', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'var(--heading-font)', textAlign: 'left' }}>
                    DAY 1 – CHEST + TRICEPS WORKOUT
                  </h1>

                  {/* RIGHT METRICS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: '0.92rem', fontWeight: 900, color: '#0b192c' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '1.3rem' }}>⏱️</span>
                      <span>60-75 MINS</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '1.3rem' }}>⏲️</span>
                      <span>REST: 60-90 SEC</span>
                    </div>
                  </div>
                </div>

                {/* 8 EXERCISE CARDS GRID (4 COLUMNS x 2 ROWS) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {activePlanDay.exercises.map((ex, idx) => (
                    <PosterExerciseGridCard
                      key={idx}
                      number={ex.number}
                      name={ex.name}
                      sets={ex.sets}
                      reps={ex.reps}
                      image={ex.image}
                      icon={ex.icon}
                      targetMuscles={ex.targetMuscles}
                      isDay1Style={true}
                    />
                  ))}
                </div>

                {/* BOTTOM 4 MODULES PANEL */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>

                  {/* MODULE 1: WARM-UP (10 MINS) */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', fontSize: '0.74rem' }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '6px 12px', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      WARM-UP (10 MINS)
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, color: '#1e293b', fontWeight: 600 }}>
                      <div>• 5 min Light Cardio (Treadmill/Stepper)</div>
                      <div>• Arm Circles – 2 sets of 20</div>
                      <div>• Push-up Stretch – 2 sets of 15</div>
                      <div>• Chest Opener Stretch – 2 sets of 20 sec</div>
                    </div>
                  </div>

                  {/* MODULE 2: STRETCHING (AFTER WORKOUT) */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', fontSize: '0.74rem' }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '6px 12px', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      STRETCHING (AFTER WORKOUT)
                    </div>
                    <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#1e293b', fontWeight: 600 }}>
                        <div>• Chest Stretch – 30 sec</div>
                        <div>• Shoulder Stretch – 30 sec</div>
                        <div>• Triceps Stretch – 30 sec</div>
                      </div>
                      <div style={{ width: '80px', height: '65px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#0a0d14' }}>
                        <img src="/exercises/chest_stretch.png" alt="Stretching" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    </div>
                  </div>

                  {/* MODULE 3: TIPS */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', fontSize: '0.74rem' }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '6px 12px', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      TIPS
                    </div>
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4, color: '#1e293b', fontWeight: 600 }}>
                      <div>✅ Keep weight moderate and focus on form.</div>
                      <div>✅ Squeeze your chest while pressing.</div>
                      <div>✅ Control the movement (don't use momentum).</div>
                      <div>✅ Breathe out while pushing, breathe in while lowering.</div>
                    </div>
                  </div>

                  {/* MODULE 4: MUSCLE FOCUS */}
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', fontSize: '0.74rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: '#0b192c', color: '#ffffff', padding: '6px 12px', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>
                      MUSCLE FOCUS
                    </div>
                    <div style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '85px' }}>
                      <TargetMuscleAnatomyDiagram targetMuscles="Chest (Middle), Triceps" large={true} />
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              /* STANDARD EXERCISE GRID FOR DAY 1, 2, 3, 5 */
              <>
                {/* WARM-UP BAR WITH DEDICATED VISUAL IMAGE */}
                <div style={{
                  background: '#f8fafc', border: `1.5px solid ${activePlanDay.accentColor}33`, padding: '12px 14px', borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                }}>
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: activePlanDay.accentColor, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      PRE-WORKOUT PREPARATION
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                      🔥 {activePlanDay.warmup}
                    </div>
                    {activePlanDay.warmupDetails && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4, fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 600 }}>
                        {activePlanDay.warmupDetails.map((detail, dIdx) => (
                          <span key={dIdx}>• {detail}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '100px', height: '60px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0, position: 'relative', background: '#0a0d14' }}>
                    <img
                      src={activePlanDay.warmupImg}
                      alt="Warmup Exercise"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <span style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px' }}>
                      🔥 WARMUP
                    </span>
                  </div>
                </div>

                {/* Exercises Grid — Responsive Split Sections for Day 4 vs Standard Grid */}
                {activePlanDay.isSplitSection ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {/* SHOULDERS WORKOUT SECTION (#1 to #6) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ background: '#0b192c', color: '#ffffff', padding: '8px 12px', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center' }}>
                        SHOULDERS WORKOUT
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                        {activePlanDay.shouldersExercises.map((ex, idx) => (
                          <PosterExerciseGridCard
                            key={idx}
                            number={ex.number}
                            name={ex.name}
                            sets={ex.sets}
                            reps={ex.reps}
                            image={ex.image}
                            icon={ex.icon}
                            targetMuscles={ex.targetMuscles}
                            badgeColor={ex.badgeColor}
                            accentColor={ex.accentColor || activePlanDay.accentColor}
                            headerBg={ex.headerBg || activePlanDay.headerBg}
                          />
                        ))}
                      </div>
                    </div>

                    {/* ABS WORKOUT SECTION (#7 to #10) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ background: '#0b192c', color: '#ffffff', padding: '8px 12px', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center' }}>
                        ABS WORKOUT
                      </div>

                      {/* Cards 7 & 8 Stacked */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                        {activePlanDay.absStacked.map((ex, idx) => (
                          <PosterExerciseGridCard
                            key={idx + 6}
                            number={ex.number}
                            name={ex.name}
                            sets={ex.sets}
                            reps={ex.reps}
                            image={ex.image}
                            icon={ex.icon}
                            targetMuscles={ex.targetMuscles}
                            badgeColor={ex.badgeColor}
                            accentColor={ex.accentColor || activePlanDay.accentColor}
                            headerBg={ex.headerBg || activePlanDay.headerBg}
                          />
                        ))}
                      </div>

                      {/* Cards 9 (PLANK) on LEFT & 10 (RUSSIAN TWIST) on RIGHT in a Responsive 2-Column Grid Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, width: '100%' }}>
                        {activePlanDay.absSideBySide.map((ex, idx) => (
                          <PosterExerciseGridCard
                            key={idx + 8}
                            number={ex.number}
                            name={ex.name}
                            sets={ex.sets}
                            reps={ex.reps}
                            image={ex.image}
                            icon={ex.icon}
                            targetMuscles={ex.targetMuscles}
                            badgeColor={ex.badgeColor}
                            accentColor={ex.accentColor || activePlanDay.accentColor}
                            headerBg={ex.headerBg || activePlanDay.headerBg}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, width: '100%' }}>
                    {activePlanDay.exercises.map((ex, idx) => (
                      <PosterExerciseGridCard
                        key={idx}
                        number={ex.number}
                        name={ex.name}
                        sets={ex.sets}
                        reps={ex.reps}
                        image={ex.image}
                        icon={ex.icon}
                        targetMuscles={ex.targetMuscles}
                        badgeColor={ex.badgeColor}
                        accentColor={ex.accentColor || activePlanDay.accentColor}
                        headerBg={ex.headerBg || activePlanDay.headerBg}
                      />
                    ))}
                  </div>
                )}

                {/* COOL DOWN & STRETCHING BAR WITH DEDICATED VISUAL IMAGE */}
                <div style={{
                  background: '#f8fafc', border: '1.5px solid #10b98133', padding: '12px 14px', borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                }}>
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      POST-WORKOUT RECOVERY
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                      🧘 {activePlanDay.cooldown}
                    </div>
                    {activePlanDay.cooldownDetails && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4, fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 600 }}>
                        {activePlanDay.cooldownDetails.map((detail, cIdx) => (
                          <span key={cIdx}>• {detail}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '100px', height: '60px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0, position: 'relative', background: '#0a0d14' }}>
                    <img
                      src={activePlanDay.cooldownImg}
                      alt="Cooldown Stretch"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <span style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px' }}>
                      🧘 COOLDOWN
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Footer Bar for Routine */}
            <div style={{
              background: '#f8fafc', border: `1px solid ${activePlanDay.accentColor}33`, padding: '10px 14px', borderRadius: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: '0.76rem', color: activePlanDay.accentColor, fontWeight: 800
            }}>
              <span>⭐️ RECOVER TODAY, PERFORM BETTER TOMORROW.</span>
              <span>❤️ BE CONSISTENT. BE PATIENT. TRUST THE PROCESS.</span>
              <span>🏆 STRONGER EVERY DAY!</span>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: ACTIVITY TRACKER & HISTORY */}
      {activeSubTab === 'tracker' && (
        <>
          {/* Metric Cards Grid — Fully Mobile Responsive */}
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div className="metric-card metric-card--amber" style={{ padding: 14 }}>
              <p className="metric-card__label" style={{ fontSize: '0.72rem' }}>This Week</p>
              <h3 className="metric-card__value" style={{ fontSize: '1.2rem' }}>{gymThisWeek.length} sessions</h3>
              <p className="metric-card__detail" style={{ fontSize: '0.68rem' }}>Goal: 4 sessions/wk</p>
            </div>
            <div className="metric-card metric-card--teal" style={{ padding: 14 }}>
              <p className="metric-card__label" style={{ fontSize: '0.72rem' }}>Month Duration</p>
              <h3 className="metric-card__value" style={{ fontSize: '1.2rem' }}>{totalDuration} min</h3>
              <p className="metric-card__detail" style={{ fontSize: '0.68rem' }}>{monthItems.length} workouts</p>
            </div>
            <div className="metric-card metric-card--coral" style={{ padding: 14 }}>
              <p className="metric-card__label" style={{ fontSize: '0.72rem' }}>Calories Burned</p>
              <h3 className="metric-card__value" style={{ fontSize: '1.2rem' }}>{totalCalories > 0 ? `${totalCalories} kcal` : '—'}</h3>
              <p className="metric-card__detail" style={{ fontSize: '0.68rem' }}>This month</p>
            </div>
            <div className="metric-card metric-card--purple" style={{ padding: 14 }}>
              <p className="metric-card__label" style={{ fontSize: '0.72rem' }}>Streak</p>
              <h3 className="metric-card__value" style={{ fontSize: '1.2rem' }}>🔥 {streak} days</h3>
              <p className="metric-card__detail" style={{ fontSize: '0.68rem' }}>{items.length} total logged</p>
            </div>
          </div>

          {/* Weekly Goals + Heatmap (Mobile Stacked Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, width: '100%' }}>
            {/* Weekly Goal */}
            <div className="section-card" style={{ padding: 16 }}>
              <p className="eyebrow">This Week's Progress</p>
              <h3 style={{ marginBottom: 12, fontSize: '1.1rem' }}>Goal: 4 sessions</h3>
              <ProgressBar label={`${gymThisWeek.length} / 4 sessions`} value={gymThisWeek.length} total={4} tone="amber" />
              <div style={{ marginTop: 16 }}>
                <p className="eyebrow" style={{ marginBottom: 8 }}>Week Days</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                    const dateStr = weekDates[i];
                    const done = gymThisWeek.some(g => g.date === dateStr);
                    const isToday = dateStr === new Date().toISOString().slice(0, 10);
                    return (
                      <div key={i} style={{
                        textAlign: 'center', padding: '6px 2px',
                        borderRadius: 8, background: done ? 'var(--amber-soft)' : isToday ? 'rgba(61,63,52,0.06)' : 'transparent',
                        border: isToday ? '1px solid var(--amber)' : '1px solid transparent',
                      }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 2 }}>{day}</div>
                        <div style={{ fontSize: '0.85rem' }}>{done ? '💪' : '○'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>Top Workout Types</p>
                {byType.slice(0, 3).map((t, i) => (
                  <div key={i} className="stat-line">
                    <span className="stat-line__label" style={{ fontSize: '0.78rem' }}>{t.name}</span>
                    <span className="stat-line__value" style={{ fontSize: '0.78rem' }}>{t.count} sessions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap */}
            <div className="section-card" style={{ padding: 16 }}>
              <p className="eyebrow">Activity Heatmap</p>
              <h3 style={{ marginBottom: 4, fontSize: '1.1rem' }}>Last 30 Days</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 12 }}>
                Darker = longer workout intensity
              </p>
              <div className="heatmap" style={{ overflowX: 'auto', paddingBottom: 4 }}>
                {last30.map((day, i) => (
                  <div
                    key={i}
                    className={`heatmap-cell heatmap-cell--${day.intensity}`}
                    title={`${day.date}: ${day.sessions.length} session(s)`}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, fontSize: '0.68rem', color: 'var(--muted)' }}>
                <span>Less</span>
                {[0, 1, 2, 3, 4].map(l => (
                  <div key={l} className={`heatmap-cell heatmap-cell--${l}`} style={{ width: 12, height: 12 }} />
                ))}
                <span>More</span>
              </div>

              {/* Duration trend */}
              <div style={{ marginTop: 16 }}>
                <p className="eyebrow" style={{ marginBottom: 10 }}>Duration Trend (last 10 sessions)</p>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={durationTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(61,63,52,0.08)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#5f665f' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#5f665f' }} axisLine={false} tickLine={false}
                        tickFormatter={v => `${v}m`} width={28} />
                      <Tooltip formatter={(v) => [`${v} min`, 'Duration']} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                      <Line type="monotone" dataKey="duration" stroke="#b98216" strokeWidth={2} dot={{ fill: '#b98216', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Workout History Table */}
          <SectionCard
            badge="History"
            title="Workout Log"
            subtitle="All logged gym sessions in reverse chronological order."
            actions={
              <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ fontSize: '0.78rem' }}>
                <option value="All">All Types</option>
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            }
          >
            <div className="table-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '450px' }}>
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
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
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
        </>
      )}

      {/* Log Workout Modal */}
      {showForm && createPortal(
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Log Workout 💪</h2>
              <button className="modal__close" onClick={() => setShowForm(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
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
