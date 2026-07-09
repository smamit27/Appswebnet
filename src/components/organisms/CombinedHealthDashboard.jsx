import React, { useState } from 'react';
import DietPlan from './DietPlan.jsx';
import GymTracker from './GymTracker.jsx';

export default function CombinedHealthDashboard({
  amitGymItems,
  swetaGymItems,
  amitGymAdd,
  amitGymDelete,
  swetaGymAdd,
  swetaGymDelete,
  isAuthorized
}) {
  const [activePerson, setActivePerson] = useState('Amit');
  const [activeTab, setActiveTab] = useState('diet');

  const isAmit = activePerson === 'Amit';
  const gymItems = isAmit ? amitGymItems : swetaGymItems;
  const onAddGym = isAmit ? amitGymAdd : swetaGymAdd;
  const onDeleteGym = isAmit ? amitGymDelete : swetaGymDelete;

  return (
    <div className="combined-health-dashboard" style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${isAmit ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActivePerson('Amit')}
            style={{ padding: '8px 24px', borderRadius: '20px' }}
          >
            Amit
          </button>
          <button 
            className={`btn ${!isAmit ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActivePerson('Sweta')}
            style={{ padding: '8px 24px', borderRadius: '20px' }}
          >
            Sweta
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${activeTab === 'diet' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('diet')}
          >
            Diet Plan
          </button>
          <button 
            className={`btn ${activeTab === 'gym' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('gym')}
          >
            Gym Tracker
          </button>
        </div>
      </div>

      <div className="health-content">
        {activeTab === 'diet' && (
          <DietPlan name={activePerson} />
        )}
        {activeTab === 'gym' && (
          <GymTracker
            name={activePerson}
            items={gymItems}
            isAuthorized={isAuthorized}
            onAdd={onAddGym}
            onDelete={onDeleteGym}
          />
        )}
      </div>
    </div>
  );
}
