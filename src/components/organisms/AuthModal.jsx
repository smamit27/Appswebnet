import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export default function AuthModal({ isOpen, onClose, user, isAuthorized, onSignIn, onSignOut, accessDenied }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await onSignIn();
      onClose();
    } catch (err) {
      if (err?.message === 'ACCESS_DENIED') {
        setError('🚫 Access Denied. This is a private family dashboard. Only authorized accounts may sign in.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await onSignOut();
    onClose();
  };

  const isLoggedIn = user && !user.isAnonymous;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal__header">
          <h2 className="modal__title">{isLoggedIn ? 'Account' : 'Sign In'}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="auth-card">
          {isLoggedIn ? (
            <>
              <div className="auth-card__icon">
                {user.photoURL
                  ? <img src={user.photoURL} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto' }} />
                  : '👤'}
              </div>
              <div className="auth-card__title">
                {user.displayName || user.email}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                {isAuthorized ? '✅ Authorized Access' : '⚠️ Restricted Access'}
              </div>
              <button className="btn btn--outline" onClick={handleSignOut} style={{ width: '100%', justifyContent: 'center' }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              {/* Logo */}
              <div className="auth-card__icon" style={{
                width: 64, height: 64, borderRadius: '12px', background: '#fff',
                padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', border: '1px solid var(--line)'
              }}>
                <img src="/logo.png" alt="AppsWebNet Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>

              <div className="auth-card__title">AppsWebNet Dashboard</div>

              {/* Private access notice */}
              <div style={{
                background: 'rgba(155,34,38,0.06)',
                border: '1px solid rgba(155,34,38,0.2)',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 20,
                textAlign: 'left',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🔒</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#9b2226', marginBottom: 3 }}>
                    Private & Confidential
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                    This is a strictly private family dashboard. Access is limited to authorized accounts only. Unauthorized sign-in attempts are blocked and logged.
                  </div>
                </div>
              </div>

              {/* Access denied banner */}
              {(accessDenied || error) && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🚫</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#dc2626', marginBottom: 3 }}>
                      Access Denied
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#7f1d1d', lineHeight: 1.5 }}>
                      {error || 'Your Google account is not authorized. Only the family accounts may access this dashboard.'}
                    </div>
                  </div>
                </div>
              )}

              <button
                className="btn btn--google"
                style={{ width: '100%', justifyContent: 'center', gap: 10, height: 44 }}
                onClick={handleSignIn}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Verifying…' : 'Continue with Google'}
              </button>

              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 10, lineHeight: 1.4 }}>
                🔐 Only <strong>smamit27@gmail.com</strong> and <strong>gsweta228@gmail.com</strong> may access this dashboard.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
