import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import fs from 'fs';

// Parse .env
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateCategories() {
  const docRef = doc(db, 'financeMonthly_family', 'family_2026-07');
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) {
    console.log("No document found for family_2026-07");
    return;
  }
  
  const data = snap.data();
  const expenses = data.expenses || [];
  let updatedCount = 0;
  
  const updatedExpenses = expenses.map(exp => {
    // 1. Credit card bill payment
    if (exp.vendor === "Sweta Credit Card Payment" || exp.refNo === "CC-PAY-SWETA" || exp.purpose === "Credit Card Bill Pay") {
      updatedCount++;
      return { ...exp, category: "Credit Card Payment" };
    }
    // 2. Maid / house help cleaning
    if (exp.refNo === "Cleaning" || exp.purpose === "Aunty Cleaning and disha wash") {
      updatedCount++;
      return { ...exp, category: "House Help" };
    }
    // 3. Car & bike cleaning Sadaam
    if (exp.refNo === "Sadaam" || exp.purpose === "Car +Bike Cleaning") {
      updatedCount++;
      return { ...exp, category: "House Help" };
    }
    // 4. Outside food category fix
    if (exp.refNo === "LOCAL-2906-WHEAT" && exp.purpose === "Outside food") {
      updatedCount++;
      return { ...exp, category: "Food & Dining" };
    }
    return exp;
  });
  
  if (updatedCount > 0) {
    await updateDoc(docRef, { expenses: updatedExpenses });
    console.log(`Successfully updated ${updatedCount} transactions in family_2026-07 doc!`);
  } else {
    console.log("No transactions needed category updating.");
  }
}

updateCategories()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
