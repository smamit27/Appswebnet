import React from 'react';

/**
 * @param {string} label
 * @param {number} value  - Current value
 * @param {number} total  - Max value
 * @param {'teal'|'coral'|'amber'|'pine'|'purple'} tone
 */
export default function ProgressBar({ label, value = 0, total = 100, tone = 'teal' }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="progress-block">
      <div className="progress-block__row">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-track">
        <span
          className={`progress-fill progress-fill--${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
