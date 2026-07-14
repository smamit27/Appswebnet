import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
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
const auth = getAuth(app);

async function inspect() {
  console.log("Signing in anonymously...");
  await signInAnonymously(auth);
  console.log("Signed in successfully!");

  const targetCollections = [
    "financeMonthly_family", 
    "financeMonthly_amit", 
    "financeMonthly_sweta",
    "dividends",
    "transactions",
    "portfolio",
    "monthlySnapshots"
  ];

  for (const coll of targetCollections) {
    console.log(`\n=== Collection: ${coll.toUpperCase()} ===`);
    try {
      const querySnapshot = await getDocs(collection(db, coll));
      console.log(`Total documents: ${querySnapshot.size}`);
      querySnapshot.forEach((doc) => {
        console.log(`Document ID: ${doc.id}`);
        const data = doc.data();
        
        // Print high-level overview of the data
        if (coll.startsWith("financeMonthly_")) {
          const incCount = (data.income || []).length;
          const expCount = (data.expenses || []).length;
          console.log(`  Month: ${data.month}, Person: ${data.person}, Incomes: ${incCount}, Expenses: ${expCount}`);
          if (data.income && data.income.length > 0) {
            console.log("  Incomes:");
            data.income.forEach((inc, idx) => {
              console.log(`    [${idx}] Date: ${inc.date}, Source/Remark: ${inc.source || inc.remark}, Amount: ${inc.amount}, Category: ${inc.category}`);
            });
          }
          if (data.expenses && data.expenses.length > 0) {
            console.log("  Expenses:");
            data.expenses.forEach((exp, idx) => {
              console.log(`    [${idx}] Date: ${exp.date}, Vendor/Purpose: ${exp.vendor || exp.purpose}, Amount: ${exp.amount}, Category: ${exp.category}`);
            });
          }
        } else if (coll === "dividends") {
          console.log(`  Data: ${JSON.stringify(data, null, 2)}`);
        } else if (coll === "transactions") {
          console.log(`  Type: ${data.type}, Symbol: ${data.symbol}, Qty: ${data.quantity}, Price: ${data.price}, Date: ${data.date}`);
        } else {
          console.log(`  Keys: ${Object.keys(data).join(", ")}`);
        }
      });
    } catch (err) {
      console.error(`Error querying ${coll}:`, err);
    }
  }
}

inspect().then(() => process.exit(0)).catch(console.error);
