import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

// ---------------------------------------------------------
// ToastList — Global notification banners
// ---------------------------------------------------------
export default function ToastList({ list, onRemove }) {
  if (list.length === 0) return null;

  return (
    <div className="toast-container">
      {list.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'} ${toast.closing ? 'toast-closing' : ''}`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '13.5px', fontWeight: 550 }}>{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
