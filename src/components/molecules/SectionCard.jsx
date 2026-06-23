import React from 'react';

/**
 * @param {string}    id
 * @param {string}    badge     - eyebrow label
 * @param {string}    title
 * @param {string}    subtitle
 * @param {ReactNode} actions
 * @param {ReactNode} children
 */
export default function SectionCard({ id, badge, title, subtitle, actions, children }) {
  return (
    <section className="section-card" id={id}>
      <div className="section-card__header">
        <div>
          {badge   && <p className="section-card__eyebrow">{badge}</p>}
          {title   && <h2>{title}</h2>}
          {subtitle && <p className="section-card__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="section-card__actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
