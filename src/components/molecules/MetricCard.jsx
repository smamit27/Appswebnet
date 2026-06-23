import React from 'react';

/**
 * @param {string}  label
 * @param {string}  value
 * @param {string}  detail
 * @param {string}  icon       - emoji or svg string
 * @param {'sand'|'teal'|'coral'|'pine'|'amber'|'purple'|'rose'} tone
 * @param {string}  trend      - e.g. '+12%'
 * @param {'up'|'down'} trendDir
 */
export default function MetricCard({ label, value, detail, icon, tone = 'sand', trend, trendDir }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      {icon && <div className="metric-card__icon">{icon}</div>}
      <p className="metric-card__label">{label}</p>
      <h3 className="metric-card__value">{value}</h3>
      {detail && <p className="metric-card__detail">{detail}</p>}
      {trend && (
        <div className={`metric-card__trend metric-card__trend--${trendDir || 'up'}`}>
          {trendDir === 'down' ? '↓' : '↑'} {trend}
        </div>
      )}
    </article>
  );
}
