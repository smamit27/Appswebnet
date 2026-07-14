import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, requirePassword = true }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const passwordInputRef = useRef(null);
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      if (requirePassword) {
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 50);
      } else {
        setTimeout(() => {
          cancelBtnRef.current?.focus();
        }, 50);
      }

      // Escape listener
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose, requirePassword]);

  if (!isOpen) return null;

  const handleDeleteClick = () => {
    if (!requirePassword) {
      onConfirm();
      return;
    }
    if (password === '123india') {
      onConfirm();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return createPortal(
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">Delete Item?</h3>
        <p className="confirm-modal-message">
          This item will be permanently deleted and cannot be recovered. Are you sure you want to continue?
        </p>

        {requirePassword && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              Enter Password to confirm:
            </label>
            <input
              ref={passwordInputRef}
              type="password"
              className="finance-register-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="Enter password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleDeleteClick();
                }
              }}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                {error}
              </p>
            )}
          </div>
        )}

        <div className="confirm-modal-actions" style={{ marginTop: '20px' }}>
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDeleteClick}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
