import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SectionCard from '../molecules/SectionCard.jsx';
import ProgressBar from '../atoms/ProgressBar.jsx';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AMIT_PROJECTION_DATA = [
  { week: 'Wk 1', weight: 85.7 },
  { week: 'Wk 4', weight: 83.5 },
  { week: 'Wk 8', weight: 81.0 },
  { week: 'Wk 12', weight: 79.5 },
  { week: 'Wk 16', weight: 77.5 },
  { week: 'Wk 20', weight: 76.0 },
];

const AMIT_WEEKLY_PLAN = {
  'Monday': [
    { time: '06:30 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Apple Cider Vinegar 🍎' },
    { time: '07:30 AM', name: 'Pre-Workout ⚡', desc: 'Carbs: 1 Banana 🍌 or Handful of Almonds 🌰 for energy', protein: 2 },
    { time: '08:00 AM', name: 'WORKOUT: Gym/Class 🏋️', desc: 'Choose based on availability: Yoga 🧘‍♂️, Dance 🕺, Burn 🔥, HRX, Adidas or Gym (Push Day)' },
    { time: '09:30 AM', name: 'Post-Workout 💪', desc: 'Protein: 5 Boiled Egg Whites 🥚 OR 100g Roasted Soya Chunks 🧆. Carbs: 1/2 Apple 🍎', protein: 25 },
    { time: '10:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 3 Egg Whites 🥚 & 1 Yolk 🍳. Carbs: Oats 🥣 with berries 🫐. Fats: Peanut butter 🥜', protein: 25 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 150g Chicken 🍗 / Soya Chunks 🧆 + 1 bowl Dal 🍲. Carbs: 1 Roti 🫓 / Quinoa. Veggies: Subzi 🥦', protein: 50 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Protein: Boiled Chana 🥗. Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 10 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗. Carbs: Light Soup 🥣. Veggies: Salad 🥗', protein: 35 }
  ],
  'Tuesday': [
    { time: '06:30 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Apple Cider Vinegar 🍎' },
    { time: '07:30 AM', name: 'Pre-Workout ⚡', desc: 'Carbs: 1 Banana 🍌 or Handful of Almonds 🌰 for energy', protein: 2 },
    { time: '08:00 AM', name: 'WORKOUT: Gym/Class 🏋️', desc: 'Choose based on availability: Yoga 🧘‍♂️, Dance 🕺, Burn 🔥, HRX, Adidas or Gym (Pull Day)' },
    { time: '09:30 AM', name: 'Post-Workout 💪', desc: 'Protein: 5 Boiled Egg Whites 🥚 OR 100g Roasted Soya Chunks 🧆. Carbs: 1/2 Apple 🍎', protein: 25 },
    { time: '10:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 3 Egg Whites 🥚 & 1 Yolk 🍳. Carbs: Oats 🥣 with berries 🫐. Fats: Peanut butter 🥜', protein: 25 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 150g Chicken 🍗 / Soya Chunks 🧆 + 1 bowl Dal 🍲. Carbs: 1 Roti 🫓 / Quinoa. Veggies: Subzi 🥦', protein: 50 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Protein: Boiled Chana 🥗. Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 10 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗. Carbs: Light Soup 🥣. Veggies: Salad 🥗', protein: 35 }
  ],
  'Wednesday': [
    { time: '07:00 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Apple Cider Vinegar 🍎' },
    { time: '08:00 AM', name: 'WORKOUT: Gym/Class 🏋️', desc: 'Choose based on availability: Yoga 🧘‍♂️, Dance 🕺, Burn 🔥, HRX, Adidas or Active Recovery' },
    { time: '09:30 AM', name: 'Breakfast 🍳', desc: 'Protein: Besan Chilla 🥞 / 3 Egg Whites 🥚. Carbs: Poha 🍛 with Peanuts 🥜', protein: 25 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 1 bowl Dal 🍲 + Curd 🥛. Carbs: 1 Roti 🫓 (Low carb day). Veggies: Subzi 🥦 & Salad 🥗', protein: 45 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Fats/Protein: Handful of Almonds/Walnuts 🌰 with Green Tea 🍵', protein: 8 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Fish 🐟 / Paneer Tikka 🧀 / Chicken 🍗. Veggies: Steamed Veggies 🥦', protein: 40 }
  ],
  'Thursday': [
    { time: '06:30 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Apple Cider Vinegar 🍎' },
    { time: '07:30 AM', name: 'Pre-Workout ⚡', desc: 'Carbs: 1 Banana 🍌 or Handful of Almonds 🌰 for energy', protein: 2 },
    { time: '08:00 AM', name: 'WORKOUT: Gym/Class 🏋️', desc: 'Choose based on availability: Yoga 🧘‍♂️, Dance 🕺, Burn 🔥, HRX, Adidas or Gym (Leg Day)' },
    { time: '09:30 AM', name: 'Post-Workout 💪', desc: 'Protein: 5 Boiled Egg Whites 🥚 OR 100g Roasted Soya Chunks 🧆. Carbs: 1/2 Apple 🍎', protein: 25 },
    { time: '10:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 3 Egg Whites 🥚 & 1 Yolk 🍳. Carbs: Oats 🥣 with berries 🫐. Fats: Peanut butter 🥜', protein: 25 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 150g Chicken 🍗 / Soya Chunks 🧆 + 1 bowl Dal 🍲. Carbs: 1 Roti 🫓 / Quinoa. Veggies: Subzi 🥦', protein: 50 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Protein: Boiled Chana 🥗. Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 10 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗. Carbs: Light Soup 🥣. Veggies: Salad 🥗', protein: 35 }
  ],
  'Friday': [
    { time: '06:30 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Apple Cider Vinegar 🍎' },
    { time: '07:30 AM', name: 'Pre-Workout ⚡', desc: 'Carbs: 1 Banana 🍌 or Handful of Almonds 🌰 for energy', protein: 2 },
    { time: '08:00 AM', name: 'WORKOUT: Gym/Class 🏋️', desc: 'Choose based on availability: Yoga 🧘‍♂️, Dance 🕺, Burn 🔥, HRX, Adidas or Gym (Push Day)' },
    { time: '09:30 AM', name: 'Post-Workout 💪', desc: 'Protein: 5 Boiled Egg Whites 🥚 OR 100g Roasted Soya Chunks 🧆. Carbs: 1/2 Apple 🍎', protein: 25 },
    { time: '10:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 3 Egg Whites 🥚 & 1 Yolk 🍳. Carbs: Oats 🥣 with berries 🫐. Fats: Peanut butter 🥜', protein: 25 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 150g Chicken 🍗 / Soya Chunks 🧆 + 1 bowl Dal 🍲. Carbs: 1 Roti 🫓 / Quinoa. Veggies: Subzi 🥦', protein: 50 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Protein: Boiled Chana 🥗. Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 10 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗. Carbs: Light Soup 🥣. Veggies: Salad 🥗', protein: 35 }
  ],
  'Saturday': [
    { time: '07:00 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Apple Cider Vinegar 🍎' },
    { time: '08:00 AM', name: 'WORKOUT: Gym/Class 🏋️', desc: 'Choose based on availability: Yoga 🧘‍♂️, Dance 🕺, Burn 🔥, HRX, Adidas or Gym (Legs/Core)' },
    { time: '09:30 AM', name: 'Post-Workout 💪', desc: 'Protein: 5 Boiled Egg Whites 🥚 OR 100g Roasted Soya Chunks 🧆', protein: 25 },
    { time: '10:30 AM', name: 'Breakfast 🍳', desc: 'Protein: Besan Chilla 🥞 / 3 Egg Whites 🥚. Carbs: Poha 🍛 with Peanuts 🥜', protein: 25 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 1 bowl Dal 🍲 + Curd 🥛. Carbs: 1 Roti 🫓. Veggies: Subzi 🥦 & Salad 🥗', protein: 45 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Fats/Protein: Handful of Almonds 🌰 with Green Tea 🍵', protein: 8 },
    { time: '08:30 PM', name: 'Dinner 🍕', desc: 'Cheat Meal / Flexible. (Just keep Protein high!)', protein: 40 }
  ],
  'Sunday': [
    { time: '08:00 AM', name: 'Wake Up 🌅', desc: 'Black Coffee ☕ or Green Tea 🍵' },
    { time: '09:00 AM', name: 'REST DAY 🧘‍♂️', desc: 'Full recovery, stretching, foam rolling if needed' },
    { time: '10:30 AM', name: 'Breakfast 🍳', desc: 'Protein: Omelette (2 whole eggs 🥚) / Paneer Bhurji 🧀. Carbs: 1 slice whole wheat bread 🍞', protein: 25 },
    { time: '02:00 PM', name: 'Lunch 🍱', desc: 'Protein: Chicken 🍗 / Fish 🐟 / Paneer 🧀. Carbs: Small portion of rice 🍚. Veggies: Lots of salad 🥗', protein: 50 },
    { time: '05:30 PM', name: 'Evening Snack 🍵', desc: 'Protein: Greek Yogurt 🍦. Carbs: Fruits 🍉', protein: 15 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Tofu 🍢 / Chicken 🍗 / Fish 🐟. Carbs: Light Soup 🥣. Veggies: Grilled Veggies 🥦', protein: 40 }
  ]
};

const SWETA_PROJECTION_DATA = [
  { week: 'Wk 1', weight: 59.0 },
  { week: 'Wk 4', weight: 58.5 },
  { week: 'Wk 8', weight: 58.0 },
  { week: 'Wk 12', weight: 57.5 },
  { week: 'Wk 16', weight: 57.0 },
  { week: 'Wk 20', weight: 57.0 }, // Slight fat loss / toning goal
];

const SWETA_WEEKLY_PLAN = {
  'Monday': [
    { time: '06:30 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Chia seeds 🌿' },
    { time: '07:30 AM', name: 'Pre-Workout ⚡', desc: 'Carbs: 1/2 Banana 🍌 or 5 Almonds 🌰', protein: 1 },
    { time: '08:00 AM', name: 'WORKOUT 🏋️‍♀️', desc: 'Yoga 🧘‍♀️, Dance 💃, Burn 🔥, or Light Strength' },
    { time: '09:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 2 Egg Whites 🥚 & 1 Yolk 🍳 OR Besan Chilla 🥞. Carbs: Oats 🥣 or Poha 🍛', protein: 15 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 1 bowl Dal 🍲 / Chicken 🍗. Carbs: 1 Roti 🫓. Veggies: Subzi 🥦 & Salad 🥗', protein: 20 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 5 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗 / Tofu 🍢. Veggies: Light Soup 🥣 & Salad 🥗', protein: 20 }
  ],
  'Tuesday': [
    { time: '06:30 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Chia seeds 🌿' },
    { time: '07:30 AM', name: 'Pre-Workout ⚡', desc: 'Carbs: 1/2 Banana 🍌 or 5 Almonds 🌰', protein: 1 },
    { time: '08:00 AM', name: 'WORKOUT 🏋️‍♀️', desc: 'Yoga 🧘‍♀️, Dance 💃, Burn 🔥, or Light Strength' },
    { time: '09:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 2 Egg Whites 🥚 & 1 Yolk 🍳 OR Besan Chilla 🥞. Carbs: Oats 🥣 or Poha 🍛', protein: 15 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 1 bowl Dal 🍲 / Chicken 🍗. Carbs: 1 Roti 🫓. Veggies: Subzi 🥦 & Salad 🥗', protein: 20 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 5 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗 / Tofu 🍢. Veggies: Light Soup 🥣 & Salad 🥗', protein: 20 }
  ],
  'Wednesday': [
    { time: '07:00 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Chia seeds 🌿' },
    { time: '08:00 AM', name: 'WORKOUT 🏋️‍♀️', desc: 'Active Recovery or Light Walk 🚶‍♀️' },
    { time: '09:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 2 Egg Whites 🥚 & 1 Yolk 🍳 OR Besan Chilla 🥞. Carbs: Oats 🥣 or Poha 🍛', protein: 15 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 1 bowl Dal 🍲 / Chicken 🍗. Carbs: 1 Roti 🫓. Veggies: Subzi 🥦 & Salad 🥗', protein: 20 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 5 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗 / Tofu 🍢. Veggies: Light Soup 🥣 & Salad 🥗', protein: 20 }
  ],
  'Thursday': [
    { time: '06:30 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Chia seeds 🌿' },
    { time: '07:30 AM', name: 'Pre-Workout ⚡', desc: 'Carbs: 1/2 Banana 🍌 or 5 Almonds 🌰', protein: 1 },
    { time: '08:00 AM', name: 'WORKOUT 🏋️‍♀️', desc: 'Yoga 🧘‍♀️, Dance 💃, Burn 🔥, or Light Strength' },
    { time: '09:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 2 Egg Whites 🥚 & 1 Yolk 🍳 OR Besan Chilla 🥞. Carbs: Oats 🥣 or Poha 🍛', protein: 15 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 1 bowl Dal 🍲 / Chicken 🍗. Carbs: 1 Roti 🫓. Veggies: Subzi 🥦 & Salad 🥗', protein: 20 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 5 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗 / Tofu 🍢. Veggies: Light Soup 🥣 & Salad 🥗', protein: 20 }
  ],
  'Friday': [
    { time: '06:30 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Chia seeds 🌿' },
    { time: '07:30 AM', name: 'Pre-Workout ⚡', desc: 'Carbs: 1/2 Banana 🍌 or 5 Almonds 🌰', protein: 1 },
    { time: '08:00 AM', name: 'WORKOUT 🏋️‍♀️', desc: 'Yoga 🧘‍♀️, Dance 💃, Burn 🔥, or Light Strength' },
    { time: '09:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 2 Egg Whites 🥚 & 1 Yolk 🍳 OR Besan Chilla 🥞. Carbs: Oats 🥣 or Poha 🍛', protein: 15 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 1 bowl Dal 🍲 / Chicken 🍗. Carbs: 1 Roti 🫓. Veggies: Subzi 🥦 & Salad 🥗', protein: 20 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Carbs: Roasted Makhana 🍿 with Green Tea 🍵', protein: 5 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Grilled Paneer 🧀 / Chicken 🍗 / Tofu 🍢. Veggies: Light Soup 🥣 & Salad 🥗', protein: 20 }
  ],
  'Saturday': [
    { time: '07:00 AM', name: 'Wake Up 🌅', desc: 'Warm water with lemon 🍋 / Chia seeds 🌿' },
    { time: '08:00 AM', name: 'WORKOUT 🏋️‍♀️', desc: 'Yoga 🧘‍♀️ or Outdoor Walk 🚶‍♀️' },
    { time: '09:30 AM', name: 'Breakfast 🍳', desc: 'Protein: 2 Egg Whites 🥚 & 1 Yolk 🍳 OR Besan Chilla 🥞. Carbs: Oats 🥣 or Poha 🍛', protein: 15 },
    { time: '01:30 PM', name: 'Lunch 🍱', desc: 'Protein: 1 bowl Dal 🍲 / Chicken 🍗. Carbs: 1 Roti 🫓. Veggies: Subzi 🥦 & Salad 🥗', protein: 20 },
    { time: '05:00 PM', name: 'Evening Snack 🍵', desc: 'Fats/Protein: Handful of Almonds 🌰 with Green Tea 🍵', protein: 5 },
    { time: '08:30 PM', name: 'Dinner 🍕', desc: 'Flexible Meal! 🥂 Enjoy in moderation.', protein: 20 }
  ],
  'Sunday': [
    { time: '08:00 AM', name: 'Wake Up 🌅', desc: 'Black Coffee ☕ or Green Tea 🍵' },
    { time: '09:00 AM', name: 'REST DAY 🧘‍♀️', desc: 'Full recovery, stretching, foam rolling if needed' },
    { time: '10:30 AM', name: 'Breakfast 🍳', desc: 'Protein: Omelette (2 whole eggs 🥚) / Paneer Bhurji 🧀. Carbs: 1 slice whole wheat bread 🍞', protein: 15 },
    { time: '02:00 PM', name: 'Lunch 🍱', desc: 'Protein: Chicken 🍗 / Fish 🐟 / Paneer 🧀. Carbs: Small portion of rice 🍚. Veggies: Lots of salad 🥗', protein: 25 },
    { time: '05:30 PM', name: 'Evening Snack 🍵', desc: 'Protein: Greek Yogurt 🍦. Carbs: Fruits 🍉', protein: 10 },
    { time: '08:30 PM', name: 'Dinner 🍽️', desc: 'Protein: Tofu 🍢 / Chicken 🍗 / Fish 🐟. Carbs: Light Soup 🥣. Veggies: Grilled Veggies 🥦', protein: 20 }
  ]
};

export default function DietPlan({ name }) {
  const [weight, setWeight] = useState(name === 'Amit' ? 85.7 : 59); // Default Sweta to 59 if unknown
  const [height, setHeight] = useState(name === 'Amit' ? 176 : 160); // Default Sweta to 160 if unknown
  const [selectedDay, setSelectedDay] = useState('Monday');

  const [tickedMeals, setTickedMeals] = useState({});
  const [showRoadmap, setShowRoadmap] = useState(false);

  const toggleMeal = (day, i) => {
    const key = `${day}-${i}`;
    setTickedMeals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Basic formulas for Macro calculation
  // BMR (Mifflin-St Jeor)
  const bmr = useMemo(() => {
    if (name === 'Amit') {
      return (10 * weight) + (6.25 * height) - (5 * 37) + 5; // Updated age to 37 for Amit
    } else {
      return (10 * weight) + (6.25 * height) - (5 * 37) - 161; // Assuming Sweta is similar age
    }
  }, [weight, height, name]);

  const maintenance = Math.round(bmr * 1.375); // Light/Moderate activity multiplier
  const deficit = maintenance - 300; // Slight deficit for lean down / muscle building
  const targetProtein = Math.round(weight * (name === 'Amit' ? 1.8 : 1.4)); // 1.8g/kg for Amit, 1.4g/kg for Sweta

  const activePlan = name === 'Amit' ? AMIT_WEEKLY_PLAN : SWETA_WEEKLY_PLAN;
  const activeProjection = name === 'Amit' ? AMIT_PROJECTION_DATA : SWETA_PROJECTION_DATA;

  const currentPlan = activePlan[selectedDay];
  const mealsCount = currentPlan.length;
  const completedCount = currentPlan.reduce((acc, _, i) => acc + (tickedMeals[`${selectedDay}-${i}`] ? 1 : 0), 0);

  const renderMacroText = (text) => {
    if (!text.match(/(Protein:|Carbs:|Veggies:|Fats\/Protein:|Fats:)/)) return text;
    const parts = text.split(/(Protein:|Carbs:|Veggies:|Fats\/Protein:|Fats:)/g);
    return parts.map((part, i) => {
      if (part === 'Protein:' || part === 'Fats/Protein:') return <strong key={i} style={{ color: 'var(--amber)' }}>{part}</strong>;
      if (part === 'Carbs:') return <strong key={i} style={{ color: 'var(--teal)' }}>{part}</strong>;
      if (part === 'Veggies:') return <strong key={i} style={{ color: 'var(--pine)' }}>{part}</strong>;
      if (part === 'Fats:') return <strong key={i} style={{ color: 'var(--coral)' }}>{part}</strong>;
      return part;
    });
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="page-header">
        <div className="page-header__copy">
          <p className="page-header__eyebrow">Nutrition & Training</p>
          <h1>{name}'s Weekly Protocol 🏋️{name === 'Sweta' ? '‍♀️' : '‍♂️'}🥗</h1>
          <p className="page-header__sub">Target: {name === 'Amit' ? 'Best Body & Muscle Building (Push/Pull/Legs Split)' : 'General Fitness, Toning & Active Lifestyle'}</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card metric-card--pine">
          <p className="metric-card__label">Daily Calorie Target</p>
          <h3 className="metric-card__value">{deficit} kcal</h3>
          <p className="metric-card__detail">Maintenance: {maintenance} kcal</p>
        </div>
        <div className="metric-card metric-card--amber">
          <p className="metric-card__label">Protein Target</p>
          <h3 className="metric-card__value">{targetProtein}g</h3>
          <p className="metric-card__detail">1.8g per kg bodyweight</p>
        </div>
        <div className="metric-card metric-card--coral">
          <p className="metric-card__label">Water Goal</p>
          <h3 className="metric-card__value">3.5 L</h3>
          <p className="metric-card__detail">Stay hydrated</p>
        </div>
      </div>

      <div className="diet-grid">
        {/* Left Col: Vitals & Week Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Body Metrics" badge="Stats">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label>Current Weight (kg)</label>
                <input type="number" step="0.1" value={weight} onChange={e => setWeight(Number(e.target.value))} />
              </div>
              <div className="field">
                <label>Height (cm)</label>
                <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} />
              </div>
              <div style={{ padding: 12, background: 'var(--pine-soft)', borderRadius: 12, color: 'var(--pine)', marginTop: 8 }}>
                <strong>Muscle Building Tip:</strong> Hitting your {targetProtein}g protein goal is the absolute most important metric to build muscle at age 37. Recovery is key!
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Weight Projection" badge="4-Month Goal">
            <div style={{ height: 180, width: '100%', marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeProjection} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.85rem' }} 
                    itemStyle={{ color: 'var(--pine)', fontWeight: 'bold' }}
                    formatter={(value) => [`${value} kg`, 'Projected Weight']}
                  />
                  <Line type="monotone" dataKey="weight" stroke="var(--pine)" strokeWidth={3} dot={{ r: 4, fill: 'var(--pine)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {name === 'Amit' && (
              <button 
                onClick={() => setShowRoadmap(true)} 
                className="btn btn--sm btn--primary" 
                style={{ width: '100%', marginTop: '16px', background: '#000', color: '#fff' }}
              >
                🗺️ View 6-Pack Roadmap Details
              </button>
            )}
          </SectionCard>

          <SectionCard title="Day of Week" badge="Select">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {WEEK_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: selectedDay === day ? 'var(--teal)' : 'rgba(255,255,255,0.6)',
                    color: selectedDay === day ? '#fff' : 'var(--ink)',
                    fontWeight: selectedDay === day ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: selectedDay === day ? '4px solid var(--pine)' : '4px solid transparent'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Col: Meal Schedule */}
        <SectionCard title={`${selectedDay}'s Plan`} badge="Schedule">
          <div style={{ marginBottom: 20 }}>
            <ProgressBar label={`Tasks Completed (${completedCount}/${mealsCount})`} value={completedCount} total={mealsCount} tone="pine" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentPlan.map((meal, i) => {
              const done = tickedMeals[`${selectedDay}-${i}`];
              const isWorkout = meal.name.includes('GYM') || meal.name.includes('CULT') || meal.name.includes('YOGA') || meal.name.includes('REST DAY') || meal.name.includes('RECOVERY') || meal.name.includes('WORKOUT');
              return (
                <div key={i} onClick={() => toggleMeal(selectedDay, i)} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: 12,
                  background: done ? 'rgba(49,85,62,0.06)' : isWorkout ? 'var(--amber-soft)' : 'rgba(255,255,255,0.6)',
                  border: done ? '1px solid var(--pine)' : isWorkout ? '1px solid var(--amber)' : '1px solid var(--line)',
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', border: done ? 'none' : '2px solid var(--line)',
                    background: done ? 'var(--pine)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                    flexShrink: 0
                  }}>
                    {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isWorkout ? 'var(--amber)' : 'var(--muted)', background: isWorkout ? '#fff' : 'var(--line)', padding: '2px 8px', borderRadius: 12 }}>
                        {meal.time}
                      </span>
                      <strong style={{ textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--muted)' : (isWorkout ? 'var(--amber)' : 'var(--ink)') }}>{meal.name}</strong>
                      {meal.protein && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--amber)', background: 'var(--amber-soft)', padding: '2px 6px', borderRadius: 8, marginLeft: 4 }}>
                          ~{meal.protein}g Protein
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', marginTop: 4, color: 'var(--muted)' }}>{renderMacroText(meal.desc)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Roadmap Modal */}
      {showRoadmap && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: 'var(--bg)', width: '100%', maxWidth: 700,
            borderRadius: 20, padding: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--pine)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Body Recomposition Plan</div>
                <h2 style={{ margin: '4px 0 0', fontSize: '1.8rem', color: 'var(--text)' }}>Roadmap to 76kg (6-Pack) 🗺️</h2>
              </div>
              <button 
                onClick={() => setShowRoadmap(false)} 
                style={{ background: 'var(--line)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>

            <div style={{ background: 'var(--ocean-soft)', border: '1px solid var(--ocean)', padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 8px', color: 'var(--ocean)' }}>⏱️ Estimated Timeframe: 4 to 5 Months (16 - 20 Weeks)</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate)', lineHeight: 1.5 }}>
                A healthy, sustainable rate of fat loss that <strong>preserves muscle</strong> is about 0.5 kg to 0.75 kg per week.<br/>
                • 9.7 kg ÷ 0.5 kg/wk = <strong>~19 weeks (~133 days)</strong>.<br/>
                • 9.7 kg ÷ 0.75 kg/wk = <strong>~13 weeks (~91 days)</strong>.<br/>
                <span style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: 4, display: 'block' }}>*If you rush it and try to lose weight faster, your body will burn muscle instead of fat, ruining the six-pack look.*</span>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderLeft: '4px solid var(--coral)', paddingLeft: 16 }}>
                <h4 style={{ margin: '0 0 4px', color: 'var(--text)' }}>Phase 1: The Drop (Weeks 1-8 | Days 1-56)</h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  <li><strong>What to expect:</strong> You will drop the first 4-5 kg relatively fast. You'll feel lighter, clothes will fit better.</li>
                  <li><strong>The Goal:</strong> Stick strictly to the ~300 calorie deficit. Never miss your 145g-150g daily protein target.</li>
                </ul>
              </div>
              <div style={{ borderLeft: '4px solid var(--amber)', paddingLeft: 16 }}>
                <h4 style={{ margin: '0 0 4px', color: 'var(--text)' }}>Phase 2: The Recomp (Weeks 9-16 | Days 57-112)</h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  <li><strong>What to expect:</strong> You hit ~79-80 kg. The scale will move slower. <strong>Don't quit here!</strong> Because of high protein & heavy lifting, your body is replacing fat with muscle.</li>
                  <li><strong>The Goal:</strong> Push harder in the gym. Apply Progressive Overload (lift slightly heavier than Phase 1).</li>
                </ul>
              </div>
              <div style={{ borderLeft: '4px solid var(--pine)', paddingLeft: 16 }}>
                <h4 style={{ margin: '0 0 4px', color: 'var(--text)' }}>Phase 3: The Sculpt (Weeks 17-20+ | Days 113-140+)</h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  <li><strong>What to expect:</strong> Approaching 76-77 kg. To get the six-pack to pop, body fat needs to drop to ~10-12%.</li>
                  <li><strong>The Goal:</strong> Add slightly more cardio (Dance/Burn) or slightly reduce carbs (swap roti for salad) to push through the final barrier.</li>
                </ul>
              </div>
            </div>

            <h3 style={{ marginTop: 32, marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>🧠 Why the Slow Route is Best (Body Recomposition)</h3>
            <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid var(--line)', padding: 16, borderRadius: 12 }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text)' }}>
                At 37, losing 0.5 kg a week is the <strong>only way</strong> to build that "proper muscle" look while getting a six-pack. If you crash diet, you will become "skinny fat" and lose muscle. Here is why we take ~5 months:
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                <li><strong>Muscle Preservation:</strong> Eating 140g+ protein while losing weight slowly forces your body to burn fat for energy and use protein to build thick, dense muscle. Your chest and arms will look bigger even though the scale drops.</li>
                <li><strong>Skin Elasticity:</strong> If you drop 10kg in 2 months, your skin won't have time to tighten, hiding the six-pack. 4-5 months gives your skin time to shrink and wrap tightly around the ab muscles.</li>
                <li><strong>Hormonal Balance:</strong> Extreme diets crash testosterone, making muscle building impossible. A small 300-calorie deficit keeps your testosterone high, which is critical at age 37.</li>
              </ul>
            </div>

            <h3 style={{ marginTop: 32, marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>🚫 Foods to Avoid Daily (The Six-Pack Killers)</h3>
            <div style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', padding: 16, borderRadius: 12 }}>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>
                <li><strong>Liquid Calories:</strong> Regular sodas, sweetened fruit juices, and alcohol (especially beer). These spike insulin and store fat directly over the abs.</li>
                <li><strong>Refined Carbs & Sugars:</strong> Maida (white flour), pastries, biscuits, sweets, and excessive white bread. They provide zero nutrition and ruin your calorie deficit.</li>
                <li><strong>Deep Fried Foods:</strong> Samosas, pakoras, french fries, and heavily fried restaurant curries. They are loaded with hidden, low-quality fats.</li>
                <li><strong>Processed Meats & Snacks:</strong> Packaged bhujia, chips, and sausages. High in sodium which causes severe water retention (hiding the abs).</li>
                <li><em>Note: A single cheat meal once a week (like on Saturday night) is totally fine, but these should NEVER be in your daily routine.</em></li>
              </ul>
            </div>

            <h3 style={{ marginTop: 32, marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>🔑 The 3 Golden Rules</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 16, borderRadius: 8 }}>
                <strong>1. Abs are made in the kitchen 🥗</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--muted)' }}>The diet plan is 80% of the work. If your body fat doesn't drop, the muscle won't show no matter how many crunches you do.</p>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 16, borderRadius: 8 }}>
                <strong>2. Train core like any other muscle 🏋️</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--muted)' }}>Use weights for your ab exercises (e.g., weighted cable crunches). This makes the ab muscles physically thicker so they push against the skin.</p>
              </div>
              <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: 16, borderRadius: 8 }}>
                <strong>3. Extreme Patience 🧘‍♂️</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--muted)' }}>At 37, your metabolism is slightly different than at 20. Consistency beats intensity every single time.</p>
              </div>
            </div>
            
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button onClick={() => setShowRoadmap(false)} className="btn btn--primary" style={{ minWidth: 200 }}>Got it! Let's Go 🚀</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
