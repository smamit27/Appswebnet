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
    console.log("ALL_INCOME_START");
    console.log(JSON.stringify(data.income || [], null, 2));
    console.log("ALL_INCOME_END");
    console.log("ALL_EXPENSES_START");
    console.log(JSON.stringify(data.expenses || [], null, 2));
    console.log("ALL_EXPENSES_END");
  } else {
    console.log("No family_2026-07 doc found.");
  }
}

check().then(() => process.exit(0)).catch(console.error);
