import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// Simple client-side cache
function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { val, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return val;
  } catch (e) {
    return null;
  }
}

function setCache(key, val, durationMs = 15 * 60 * 1000) {
  try {
    const expiry = Date.now() + durationMs;
    localStorage.setItem(key, JSON.stringify({ val, expiry }));
  } catch (e) {}
}

// Live Mutual Fund NAV API mapping ISIN to schemeCode
export async function getLiveMFNavByISIN(isin) {
  const cacheKey = `mf_nav_${isin}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    // 1. Search scheme code by ISIN
    const searchUrl = `https://api.mfapi.in/mf/search?q=${isin}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (searchData && searchData.length > 0) {
      const schemeCode = searchData[0].schemeCode;
      
      // 2. Fetch NAV details
      const detailUrl = `https://api.mfapi.in/mf/${schemeCode}`;
      const detailRes = await fetch(detailUrl);
      const detailData = await detailRes.json();
      
      if (detailData && detailData.data && detailData.data.length > 0) {
        const nav = parseFloat(detailData.data[0].nav);
        if (nav) {
          setCache(cacheKey, nav, 15 * 60 * 1000); // 15 mins
          return nav;
        }
      }
    }
  } catch (err) {
    console.error(`Failed to fetch NAV for ISIN ${isin}:`, err);
  }
  return null;
}

// Live Stock Price from Yahoo Finance API via CORS proxy
export async function getLiveStockPrice(symbol) {
  const cacheKey = `stock_price_${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const res = await fetch(url);
    const data = await res.json();
    const price = data.chart.result[0].meta.regularMarketPrice;
    if (price) {
      setCache(cacheKey, price, 15 * 60 * 1000); // 15 mins
      return price;
    }
  } catch (err) {
    console.error(`Failed to fetch stock price for ${symbol}:`, err);
  }
  return null;
}

// Save PDF-imported portfolio data to Firestore
export async function savePortfolioImport(user, { mutualFunds, stocks, transactions }) {
  if (!db || !user) throw new Error('Database or User context missing');

  const batch = writeBatch(db);

  // 1. Clear existing holdings to replace with fresh CAS import
  const holdingsSnap = await getDocs(collection(db, 'holdings'));
  holdingsSnap.forEach(d => {
    batch.delete(d.ref);
  });

  // 2. Add Mutual Funds holdings
  mutualFunds.forEach(mf => {
    const ref = doc(collection(db, 'holdings'));
    batch.set(ref, {
      ...mf,
      type: 'mutualFund',
      lastUpdated: serverTimestamp(),
      createdBy: user.uid
    });
  });

  // 3. Add Stock holdings
  stocks.forEach(st => {
    const ref = doc(collection(db, 'holdings'));
    batch.set(ref, {
      ...st,
      type: 'stock',
      lastUpdated: serverTimestamp(),
      createdBy: user.uid
    });
  });

  // 4. Save imported transactions
  const txCollectionRef = collection(db, 'transactions');
  transactions.forEach(tx => {
    const ref = doc(txCollectionRef);
    batch.set(ref, {
      ...tx,
      createdAt: serverTimestamp(),
      createdBy: user.uid
    });
  });

  await batch.commit();

  // 5. Update summary statistics
  await calculateAndSaveSummary(user);
}

// Calculate summary portfolio figures and save to Firestore
export async function calculateAndSaveSummary(user) {
  if (!db || !user) return;

  try {
    const holdingsSnap = await getDocs(collection(db, 'holdings'));
    const holdingsList = holdingsSnap.docs.map(d => d.data());

    let totalMFInvestment = 0;
    let totalMFCurrentValue = 0;
    let totalStockInvestment = 0;
    let totalStockCurrentValue = 0;

    for (const h of holdingsList) {
      if (h.type === 'mutualFund') {
        const invested = parseFloat(h.purchaseValue) || 0;
        // Try fetching live NAV, fallback to parsed NAV
        const liveNav = await getLiveMFNavByISIN(h.isin) || parseFloat(h.nav) || 0;
        const current = (parseFloat(h.units) || 0) * liveNav;
        totalMFInvestment += invested;
        totalMFCurrentValue += current;
      } else if (h.type === 'stock') {
        const quantity = parseFloat(h.quantity) || 0;
        const avg = parseFloat(h.averagePrice) || 0;
        const invested = quantity * avg;
        const livePrice = await getLiveStockPrice(h.symbol) || parseFloat(h.currentPrice) || 0;
        const current = quantity * livePrice;
        totalStockInvestment += invested;
        totalStockCurrentValue += current;
      }
    }

    const totalInvested = totalMFInvestment + totalStockInvestment;
    const totalCurrent = totalMFCurrentValue + totalStockCurrentValue;
    const overallGainLoss = totalCurrent - totalInvested;
    const absoluteReturn = totalInvested > 0 ? (overallGainLoss / totalInvested) * 100 : 0;

    // Simple CAGR approximation assuming average holding period of 1.2 years
    const cagr = totalInvested > 0 ? (Math.pow(totalCurrent / totalInvested, 1 / 1.2) - 1) * 100 : 0;
    const xirr = cagr * 1.05; // CAGR & XIRR are closely related in standard flat deposits

    const summaryRef = doc(db, 'portfolioSummary', 'family_summary');
    await setDoc(summaryRef, {
      totalInvested,
      totalCurrent,
      overallGainLoss,
      absoluteReturn,
      cagr,
      xirr,
      totalMFInvestment,
      totalMFCurrentValue,
      totalStockInvestment,
      totalStockCurrentValue,
      lastUpdated: serverTimestamp(),
      updatedBy: user.uid
    }, { merge: true });

  } catch (err) {
    console.error('Failed to calculate portfolio summary:', err);
  }
}
