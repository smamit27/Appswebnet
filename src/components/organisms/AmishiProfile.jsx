import React, { useState, useEffect } from "react";
import { db } from "../../firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import SectionCard from "../molecules/SectionCard.jsx";

const QUESTIONS = [
  {
    category: "1. Basic Information",
    items: [
      "What is your full name?", "What do you like people to call you?", "When is your birthday?",
      "How old are you?", "Which school do you go to?", "Which class are you in?",
      "Who are your best friends?", "Where do you live?", "What languages do you speak?",
      "What is your favorite color?"
    ]
  },
  {
    category: "2. Family",
    items: [
      "What is your father's name?", "What is your mother's name?", "Do you have siblings?",
      "Who do you love spending time with?", "Who makes you laugh the most?",
      "What do you like doing with your dad?", "What do you like doing with your mom?",
      "Who tells the best stories?", "Who helps you when you're sad?", "What makes your family special?"
    ]
  },
  {
    category: "3. Favorites",
    items: [
      "Favorite food?", "Favorite fruit?", "Favorite vegetable?", "Favorite ice cream?",
      "Favorite chocolate?", "Favorite cartoon?", "Favorite movie?", "Favorite animal?",
      "Favorite bird?", "Favorite flower?", "Favorite teacher?", "Favorite game?",
      "Favorite toy?", "Favorite song?", "Favorite book?", "Favorite place?",
      "Favorite festival?", "Favorite dress?", "Favorite superhero?", "Favorite princess?"
    ]
  },
  {
    category: "4. School",
    items: [
      "What subject do you like most?", "Which subject is difficult?", "What do you enjoy at school?",
      "Who is your best friend in school?", "What makes you happy at school?", "Do you like drawing?",
      "Do you like dancing?", "Do you like singing?", "Do you enjoy sports?", "What do you want to learn?"
    ]
  },
  {
    category: "5. Dreams",
    items: [
      "What do you want to become when you grow up?", "Why do you want to become that?",
      "Where do you want to travel?", "If you had magic, what would you do?",
      "If you had one wish, what would it be?", "What makes you excited?", "What makes you smile?",
      "What makes you proud?", "What makes you feel brave?", "What is your biggest dream?"
    ]
  },
  {
    category: "6. Daily Routine",
    items: [
      "What time do you wake up?", "What do you eat for breakfast?", "What do you do after school?",
      "When do you play?", "When do you study?", "What time do you sleep?", "Do you brush twice a day?",
      "Do you like helping at home?", "What chores do you do?", "What is your bedtime story?"
    ]
  },
  {
    category: "7. Emotions",
    items: [
      "What makes you happy?", "What makes you sad?", "What makes you angry?", "What scares you?",
      "What makes you laugh?", "What do you do when you're upset?", "Who comforts you?",
      "How do you celebrate success?", "What makes you feel loved?", "What is your happiest memory?"
    ]
  },
  {
    category: "8. Health",
    items: [
      "What foods do you like?", "What foods don't you like?", "Do you drink enough water?",
      "What sports do you enjoy?", "Do you like running?", "What is your favorite healthy snack?",
      "What medicine do you take?", "Do you wear glasses?", "Are you allergic to anything?",
      "How do you stay healthy?"
    ]
  },
  {
    category: "9. AI Personality",
    items: [
      "How should the AI greet you?", "What nickname should the AI use?", "Should the AI tell jokes?",
      "Should the AI remind you to study?", "Should the AI remind you to take medicine?",
      "Should the AI tell bedtime stories?", "Should the AI speak like a teacher or a friend?",
      "Should the AI praise you when you do well?", "What should the AI never say?",
      "What is one thing you want the AI to always remember about you?"
    ]
  }
];

export default function AmishiProfile({ user }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        // Load from mock-db if offline
        try {
          const localData = localStorage.getItem('mock-db-amishi_profile');
          if (localData) setAnswers(JSON.parse(localData));
        } catch(e) {}
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'amishi', 'profile_qa');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setAnswers(snap.data().answers || {});
        }
      } catch (err) {
        console.error("Failed to load Amishi profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!user) {
        localStorage.setItem('mock-db-amishi_profile', JSON.stringify(answers));
      } else {
        const docRef = doc(db, 'amishi', 'profile_qa');
        await setDoc(docRef, { answers, updatedAt: serverTimestamp() }, { merge: true });
      }
      alert('Profile saved successfully! The AI will use these answers to personalize interactions.');
    } catch (err) {
      alert('Error saving profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (question, value) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  if (loading) return <div>Loading Profile...</div>;

  const currentCategory = QUESTIONS[activeCategory];

  const calculateProgress = () => {
    const totalQuestions = QUESTIONS.reduce((sum, cat) => sum + cat.items.length, 0);
    const answered = Object.values(answers).filter(v => v && v.trim() !== '').length;
    return Math.round((answered / totalQuestions) * 100);
  };

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <SectionCard title="Amishi's Interview & AI Profile">
        <p style={{ margin: 0, marginBottom: 16, color: 'var(--muted)', fontSize: '0.9rem' }}>
          Fill out this Q&A to help the AI Assistant personalize stories, reminders, and conversations for Amishi.
        </p>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Completion Progress</span>
            <span>{calculateProgress()}%</span>
          </div>
          <div style={{ width: '100%', background: 'var(--surface-strong)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${calculateProgress()}%`, background: 'var(--teal)', height: '100%', transition: 'width 0.3s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 16 }}>
          {QUESTIONS.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: idx === activeCategory ? 'var(--teal)' : 'var(--surface-strong)',
                color: idx === activeCategory ? '#fff' : 'var(--ink)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.category.split(' ')[1]}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>{currentCategory.category}</h3>
          {currentCategory.items.map((q, idx) => (
            <label key={idx} className="field">
              <span>{q}</span>
              <input 
                type="text" 
                value={answers[q] || ''} 
                onChange={(e) => handleChange(q, e.target.value)}
                placeholder="Type answer here..."
              />
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button 
            className="btn btn--outline" 
            disabled={activeCategory === 0}
            onClick={() => setActiveCategory(p => Math.max(0, p - 1))}
          >
            ← Previous Section
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Answers'}
            </button>
            <button 
              className="btn btn--outline" 
              disabled={activeCategory === QUESTIONS.length - 1}
              onClick={() => setActiveCategory(p => Math.min(QUESTIONS.length - 1, p + 1))}
            >
              Next Section →
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
