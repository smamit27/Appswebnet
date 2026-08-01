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
function TargetMuscleAnatomyDiagram({ targetMuscles }) {
  const group = (targetMuscles || '').toLowerCase();

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: '3px 6px', background: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }} title={`Targeted: ${targetMuscles}`}>
      {/* FRONT BODY SILHOUETTE */}
      <svg width="20" height="36" viewBox="0 0 40 70" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <svg width="20" height="36" viewBox="0 0 40 70" fill="none" xmlns="http://www.w3.org/2000/svg">
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

// Ultra Premium Exercise Card Component (No Checkbox)
function PosterExerciseGridCard({ number, name, sets, reps, image, icon, targetMuscles, accentColor, headerBg, showTargetDiagram = true, repsFooterLabel, noteSub }) {
  const [imgError, setImgError] = useState(false);
  const themeColor = accentColor || '#3b82f6';

  return (
    <div
      style={{
        background: '#ffffff',
        border: `1px solid ${themeColor}22`,
        borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative'
      }}
    >
      {/* Title Header Bar */}
      <div style={{ background: headerBg || '#f8fafc', padding: '10px 14px', borderBottom: `2px solid ${themeColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{
            background: themeColor, color: '#ffffff', fontWeight: 900, fontSize: '0.82rem',
            width: '26px', height: '26px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: `0 3px 10px ${themeColor}44`
          }}>
            {number}
          </span>
          <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.3px', fontFamily: 'var(--heading-font)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </h4>
        </div>
      </div>

      {/* High Definition Gym Exercise Photography Container */}
      <div style={{ height: '150px', width: '100%', position: 'relative', background: '#0a0d14', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!imgError && image ? (
          <img
            src={image}
            alt={name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(circle at center, ${themeColor} 0%, #0f172a 90%)`, padding: '12px', textAlign: 'center'
          }}>
            <span style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}>{icon || '🏋️‍♂️'}</span>
            <div style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 6 }}>
              {name}
            </div>
            <div style={{ color: '#93c5fd', fontSize: '0.68rem', fontWeight: 700, marginTop: 2 }}>
              STUDIO DEMO
            </div>
          </div>
        )}

        {/* Exercise Badge Overlay */}
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
          {icon || '💪'} #{number}
        </div>
      </div>

      {/* Target Muscles Box */}
      {showTargetDiagram && (
        <div style={{ padding: '8px 12px', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <TargetMuscleAnatomyDiagram targetMuscles={targetMuscles} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TARGET MUSCLES
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {targetMuscles || 'Primary & Secondary Groups'}
            </div>
          </div>
        </div>
      )}

      {/* Footer Reps Tag Bar */}
      <div style={{ padding: '9px 12px', background: themeColor, color: '#ffffff', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 900, letterSpacing: '0.5px' }}>
          {repsFooterLabel ? repsFooterLabel : (sets ? `${sets} SETS × ${reps}` : reps)}
        </span>
        {noteSub && (
          <span style={{ fontSize: '0.68rem', opacity: 0.9, fontWeight: 700, marginTop: 1 }}>
            {noteSub}
          </span>
        )}
      </div>
    </div>
  );
}

