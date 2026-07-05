import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm }) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus cancel button by default
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">Delete Item?</h3>
        <p className="confirm-modal-message">
          This item will be permanently deleted and cannot be recovered. Are you sure you want to continue?
        </p>
        <div className="confirm-modal-actions">
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
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
