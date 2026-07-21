import React from 'react';
import { CheckSquare, Mail, Lock, Sun, Moon } from 'lucide-react';
import ToastList from './ToastList';

// ---------------------------------------------------------
// LoginPage — Shown when the user has no valid JWT token
// ---------------------------------------------------------
export default function LoginPage({
  theme,
  toggleTheme,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginLoading,
  loginError,
  handleLogin,
  toasts,
  removeToast
}) {
  return (
    <div data-theme={theme} className="login-wrapper">
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      <div className="login-card glass-panel">
        {/* Theme toggle */}
        <button
          type="button"
          className="btn-theme-toggle login-theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <CheckSquare size={28} />
          </div>
          <h1 className="login-title">Koncepthive</h1>
          <p className="login-subtitle">Task Management Command Dashboard</p>
        </div>

        {/* Error banner */}
        {loginError && (
          <div className="form-errors-list" style={{ borderLeft: '3px solid #ef4444' }}>
            <h4>Authentication Error</h4>
            <p style={{ fontSize: '13px', color: '#f3f4f6', marginTop: '2px' }}>{loginError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="loginEmail">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={18} /></span>
              <input
                id="loginEmail"
                type="email"
                className="form-input has-icon"
                placeholder="admin@test.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="loginPassword">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Lock size={18} /></span>
              <input
                id="loginPassword"
                type="password"
                className="form-input has-icon"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loginLoading}>
            {loginLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Admin Credentials: admin@test.com / 123456
        </div>
      </div>

      {/* Toasts */}
      <ToastList list={toasts} onRemove={removeToast} />
    </div>
  );
}
