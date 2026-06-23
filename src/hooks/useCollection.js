import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Generic Firestore realtime collection hook
 * @param {string} collectionPath  - Firestore collection path (supports nested with '/')
 * @param {Array}  fallbackData    - Mock data used when Firebase is not configured
 * @param {object} user            - Current Firebase user (null = not authed)
 * @param {string} orderByField    - Field to order results by (default: 'createdAt')
 * @param {string} orderDir        - 'asc' | 'desc' (default: 'desc')
 */
export function useCollection(
  collectionPath,
  fallbackData = [],
  user = null,
  orderByField = 'createdAt',
  orderDir = 'desc'
) {
  const [items, setItems]   = useState(fallbackData);
  const [source, setSource] = useState('mock');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!db || !user) {
      setItems(fallbackData);
      setSource('mock');
      return;
    }

    setLoading(true);
    const ref = collection(db, collectionPath);
    const q = query(ref, orderBy(orderByField, orderDir));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(docs);
        setSource('firebase');
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Firestore [${collectionPath}]:`, err);
        setError(`Failed to load ${collectionPath}.`);
        setItems(fallbackData);
        setSource('mock');
        setLoading(false);
      }
    );

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath, user, orderByField, orderDir]);

  const add = async (data) => {
    if (!db || !user) return;
    return addDoc(collection(db, collectionPath), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
    });
  };

  const update = async (id, data) => {
    if (!db || !user) return;
    return updateDoc(doc(db, collectionPath, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  const remove = async (id) => {
    if (!db || !user) return;
    return deleteDoc(doc(db, collectionPath, id));
  };

  return { items, source, loading, error, add, update, remove };
}
