import { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';

// 🔒 STRICT ACCESS — Only these two accounts are permitted
const ALLOWED_EMAILS = [
  'smamit27@gmail.com',
  'gsweta228@gmail.com',
];

export function useAuth() {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && !u.isAnonymous) {
        const email = (u.email || '').toLowerCase();
        if (!ALLOWED_EMAILS.includes(email)) {
          // Immediately sign out any unauthorized account
          await signOut(auth);
          setUser(null);
          setAccessDenied(true);
        } else {
          setUser(u);
          setAccessDenied(false);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) return;
    setAccessDenied(false);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = (result.user.email || '').toLowerCase();
      if (!ALLOWED_EMAILS.includes(email)) {
        // Immediately sign out — wrong account
        await signOut(auth);
        setUser(null);
        setAccessDenied(true);
        throw new Error('ACCESS_DENIED');
      }
      return result.user;
    } catch (err) {
      if (err.message !== 'ACCESS_DENIED') {
        console.error('Google sign-in failed:', err);
      }
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) return;
    setAccessDenied(false);
    await signOut(auth);
  };

  // isAuthorized — true only for the two permitted accounts
  const isAuthorized = user &&
    user.email &&
    ALLOWED_EMAILS.includes(user.email.toLowerCase());

  return { user, loading, isAuthorized, accessDenied, signInWithGoogle, logout };
}

