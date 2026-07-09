import React, { useState } from 'react';
import SectionCard from '../molecules/SectionCard.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const AMIT_WEIGHT_DATA = [
  { date: '2026-06-01', weight: 85.0 },
  { date: '2026-06-08', weight: 84.5 },
  { date: '2026-06-15', weight: 84.1 },
  { date: '2026-06-22', weight: 83.8 },
  { date: '2026-06-29', weight: 83.2 },
  { date: '2026-07-06', weight: 82.5 },
];

const SWETA_WEIGHT_DATA = [
  { date: '2026-06-01', weight: 59.0 },
  { date: '2026-06-08', weight: 58.8 },
  { date: '2026-06-15', weight: 58.5 },
  { date: '2026-06-22', weight: 58.2 },
  { date: '2026-06-29', weight: 58.0 },
  { date: '2026-07-06', weight: 57.5 },
];

const AMIT_VITALS = { sleep: 6.5, water: 2.5, steps: 8500 };
const SWETA_VITALS = { sleep: 7.2, water: 3.0, steps: 11200 };

export default function HealthMetrics() {
  const [activePerson, setActivePerson] = useState('Amit');
  const isAmit = activePerson === 'Amit';
  
  const weightData = isAmit ? AMIT_WEIGHT_DATA : SWETA_WEIGHT_DATA;
  const vitals = isAmit ? AMIT_VITALS : SWETA_VITALS;

  return (
    <div className="health-metrics" style={{ display: 'grid', gap: '20px' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Health & Vitals Metrics</h2>
          <p>Track your physical well-being over time</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${isAmit ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActivePerson('Amit')}
            style={{ padding: '4px 16px', borderRadius: '15px' }}
          >
            Amit
          </button>
          <button 
            className={`btn ${!isAmit ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActivePerson('Sweta')}
            style={{ padding: '4px 16px', borderRadius: '15px' }}
          >
            Sweta
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <SectionCard title="Avg Sleep" delay={0.1}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8e44ad' }}>
            {vitals.sleep} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.5)' }}>hrs/night</span>
          </div>
        </SectionCard>
        <SectionCard title="Water Intake" delay={0.2}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3498db' }}>
            {vitals.water} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.5)' }}>L/day</span>
          </div>
        </SectionCard>
        <SectionCard title="Daily Steps" delay={0.3}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e67e22' }}>
            {vitals.steps.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.5)' }}>steps</span>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={`${activePerson}'s Weight Trend (Last 6 Weeks)`} delay={0.4}>
        <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
          <ResponsiveContainer>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                domain={['auto', 'auto']}
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                tickFormatter={(val) => `${val} kg`}
              />
              <Tooltip 
                contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}
                formatter={(val) => [`${val} kg`, 'Weight']}
                labelFormatter={(val) => new Date(val).toLocaleDateString('en-IN')}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke={isAmit ? "#9b2226" : "#264F8B"} 
                strokeWidth={3} 
                dot={{ r: 4, fill: isAmit ? "#9b2226" : "#264F8B" }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
