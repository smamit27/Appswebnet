import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const docRef = doc(db, 'financeMonthly_family', 'family_2026-07');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    console.log("Found family_2026-07:", JSON.stringify(data.expenses, null, 2));
    
    // filter out the duplicate blinkit
    const newExpenses = data.expenses.filter(e => !(e.purpose && e.purpose.includes('BLK-2258608602')));
    if (newExpenses.length < data.expenses.length) {
       await updateDoc(docRef, { expenses: newExpenses });
       console.log("Removed duplicate BLK-2258608602 from expenses!");
    } else {
       console.log("No duplicate BLK-2258608602 found in expenses.");
    }
  } else {
    console.log("No family_2026-07 doc found.");
  }
}

check().then(() => process.exit(0)).catch(console.error);
