import React from 'react';

export default function StatusPill({ value }) {
  if (!value) return null;
  const v = String(value).toLowerCase();

  let cls = 'pill';
  if (['income', 'salary', 'credit'].includes(v))            cls += ' pill--income';
  else if (['expense', 'debit', 'spent'].includes(v))        cls += ' pill--expense';
  else if (['paid', 'completed', 'done', 'active'].includes(v)) cls += ' pill--completed';
  else if (['pending', 'partial', 'in progress'].includes(v)) cls += ' pill--pending';
  else if (['overdue', 'missed', 'failed'].includes(v))      cls += ' pill--expense';
  else if (['gym', 'strength', 'cardio', 'walk'].includes(v)) cls += ' pill--gym';
  else if (['yoga', 'pilates', 'meditation'].includes(v))    cls += ' pill--yoga';
  else if (['rest', 'skip', 'off'].includes(v))              cls += ' pill--rest';
  else                                                        cls += ' pill--pending';

  return <span className={cls}>{value}</span>;
}
