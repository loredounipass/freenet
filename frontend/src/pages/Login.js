import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from './../hooks/useAuth';

/* ── tiny Toast component ── */
function Toast({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.75rem 1.25rem',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)',
      border: '1px solid rgba(255,80,80,0.35)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,80,80,0.1)',
      color: '#ff9b9b',
      fontSize: '0.9rem',
      fontWeight: 500,
      minWidth: '260px',
      maxWidth: '90vw',
      animation: 'toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      backdropFilter: 'blur(12px)',
    }}>
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', color: '#ff9b9b',
          cursor: 'pointer', padding: '2px 4px', fontSize: '1rem',
          opacity: 0.7, flexShrink: 0,
        }}
        aria-label="Cerrar"
      >✕</button>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);

  // Initialize as false, set to true inside effect so Strict Mode double-mount
  // doesn't leave isMounted stuck at false.
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const dismissToast = useCallback(() => setToast(''), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    localStorage.setItem('email', data.email);

    setToast('');
    setLoading(true);

    let result = null;
    try {
      result = await loginUser(data);
    } catch (e) {
      result = { ok: false, error: e?.message || 'Error al iniciar sesión.' };
    } finally {
      // Always unblock the button regardless of mount state
      setLoading(false);
    }

    // Only touch the UI if still on this page
    if (!isMounted.current) return;

    if (result?.ok && result?.data) {
      const msg = result.data.msg;
      if (msg === 'Código de verificación enviado a tu correo electrónico.') {
        navigate('/verifytoken');
      }
      // 'Logged in!' → setUserContext already called navigate('/') inside the hook
    } else {
      setToast(result?.error || 'Credenciales incorrectas.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card card-bg">
        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-logo">
            <div className="freenet-logo-placeholder">F</div>
            <div className="auth-title">FREENET</div>
          </div>

          <div className="form-group">
            <label className="form-label">Email o Usuario</label>
            <input
              name="email"
              type="text"
              required
              autoComplete="email"
              autoFocus
              className="form-input"
              placeholder="Email o nombre de usuario"
              onChange={() => toast && setToast('')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="password-wrapper">
              <input
                name="password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (toast) setToast(''); }}
                className="form-input"
                placeholder="Contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          <div className="muted-link" style={{ textAlign: 'center' }}>
            <div><a href="/forgot-password">¿Olvidaste tu contraseña?</a></div>
            <div style={{ marginTop: '6px' }}>
              <a href="/register" className="signup-button">
                ¿No tienes cuenta? <span className="signup-cta">Regístrate</span>
              </a>
            </div>
          </div>
        </form>
      </div>

      {/* Toast — rendered outside the card so it floats above everything */}
      <Toast message={toast} onDismiss={dismissToast} />
    </div>
  );
}