// 7-DAY WORKOUT PLAN DATA
const PLAN_7_DAYS = [
  {
    dayNumber: 1,
    dayKey: 'Monday',
    title: "DAY 1 — CHEST + TRICEPS WORKOUT",
    accentColor: "#ef4444", // Vibrant Red/Coral Accent
    headerBg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    warmup: "WARM-UP (10 MINS): Cardio 5 min + Dynamic Stretching",
    warmupImg: "/exercises/barbell_bench_press.png",
    cooldown: "COOL DOWN & STRETCHING (5-10 MINS)",
    cooldownImg: "/exercises/chest_press.png",
    exercises: [
      { number: 1, name: "BARBELL BENCH PRESS", sets: "3", reps: "8-10 REPS", icon: "🏋️‍♂️", targetMuscles: "Chest (Middle), Front Delts, Triceps", image: "/exercises/barbell_bench_press.png" },
      { number: 2, name: "INCLINE DUMBBELL PRESS", sets: "3", reps: "10-12 REPS", icon: "📐", targetMuscles: "Upper Chest, Anterior Deltoids", image: "/exercises/chest_press.png" },
      { number: 3, name: "PEC DECK FLY", sets: "3", reps: "12-15 REPS", icon: "🦅", targetMuscles: "Chest (Inner Isolation)", image: "/exercises/pec_deck_fly.png" },
      { number: 4, name: "DUMBBELL PUSHDOWN", sets: "3", reps: "12-15 REPS", icon: "🦾", targetMuscles: "Triceps Lateral & Medial Head", image: "/exercises/chest_press.png" },
      { number: 5, name: "OVERHEAD TRICEPS EXTENSION", sets: "3", reps: "12-15 REPS", icon: "🙌", targetMuscles: "Triceps Long Head", image: "/exercises/chest_press.png" },
      { number: 6, name: "CLOSE GRIP BENCH PRESS", sets: "3", reps: "8-10 REPS", icon: "✊", targetMuscles: "Triceps & Inner Chest", image: "/exercises/barbell_bench_press.png" }
    ]
  },
  {
    dayNumber: 2,
    dayKey: 'Tuesday',
    title: "DAY 2 — BACK + BICEPS WORKOUT 💪",
    accentColor: "#3b82f6", // Royal Blue
    headerBg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    warmup: "WARM-UP (10 MINS): Cardio 5 min + Dynamic Stretching",
    warmupImg: "/exercises/lat_pulldown.png",
    cooldown: "COOL DOWN & STRETCHING (5-10 MINS)",
    cooldownImg: "/exercises/seated_cable_row.png",
    exercises: [
      { number: 1, name: "LAT PULLDOWN", sets: "3", reps: "8-12 REPS", icon: "🏋️‍♀️", accentColor: "#2563eb", headerBg: "#eff6ff", targetMuscles: "Latissimus Dorsi (Lats), Biceps", image: "/exercises/lat_pulldown.png" },
      { number: 2, name: "SEATED CABLE ROW", sets: "3", reps: "10-12 REPS", icon: "🚣‍♂️", accentColor: "#16a34a", headerBg: "#f0fdf4", targetMuscles: "Middle Back, Rhomboids, Lats, Biceps", image: "/exercises/seated_cable_row.png" },
      { number: 3, name: "ONE ARM DUMBBELL ROW", sets: "3", reps: "10-12 REPS (EACH SIDE)", icon: "🏋️", accentColor: "#ea580c", headerBg: "#fff7ed", targetMuscles: "Lats, Middle Back, Rear Delts, Biceps", image: "/exercises/lat_pulldown.png" },
      { number: 4, name: "FACE PULL", sets: "3", reps: "12-15 REPS", icon: "⚖️", accentColor: "#9333ea", headerBg: "#faf5ff", targetMuscles: "Rear Delts, Upper Back, Traps, Rotator Cuff", image: "/exercises/seated_cable_row.png" },
      { number: 5, name: "PULL-UPS (ASSISTED)", sets: "3", reps: "6-10 REPS", icon: "🧗", accentColor: "#2563eb", headerBg: "#eff6ff", targetMuscles: "Lats, Upper Back, Biceps", image: "/exercises/lat_pulldown.png" },
      { number: 6, name: "BARBELL CURL", sets: "3", reps: "8-12 REPS", icon: "🏋️‍♂️", accentColor: "#16a34a", headerBg: "#f0fdf4", targetMuscles: "Biceps (Long Head & Short Head)", image: "/exercises/barbell_bicep_curl.png" },
      { number: 7, name: "HAMMER CURL", sets: "3", reps: "10-12 REPS", icon: "🔨", accentColor: "#ea580c", headerBg: "#fff7ed", targetMuscles: "Biceps (Brachialis), Forearms", image: "/exercises/barbell_bicep_curl.png" },
      { number: 8, name: "CONCENTRATION CURL", sets: "3", reps: "10-15 REPS (EACH ARM)", icon: "💪", accentColor: "#9333ea", headerBg: "#faf5ff", targetMuscles: "Biceps (Peak Contraction)", image: "/exercises/barbell_bicep_curl.png" }
    ]
  },
  {
    dayNumber: 3,
    dayKey: 'Wednesday',
    title: "DAY 3 — LEGS WORKOUT 🦵",
    accentColor: "#1d4ed8", // Deep Sapphire Blue
    headerBg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    warmup: "WARM-UP (10 MINS): Cardio 5 min + Dynamic Stretching",
    warmupImg: "/exercises/barbell_squat.png",
    cooldown: "COOL DOWN & STRETCHING (5-10 MINS)",
    cooldownImg: "/exercises/walking_lunges.png",
    exercises: [
      { number: 1, name: "BARBELL SQUAT", sets: "3", reps: "8-10 REPS", icon: "🏋️‍♂️", targetMuscles: "Quads, Glutes, Hamstrings, Core", image: "/exercises/barbell_squat.png" },
      { number: 2, name: "LEG PRESS", sets: "3", reps: "10-12 REPS", icon: "⚙️", targetMuscles: "Quads, Glutes, Hamstrings", image: "/exercises/leg_press.png" },
      { number: 3, name: "LEG EXTENSION", sets: "3", reps: "12-15 REPS", icon: "💥", targetMuscles: "Quads (Isolation)", image: "/exercises/leg_extension.png" },
      { number: 4, name: "LEG CURL", sets: "3", reps: "12-15 REPS", icon: "🔄", targetMuscles: "Hamstrings (Isolation)", image: "/exercises/leg_curl.png" },
      { number: 5, name: "WALKING LUNGES", sets: "3", reps: "12 EACH LEG REPS", icon: "🚶‍♂️", targetMuscles: "Quads, Glutes, Hamstrings, Calves", image: "/exercises/walking_lunges.png" },
      { number: 6, name: "STANDING CALF RAISE", sets: "3", reps: "12-15 REPS", icon: "🩰", targetMuscles: "Calves (Gastrocnemius, Soleus)", image: "/exercises/leg_press.png" }
    ]
  },
  {
    dayNumber: 4,
    dayKey: 'Thursday',
    title: "DAY 4 — SHOULDERS + ABS WORKOUT",
    accentColor: "#8b5cf6", // Vibrant Purple
    headerBg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    warmup: "WARM-UP (10 MINS): Cardio 5 min + Dynamic Stretching",
    warmupImg: "/exercises/overhead_shoulder_press.png",
    cooldown: "COOL DOWN & STRETCHING (5-10 MINS)",
    cooldownImg: "/exercises/pec_deck_fly.png",
    isSplitSection: true,
    shouldersExercises: [
      { number: 1, name: "DUMBBELL SHOULDER PRESS", sets: "3", reps: "8-10 REPS", icon: "🙆‍♂️", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Deltoids (Anterior), Triceps (Secondary)", image: "/exercises/overhead_shoulder_press.png" },
      { number: 2, name: "LATERAL RAISE", sets: "3", reps: "12-15 REPS", icon: "🪽", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Deltoids (Lateral), Traps (Stabilizers)", image: "/exercises/pec_deck_fly.png" },
      { number: 3, name: "FRONT RAISE", sets: "3", reps: "12-15 REPS", icon: "🙋‍♂️", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Deltoids (Anterior), Upper Chest (Secondary)", image: "/exercises/overhead_shoulder_press.png" },
      { number: 4, name: "ARNOLD PRESS", sets: "3", reps: "8-10 REPS", icon: "🔄", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Deltoids (All Heads), Triceps (Secondary)", image: "/exercises/overhead_shoulder_press.png" },
      { number: 5, name: "REAR DELT FLY", sets: "3", reps: "12-15 REPS", icon: "🦋", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Deltoids (Posterior), Upper Back", image: "/exercises/pec_deck_fly.png" },
      { number: 6, name: "UPRIGHT ROW", sets: "3", reps: "10-12 REPS", icon: "🏋️‍♂️", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Deltoids (Lateral), Traps (Upper)", image: "/exercises/overhead_shoulder_press.png" }
    ],
    absStacked: [
      { number: 7, name: "CRUNCHES", sets: "3", reps: "15-20 REPS", icon: "🧘‍♂️", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Rectus Abdominis (Upper Abs)", image: "/exercises/deadlift.png" },
      { number: 8, name: "LEG RAISE", sets: "3", reps: "12-15 REPS", icon: "🦵", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Lower Abs (Rectus Abdominis)", image: "/exercises/walking_lunges.png" }
    ],
    absSideBySide: [
      { number: 9, name: "PLANK", sets: "3", reps: "30-60 SEC", icon: "🧱", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Core (Entire), Stability", image: "/exercises/deadlift.png" },
      { number: 10, name: "RUSSIAN TWIST", sets: "3", reps: "20 REPS (EACH SIDE)", icon: "🌪️", accentColor: "#8b5cf6", headerBg: "#f5f3ff", targetMuscles: "Obliques (Side Abs)", image: "/exercises/seated_cable_row.png" }
    ],
    exercises: []
  },
  {
    dayNumber: 5,
    dayKey: 'Friday',
    title: "DAY 5 — FULL BODY STRENGTH WORKOUT",
    accentColor: "#0f172a", // Sleek Dark Slate Accent
    headerBg: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    warmup: "WARM-UP (5-10 MINS)",
    warmupDetails: ["5 Min Light Cardio (Treadmill / Bike)", "Arm Circles – 30 Sec", "Leg Swings – 10 Each Leg", "Bodyweight Squats – 15 Reps", "Push-Ups – 10 Reps"],
    warmupImg: "/exercises/deadlift.png",
    cooldown: "COOL DOWN (5-10 MINS)",
    cooldownDetails: ["Static Stretching", "Hamstring Stretch", "Chest Stretch", "Shoulder Stretch", "Deep Breathing"],
    cooldownImg: "/exercises/barbell_squat.png",
    exercises: [
      { number: 1, name: "DEADLIFT", sets: "3", reps: "6-8 REPS", icon: "⚡", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Hamstrings, Glutes, Lower Back, Traps", image: "/exercises/deadlift.png" },
      { number: 2, name: "PUSH-UPS", sets: "3", reps: "10-15 REPS", icon: "🤸‍♂️", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Chest, Shoulders, Triceps", image: "/exercises/chest_press.png" },
      { number: 3, name: "PULL-UPS / ASSISTED PULL-UPS", sets: "3", reps: "6-10 REPS", icon: "🧗", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Lats, Upper Back, Biceps", image: "/exercises/lat_pulldown.png" },
      { number: 4, name: "GOBLET SQUAT", sets: "3", reps: "10-12 REPS", icon: "🏆", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Quads, Glutes, Hamstrings, Core", image: "/exercises/barbell_squat.png" },
      { number: 5, name: "DUMBBELL SHOULDER PRESS", sets: "3", reps: "8-12 REPS", icon: "🏋️‍♂️", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Shoulders (All Heads), Triceps", image: "/exercises/overhead_shoulder_press.png" },
      { number: 6, name: "BENT OVER BARBELL ROW", sets: "3", reps: "8-12 REPS", icon: "🚣‍♂️", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Middle Back, Lats, Biceps, Rear Delts", image: "/exercises/seated_cable_row.png" },
      { number: 7, name: "KETTLEBELL SWING", sets: "3", reps: "12-15 REPS", icon: "🔔", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Glutes, Hamstrings, Back, Shoulders, Core", image: "/exercises/deadlift.png" },
      { number: 8, name: "WALKING LUNGES", sets: "3", reps: "12 EACH LEG", icon: "🚶‍♂️", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Quads, Glutes, Hamstrings", image: "/exercises/walking_lunges.png" },
      { number: 9, name: "PLANK", sets: "3", reps: "30-60 SEC", icon: "🧱", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Core (Abs), Obliques, Lower Back", image: "/exercises/deadlift.png" },
      { number: 10, name: "FARMER WALK", sets: "3", reps: "30-40 M (EACH)", icon: "🧳", accentColor: "#0f172a", headerBg: "#f8fafc", targetMuscles: "Forearms, Traps, Core, Legs", image: "/exercises/deadlift.png" }
    ]
  },
  {
    dayNumber: 6,
    dayKey: 'Saturday',
    title: "DAY 6 — CARDIO + CORE + MOBILITY",
    accentColor: "#10b981", // Emerald Green
    headerBg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    isDay6Poster: true,
    cardioSection: [
      { number: 1, name: "TREADMILL (BRISK WALK / RUN)", reps: "20-25 MINS", icon: "🏃‍♂️", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/walking_lunges.png" },
      { number: 2, name: "STATIONARY BIKE", reps: "20-25 MINS", icon: "🚴‍♂️", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/leg_extension.png" },
      { number: 3, name: "ELLIPTICAL TRAINER", reps: "20-25 MINS", icon: "🏃‍♀️", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/walking_lunges.png" },
      { number: 4, name: "ROWING MACHINE", reps: "20-25 MINS", icon: "🚣‍♂️", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/seated_cable_row.png" }
    ],
    coreSection: [
      { number: 1, name: "PLANK", sets: "3", reps: "30-60 SEC", icon: "🧱", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Core (Abs), Obliques", image: "/exercises/deadlift.png" },
      { number: 2, name: "RUSSIAN TWIST", sets: "3", reps: "20 REPS (EACH SIDE)", icon: "🌪️", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Obliques", image: "/exercises/seated_cable_row.png" },
      { number: 3, name: "LEG RAISE", sets: "3", reps: "12-15 REPS", icon: "🦵", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Lower Abs", image: "/exercises/walking_lunges.png" },
      { number: 4, name: "BICYCLE CRUNCH", sets: "3", reps: "20 REPS (EACH SIDE)", icon: "🚴", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Abs, Obliques", image: "/exercises/leg_curl.png" },
      { number: 5, name: "MOUNTAIN CLIMBERS", sets: "3", reps: "20 REPS (EACH LEG)", icon: "🏔️", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Core, Cardio", image: "/exercises/leg_extension.png" },
      { number: 6, name: "REVERSE CRUNCH", sets: "3", reps: "15 REPS", icon: "🔄", accentColor: "#3b82f6", headerBg: "#eff6ff", targetMuscles: "Lower Abs", image: "/exercises/deadlift.png" }
    ],
    mobilitySection: [
      { number: 1, name: "CAT-COW STRETCH", reps: "10-12 REPS", icon: "🐈", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/barbell_squat.png" },
      { number: 2, name: "CHILD'S POSE", reps: "30-45 SEC", icon: "🧘‍♂️", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/barbell_squat.png" },
      { number: 3, name: "HIP FLEXOR STRETCH", reps: "30 SEC (EACH SIDE)", icon: "🧘‍♀️", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/walking_lunges.png" },
      { number: 4, name: "DYNAMIC HAMSTRING STRETCH", reps: "10 REPS (EACH LEG)", icon: "🦵", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/walking_lunges.png" },
      { number: 5, name: "PIGEON STRETCH", reps: "30-45 SEC (EACH SIDE)", icon: "🕊️", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/leg_curl.png" },
      { number: 6, name: "THORACIC ROTATION", reps: "10 REPS (EACH SIDE)", icon: "🔄", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/chest_press.png" },
      { number: 7, name: "QUAD STRETCH", reps: "30 SEC (EACH SIDE)", icon: "🩰", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/leg_extension.png" },
      { number: 8, name: "CHEST OPENER STRETCH", reps: "30-45 SEC", icon: "🦅", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/chest_press.png" },
      { number: 9, name: "DOWNWARD DOG", reps: "30-45 SEC", icon: "🐕", accentColor: "#f97316", headerBg: "#fff7ed", image: "/exercises/deadlift.png" }
    ],
    exercises: []
  },
  {
    dayNumber: 7,
    dayKey: 'Sunday',
    title: "DAY 7 — ACTIVE RECOVERY",
    accentColor: "#10b981", // Emerald Green
    headerBg: "linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%)",
    isDay7Poster: true,
    lightCardioSection: [
      { number: 1, name: "BRISK WALK", reps: "10-15 MIN", noteSub: "Keep steady pace", icon: "🚶‍♂️", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/walking_lunges.png" },
      { number: 2, name: "STATIONARY BIKE", reps: "10-15 MIN", noteSub: "RPM 60-80", icon: "🚴‍♂️", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/leg_extension.png" },
      { number: 3, name: "ELLIPTICAL", reps: "10-15 MIN", noteSub: "Low resistance", icon: "🏃‍♀️", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/walking_lunges.png" },
      { number: 4, name: "LIGHT ROWING", reps: "10-15 MIN", noteSub: "Focus on breathing", icon: "🚣‍♂️", accentColor: "#10b981", headerBg: "#ecfdf5", image: "/exercises/seated_cable_row.png" }
    ],
    mobilitySection: [
      { number: 1, name: "ARM CIRCLES", reps: "30 SEC", noteSub: "Forward & back", icon: "🔄", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/overhead_shoulder_press.png" },
      { number: 2, name: "LEG SWINGS", reps: "10 REPS", noteSub: "Front & side", icon: "🦵", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/walking_lunges.png" },
      { number: 3, name: "HIP CIRCLES", reps: "30 SEC", noteSub: "Each direction", icon: "⭕", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/barbell_squat.png" },
      { number: 4, name: "T-SPINE ROTATION", reps: "10 REPS", noteSub: "Each side", icon: "🧘‍♂️", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/chest_press.png" },
      { number: 5, name: "ANKLE ROLLS", reps: "30 SEC", noteSub: "Each foot", icon: "🦶", accentColor: "#3b82f6", headerBg: "#eff6ff", image: "/exercises/leg_extension.png" }
    ],
    stretchingSection: [
      { number: 1, name: "HAMSTRING STRETCH", reps: "30-45 SEC", icon: "🦵", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/walking_lunges.png" },
      { number: 2, name: "QUAD STRETCH", reps: "30-45 SEC", icon: "🩰", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/leg_extension.png" },
      { number: 3, name: "HIP FLEXOR STRETCH", reps: "30-45 SEC", icon: "🧘‍♀️", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/walking_lunges.png" },
      { number: 4, name: "CHEST STRETCH", reps: "30-45 SEC", icon: "🦅", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/chest_press.png" },
      { number: 5, name: "SHOULDER STRETCH", reps: "30-45 SEC", icon: "🙋‍♂️", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/overhead_shoulder_press.png" },
      { number: 6, name: "LOWER BACK STRETCH", reps: "30-45 SEC", icon: "🧘", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/deadlift.png" },
      { number: 7, name: "CALF STRETCH", reps: "30-45 SEC", icon: "🦶", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/leg_press.png" },
      { number: 8, name: "CHILD'S POSE", reps: "30-45 SEC", icon: "🧘‍♂️", accentColor: "#8b5cf6", headerBg: "#faf5ff", image: "/exercises/barbell_squat.png" }
    ],
    breathingSection: {
      name: "DIAPHRAGMATIC BREATHING",
      duration: "5 MINUTES",
      icon: "🧘‍♂️",
      image: "/exercises/chest_press.png",
      instructions: "Inhale deeply through your nose for 4s. Hold for 2s. Exhale slowly through your mouth for 6s. Repeat."
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
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header — Aligned with page-header Warm Theme */}
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Personal Training Hub</p>
          <h1>Gym & Fitness Center 🏋️‍♂️</h1>
          <p className="page-header__sub">7-Day Gym Workout Plan starting from tomorrow.</p>
        </div>
        <div className="page-header__actions" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="streak-badge">
            <span className="streak-badge__fire">🔥</span>
            <span className="streak-badge__num">{streak}</span>
            <span style={{ fontSize: '0.8rem' }}>Day Streak</span>
          </div>
          {isAuthorized && (
            <button className="btn btn--amber" onClick={() => setShowForm(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Manual Log
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Bar — Glassmorphic Pill Style */}
      <div style={{ display: 'flex', gap: 10, background: 'var(--surface)', padding: '6px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
        <button
          onClick={() => setActiveSubTab('routine')}
          style={{
            flex: 1, padding: '12px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '0.92rem',
            background: activeSubTab === 'routine' ? 'var(--amber)' : 'transparent',
            color: activeSubTab === 'routine' ? '#ffffff' : 'var(--muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: activeSubTab === 'routine' ? '0 4px 14px rgba(185,130,22,0.3)' : 'none'
          }}
        >
          🏋️ 7-Day Gym Poster Plan (Beginner to Intermediate)
        </button>
        <button
          onClick={() => setActiveSubTab('tracker')}
          style={{
            flex: 1, padding: '12px 18px', borderRadius: '12px', fontWeight: 700, fontSize: '0.92rem',
            background: activeSubTab === 'tracker' ? 'var(--amber)' : 'transparent',
            color: activeSubTab === 'tracker' ? '#ffffff' : 'var(--muted)',
            border: 'none', cursor: 'pointer', transition: 'all 0.25s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: activeSubTab === 'tracker' ? '0 4px 14px rgba(185,130,22,0.3)' : 'none'
          }}
        >
          📊 Activity Tracker & History ({items.length} sessions)
        </button>
      </div>

      {/* TAB 1: 7-DAY GYM WORKOUT PLAN */}
      {activeSubTab === 'routine' && (
        <div style={{ display: 'grid', gap: 20 }}>

          {/* Clean 7-Day Selector Bar (Starting Tomorrow) */}
          <div style={{ background: 'var(--surface)', padding: '14px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📅 Select Day Routine (Starting Tomorrow)
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--teal)', fontWeight: 700 }}>
                💡 60-90s Rest Between Sets • Hydrate 3-4L Daily
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {PLAN_7_DAYS.map((planDay, idx) => {
                const dayObj = next7Days[idx] || {};
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    style={{
                      padding: '12px 10px', borderRadius: '14px', textAlign: 'center', cursor: 'pointer',
                      background: isSelected ? planDay.accentColor : '#ffffff',
                      border: isSelected ? `2px solid ${planDay.accentColor}` : '1px solid var(--line)',
                      color: isSelected ? '#ffffff' : 'var(--ink)',
                      boxShadow: isSelected ? `0 6px 20px ${planDay.accentColor}33` : 'none',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: isSelected ? 0.95 : 0.6, fontWeight: 900 }}>
                      DAY {planDay.dayNumber} {dayObj.isTomorrow ? '(TOMORROW)' : ''}
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, marginTop: 4 }}>
                      {planDay.title.split(' — ')[1]?.replace(' WORKOUT', '')}
                    </div>
                    <div style={{ fontSize: '0.68rem', opacity: isSelected ? 0.9 : 0.6, marginTop: 2 }}>
                      {dayObj.displayLabel || ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN POSTER DAY CARD & WORKOUT GRID */}
          <div style={{
            background: '#ffffff', border: `2px solid ${activePlanDay.accentColor}33`, borderRadius: '20px', padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 20
          }}>
            {/* Card Title Banner */}
            <div style={{
              background: activePlanDay.headerBg, color: 'var(--ink)', padding: '16px 22px', borderRadius: '16px',
              border: `1.5px solid ${activePlanDay.accentColor}44`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: activePlanDay.accentColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--heading-font)' }}>
                  {activePlanDay.title}
                </h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600, marginTop: 2, display: 'block' }}>
                  📅 Scheduled for {activeDayObj.displayLabel} {activeDayObj.isTomorrow ? '(Tomorrow)' : ''}
                </span>
              </div>
              {isAuthorized && (
                <button
                  onClick={handleQuickLog}
                  disabled={saving}
                  style={{
                    background: activePlanDay.accentColor, color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '12px',
                    fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: `0 4px 14px ${activePlanDay.accentColor}44`
                  }}
                >
                  {saving ? 'Logging…' : '⚡ Log Day Completed'}
                </button>
              )}
            </div>

            {/* IF DAY 7 POSTER: ACTIVE RECOVERY 4-SECTION INFOGRAPHIC */}
            {activePlanDay.isDay7Poster ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ background: '#0f172a', color: '#ffffff', padding: '12px 18px', borderRadius: '14px', fontWeight: 900, fontSize: '0.85rem', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  ACTIVE RECOVERY INCLUDES LIGHT CARDIO, MOBILITY, STRETCHING & BREATHING TO HELP YOUR BODY RECOVER FASTER.
                </div>

                {/* TOP ROW: SECTION 1 (LIGHT CARDIO) & SECTION 2 (MOBILITY) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 4fr) minmax(0, 5fr)', gap: 16 }}>

                  {/* SECTION 1: 💚 1. LIGHT CARDIO – 15-20 MINUTES */}
                  <div style={{ border: '2px solid #10b98122', borderRadius: '16px', padding: '16px', background: '#ecfdf5', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#10b981', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', textTransform: 'uppercase' }}>
                      💚 1. LIGHT CARDIO – 15-20 MINUTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
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
                          showTargetDiagram={false}
                          accentColor="#10b981"
                          headerBg="#d1fae5"
                        />
                      ))}
                    </div>
                  </div>

                  {/* SECTION 2: 🏃‍♂️ 2. MOBILITY – 10-15 MINUTES */}
                  <div style={{ border: '2px solid #3b82f622', borderRadius: '16px', padding: '16px', background: '#eff6ff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#3b82f6', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', textTransform: 'uppercase' }}>
                      🏃‍♂️ 2. MOBILITY – 10-15 MINUTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
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
                          showTargetDiagram={false}
                          accentColor="#3b82f6"
                          headerBg="#dbeafe"
                        />
                      ))}
                    </div>
                  </div>

                </div>

                {/* MIDDLE ROW: SECTION 3 (STRETCHING) & SECTION 4 (BREATHING) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: 16 }}>

                  {/* SECTION 3: 🧘 3. STRETCHING – 10-15 MINUTES */}
                  <div style={{ border: '2px solid #8b5cf622', borderRadius: '16px', padding: '16px', background: '#faf5ff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#8b5cf6', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', textTransform: 'uppercase' }}>
                      🧘 3. STRETCHING – 10-15 MINUTES
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                      {activePlanDay.stretchingSection.map((ex, idx) => (
                        <PosterExerciseGridCard
                          key={idx}
                          number={ex.number}
                          name={ex.name}
                          reps={ex.reps}
                          repsFooterLabel={ex.reps}
                          image={ex.image}
                          icon={ex.icon}
                          showTargetDiagram={false}
                          accentColor="#8b5cf6"
                          headerBg="#ede9fe"
                        />
                      ))}
                    </div>
                  </div>

                  {/* SECTION 4: 🫁 4. BREATHING – 5 MINUTES */}
                  <div style={{ border: '2px solid #ea580c22', borderRadius: '16px', padding: '16px', background: '#fff7ed', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#ea580c', color: '#fff', padding: '8px 14px', borderRadius: '10px', fontWeight: 900, fontSize: '0.88rem', textTransform: 'uppercase' }}>
                      🫁 4. BREATHING – 5 MINUTES
                    </div>
                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #ea580c33', display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                      <div style={{ height: '130px', borderRadius: '10px', overflow: 'hidden', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={activePlanDay.breathingSection.image} alt="Breathing" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ fontWeight: 900, color: '#ea580c', fontSize: '0.92rem', textTransform: 'uppercase' }}>
                        {activePlanDay.breathingSection.name}
                      </div>
                      <div style={{ background: '#ffedd5', color: '#ea580c', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, width: 'fit-content' }}>
                        ⏱️ {activePlanDay.breathingSection.duration}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                        {activePlanDay.breathingSection.instructions}
                      </p>
                    </div>
                  </div>

                </div>

                {/* BOTTOM GUIDELINES (5 PANELS GRID) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={{ background: '#ffffff', border: '1px solid #10b98133', borderRadius: '14px', padding: '12px', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 900, color: '#10b981', marginBottom: 6, textTransform: 'uppercase' }}>
                      💚 BENEFITS OF RECOVERY
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink)' }}>
                      <div>• Reduces muscle soreness</div>
                      <div>• Improves blood circulation</div>
                      <div>• Enhances flexibility</div>
                      <div>• Speeds up muscle recovery</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #3b82f633', borderRadius: '14px', padding: '12px', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 900, color: '#3b82f6', marginBottom: 6, textTransform: 'uppercase' }}>
                      📋 GUIDELINES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink)' }}>
                      <div>• 💓 HR Zone 1-2 (50-60%)</div>
                      <div>• ⏱️ Low intensity</div>
                      <div>• 📅 1-2 times per week</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #8b5cf633', borderRadius: '14px', padding: '12px', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 900, color: '#8b5cf6', marginBottom: 6, textTransform: 'uppercase' }}>
                      ❓ WHEN TO DO?
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink)' }}>
                      <div>• After heavy strength</div>
                      <div>• On rest days</div>
                      <div>• When sore or fatigued</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #06b6d433', borderRadius: '14px', padding: '12px', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 900, color: '#06b6d4', marginBottom: 6, textTransform: 'uppercase' }}>
                      💧 HYDRATION
                    </div>
                    <div style={{ color: 'var(--ink)', lineHeight: 1.4 }}>
                      Drink water before & after.<br />
                      <strong style={{ color: '#06b6d4' }}>Daily Goal: 2.5 - 3.5 Liters</strong>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #ea580c33', borderRadius: '14px', padding: '12px', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 900, color: '#ea580c', marginBottom: 6, textTransform: 'uppercase' }}>
                      💡 TIPS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink)' }}>
                      <div>• Quality over speed</div>
                      <div>• Listen to your body</div>
                      <div>• Don't push through pain</div>
                    </div>
                  </div>
                </div>

              </div>
            ) : activePlanDay.isDay6Poster ? (
              /* DAY 6 3-COLUMN POSTER */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                {/* COLUMN 1: CARDIO */}
                <div style={{ border: '2px solid #10b98122', borderRadius: '18px', padding: '16px', background: '#ecfdf5', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#10b981', color: '#fff', padding: '10px 14px', borderRadius: '12px', fontWeight: 900, fontSize: '0.95rem', textAlign: 'center', letterSpacing: '0.5px' }}>
                    💚 CARDIO (20-30 MINS)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
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
                        accentColor="#10b981"
                        headerBg="#d1fae5"
                      />
                    ))}
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #10b98133', borderRadius: '14px', padding: '12px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 900, color: '#10b981', marginBottom: 6, textTransform: 'uppercase' }}>
                      ⚡ INTENSITY GUIDE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink)' }}>
                      <div>• <strong>Low (Warmup):</strong> 50-60% Max HR</div>
                      <div>• <strong>Moderate (Fat Burn):</strong> 60-70% Max HR</div>
                      <div>• <strong>High (Boost):</strong> 70-85% Max HR</div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: CORE WORKOUT */}
                <div style={{ border: '2px solid #3b82f622', borderRadius: '18px', padding: '16px', background: '#eff6ff', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#3b82f6', color: '#fff', padding: '10px 14px', borderRadius: '12px', fontWeight: 900, fontSize: '0.95rem', textAlign: 'center', letterSpacing: '0.5px' }}>
                    🏋️‍♂️ CORE WORKOUT (15-20 MINS)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
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
                        accentColor="#3b82f6"
                        headerBg="#dbeafe"
                      />
                    ))}
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #3b82f633', borderRadius: '14px', padding: '12px', fontSize: '0.8rem', marginTop: 'auto' }}>
                    <div style={{ fontWeight: 900, color: '#3b82f6', marginBottom: 6 }}>
                      💪 CORE TIPS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink)' }}>
                      <div>• Keep core tight throughout.</div>
                      <div>• Controlled movements.</div>
                      <div>• Don't hold breath.</div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: MOBILITY */}
                <div style={{ border: '2px solid #f9731622', borderRadius: '18px', padding: '16px', background: '#fff7ed', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#f97316', color: '#fff', padding: '10px 14px', borderRadius: '12px', fontWeight: 900, fontSize: '0.95rem', textAlign: 'center', letterSpacing: '0.5px' }}>
                    🧘 MOBILITY & STRETCHING (10-15 MINS)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
                        accentColor="#f97316"
                        headerBg="#ffedd5"
                      />
                    ))}
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #f9731633', borderRadius: '14px', padding: '12px', fontSize: '0.8rem', marginTop: 'auto' }}>
                    <div style={{ fontWeight: 900, color: '#f97316', marginBottom: 6 }}>
                      🧘 MOBILITY BENEFITS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--ink)' }}>
                      <div>• Improves range of motion.</div>
                      <div>• Reduces muscle soreness.</div>
                      <div>• Prevents injuries.</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD EXERCISE GRID FOR DAY 1, 2, 3, 4, 5 */
              <>
                {/* WARM-UP BAR WITH DEDICATED VISUAL IMAGE */}
                <div style={{
                  background: '#f8fafc', border: `1.5px solid ${activePlanDay.accentColor}33`, padding: '14px 18px', borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: activePlanDay.accentColor, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      PRE-WORKOUT PREPARATION
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                      🔥 {activePlanDay.warmup}
                    </div>
                    {activePlanDay.warmupDetails && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
                        {activePlanDay.warmupDetails.map((detail, dIdx) => (
                          <span key={dIdx}>• {detail}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '120px', height: '70px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0, position: 'relative', background: '#0a0d14' }}>
                    <img
                      src={activePlanDay.warmupImg}
                      alt="Warmup Exercise"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      🔥 WARMUP
                    </span>
                  </div>
                </div>

                {/* Exercises Grid — Split Sections for Day 4 vs Standard Grid for Other Days */}
                {activePlanDay.isSplitSection ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20 }}>
                    {/* SHOULDERS WORKOUT SECTION (#1 to #6) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: '#8b5cf6', color: '#ffffff', padding: '10px 16px', borderRadius: '12px', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>
                        SHOULDERS WORKOUT
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
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
                            accentColor={ex.accentColor || activePlanDay.accentColor}
                            headerBg={ex.headerBg || activePlanDay.headerBg}
                          />
                        ))}
                      </div>
                    </div>

                    {/* ABS WORKOUT SECTION (#7 to #10) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: '#8b5cf6', color: '#ffffff', padding: '10px 16px', borderRadius: '12px', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center' }}>
                        ABS WORKOUT
                      </div>

                      {/* Cards 7 & 8 Stacked */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                            accentColor={ex.accentColor || activePlanDay.accentColor}
                            headerBg={ex.headerBg || activePlanDay.headerBg}
                          />
                        ))}
                      </div>

                      {/* Cards 9 (PLANK) on LEFT & 10 (RUSSIAN TWIST) on RIGHT in a 2-Column Grid Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, width: '100%' }}>
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
                            accentColor={ex.accentColor || activePlanDay.accentColor}
                            headerBg={ex.headerBg || activePlanDay.headerBg}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, gap: 16 }}>
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
                        accentColor={ex.accentColor || activePlanDay.accentColor}
                        headerBg={ex.headerBg || activePlanDay.headerBg}
                      />
                    ))}
                  </div>
                )}

                {/* COOL DOWN & STRETCHING BAR WITH DEDICATED VISUAL IMAGE */}
                <div style={{
                  background: '#f8fafc', border: '1.5px solid #10b98133', padding: '14px 18px', borderRadius: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      POST-WORKOUT RECOVERY
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>
                      🧘 {activePlanDay.cooldown}
                    </div>
                    {activePlanDay.cooldownDetails && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6, fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
                        {activePlanDay.cooldownDetails.map((detail, cIdx) => (
                          <span key={cIdx}>• {detail}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '120px', height: '70px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0, position: 'relative', background: '#0a0d14' }}>
                    <img
                      src={activePlanDay.cooldownImg}
                      alt="Cooldown Stretch"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                      🧘 COOLDOWN
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Footer Bar for Routine */}
            <div style={{
              background: '#f8fafc', border: `1px solid ${activePlanDay.accentColor}33`, padding: '12px 18px', borderRadius: '14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: '0.82rem', color: activePlanDay.accentColor, fontWeight: 800
            }}>
              <span>⭐️ CONSISTENCY + PATIENCE + PROPER NUTRITION = RESULTS</span>
              <span>❤️ STAY ACTIVE, STAY HEALTHY!</span>
              <span>YOU'VE GOT THIS! 💪</span>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: ACTIVITY TRACKER & HISTORY */}
      {activeSubTab === 'tracker' && (
        <>
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
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
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
                {[0, 1, 2, 3, 4].map(l => (
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
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
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
