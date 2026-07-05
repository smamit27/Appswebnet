import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ToastNotification({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return createPortal(
    <div className={`toast-notification toast-notification--${type}`} onClick={onClose}>
      <div className="toast-notification__icon">
        {type === 'success' ? '✓' : '⚠️'}
      </div>
      <div className="toast-notification__message">{message}</div>
      <button className="toast-notification__close" onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
    </div>,
    document.body
  );
}
