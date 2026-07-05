import { collection, getDocs, doc, setDoc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase.js';

export class FirestoreService {
  static async checkDuplicateSnapshot(user, monthKey) {
    if (!db || !user) return false;
    const q = query(
      collection(db, 'monthlySnapshots'), 
      where('monthKey', '==', monthKey),
      where('createdBy', '==', user.uid)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }

  static async saveImport(user, monthKey, data, replaceMode = 'REPLACE') {
    if (!db || !user) throw new Error('Database or user context missing');

    const batch = writeBatch(db);

    // If replaceMode is REPLACE, clear existing snapshots for the same month first
    if (replaceMode === 'REPLACE') {
      const q = query(
        collection(db, 'monthlySnapshots'), 
        where('monthKey', '==', monthKey),
        where('createdBy', '==', user.uid)
      );
      const snaps = await getDocs(q);
      snaps.forEach(d => {
        batch.delete(d.ref);
      });
    }

    // Save new monthly snapshot
    const snapshotDocRef = doc(collection(db, 'monthlySnapshots'));
    batch.set(snapshotDocRef, {
      monthKey,
      mutualFunds: data.mutualFunds,
      stocks: data.stocks,
      transactions: data.transactions,
      dematAccounts: data.dematAccounts || [],
      summary: data.summary,
      createdBy: user.uid,
      createdAt: serverTimestamp()
    });

    // Replace current holdings view with the latest values
    const holdingsSnap = await getDocs(collection(db, 'holdings'));
    holdingsSnap.forEach(d => {
      batch.delete(d.ref);
    });

    data.mutualFunds.forEach(mf => {
      const ref = doc(collection(db, 'holdings'));
      batch.set(ref, {
        ...mf,
        type: 'mutualFund',
        lastUpdated: serverTimestamp(),
        createdBy: user.uid
      });
    });

    data.stocks.forEach(st => {
      const ref = doc(collection(db, 'holdings'));
      batch.set(ref, {
        ...st,
        type: 'stock',
        lastUpdated: serverTimestamp(),
        createdBy: user.uid
      });
    });

    // Write transactions batch
    const txColRef = collection(db, 'transactions');
    data.transactions.forEach(t => {
      const ref = doc(txColRef);
      batch.set(ref, {
        ...t,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
    });

    // Save aggregated stats in current summary
    const summaryRef = doc(db, 'portfolioSummary', 'family_summary');
    batch.set(summaryRef, {
      ...data.summary,
      lastUpdated: serverTimestamp(),
      updatedBy: user.uid
    }, { merge: true });

    await batch.commit();
  }
}
