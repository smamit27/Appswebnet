import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';

const ALLOWED_EMAILS = [
  'sweta@gmail.com',
  'smamit27@gmail.com',
  'amishi@gmail.com',
];

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        signInAnonymously(auth).catch(console.error);
      }
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) return;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Google sign-in failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const isAuthorized = user && user.email &&
    ALLOWED_EMAILS.includes(user.email.toLowerCase());

  return { user, loading, isAuthorized, signInWithGoogle, logout };
}
