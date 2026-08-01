import React, { useState } from 'react';
import DietPlan from './DietPlan.jsx';
import GymTracker from './GymTracker.jsx';

export default function CombinedHealthDashboard({
  amitGymItems,
  amitGymAdd,
  amitGymDelete,
  isAuthorized
}) {
  const [activeTab, setActiveTab] = useState('gym');

  return (
    <div className="combined-health-dashboard" style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`btn ${activeTab === 'diet' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('diet')}
            style={{ padding: '10px 28px', borderRadius: '20px', fontWeight: 600, fontSize: '0.95rem' }}
          >
            🥗 Diet Plan
          </button>
          <button 
            className={`btn ${activeTab === 'gym' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('gym')}
            style={{ padding: '10px 28px', borderRadius: '20px', fontWeight: 600, fontSize: '0.95rem' }}
          >
            🏋️ Gym Tracker
          </button>
        </div>
      </div>

      <div className="health-content">
        {activeTab === 'diet' && (
          <DietPlan name="Family" />
        )}
        {activeTab === 'gym' && (
          <GymTracker
            name="Daily Workout"
            items={amitGymItems}
            isAuthorized={isAuthorized}
            onAdd={amitGymAdd}
            onDelete={amitGymDelete}
          />
        )}
      </div>
    </div>
  );
}

