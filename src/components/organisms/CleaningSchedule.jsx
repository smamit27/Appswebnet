import React from 'react';
import './CleaningSchedule.css';

const scheduleData = [
  { day: 'MONDAY', title: 'KITCHEN RESET', color: 'rose', icon: '🍲', tasks: ['Wipe counters & appliances', 'Clean sink', 'Sweep & mop floor', 'Empty trash', 'Clean microwave'] },
  { day: 'TUESDAY', title: 'BATHROOM REFRESH', color: 'teal', icon: '🛁', tasks: ['Clean toilets', 'Wipe mirrors', 'Scrub sinks & counters', 'Clean shower/tub', 'Replace towels'] },
  { day: 'WEDNESDAY', title: 'DUST & DECLUTTER', color: 'amber', icon: '🪴', tasks: ['Dust furniture', 'Declutter one room', 'Wipe baseboards', 'Organize surfaces'] },
  { day: 'THURSDAY', title: 'FLOORS DAY', color: 'purple', icon: '🧹', tasks: ['Vacuum all carpets', 'Sweep hard floors', 'Mop high-traffic areas', 'Shake out rugs'] },
  { day: 'FRIDAY', title: 'BEDROOMS', color: 'rose', icon: '🛏️', tasks: ['Change sheets', 'Dust furniture', 'Vacuum floors', 'Put away laundry', 'Tidy nightstands'] },
  { day: 'SATURDAY', title: 'DEEP CLEAN ZONE', color: 'pine', icon: '🧺', tasks: ['Clean fridge OR pantry', 'Wash windows', 'Organize closets', 'Clean doors & light switches'] },
  { day: 'SUNDAY', title: 'FAMILY RESET', color: 'rose', icon: '☕', tasks: ['Meal prep', 'Plan the week', 'Put away clutter', 'Start laundry', 'Relax!'] },
];

const dailyTasks = [
  { label: 'MAKE BEDS', icon: '🛏️', bg: 'bg-rose-soft' },
  { label: 'WASH DISHES', icon: '🍽️', bg: 'bg-sand' },
  { label: 'WIPE KITCHEN COUNTERS', icon: '🧽', bg: 'bg-teal-soft' },
  { label: 'ONE LOAD OF LAUNDRY', icon: '🧺', bg: 'bg-purple-soft' },
  { label: 'QUICK TOY PICKUP', icon: '🧸', bg: 'bg-amber-soft' },
];

export default function CleaningSchedule() {
  return (
    <div className="cleaning-container">
      <header className="cleaning-header">
        <div className="cleaning-header-decor">✨</div>
        <div className="cleaning-header-text">
          <h1>WEEKLY<br/><span>CLEANING SCHEDULE</span></h1>
          <p className="cleaning-subtitle">a clean home, a happy heart 💖</p>
        </div>
        <div className="cleaning-header-house">🏠</div>
      </header>

      <div className="cleaning-grid">
        {scheduleData.map((item, idx) => (
          <div key={idx} className={`cleaning-card cleaning-card--${item.color}`}>
            <div className={`cleaning-day cleaning-day--${item.color}`}>
              {item.day} <span className="heart-icon">♡</span>
            </div>
            <h3 className={`cleaning-title text-${item.color}`}>{item.title}</h3>
            <ul className="cleaning-task-list">
              {item.tasks.map((task, i) => (
                <li key={i}>
                  <span className={`heart-bullet text-${item.color}`}>♡</span> {task}
                </li>
              ))}
            </ul>
            <div className="cleaning-icon">{item.icon}</div>
          </div>
        ))}
      </div>

      <div className="daily-tasks-section">
        <h2 className="daily-title">
          <span>⋋</span> DAILY TASKS <small>(10-15 MINUTES)</small> <span>⋌</span>
        </h2>
        <div className="daily-grid">
          {dailyTasks.map((task, idx) => (
             <div key={idx} className="daily-item">
               <div className={`daily-icon-circle ${task.bg}`}>
                 {task.icon}
               </div>
               <p>{task.label}</p>
             </div>
          ))}
        </div>
        <p className="daily-footer">small steps every day = a beautiful home 💖</p>
      </div>
    </div>
  );
}
