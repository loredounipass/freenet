import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from './../hooks/useAuth';

export default function Login() {
  const { loginUser, error } = useAuth();
  const navigate = useNavigate();

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMounted = useRef(true);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    localStorage.setItem('email', data.email);

    setLoading(true);

    try {
      const responseMessage = await loginUser(data);
      if (isMounted.current) {
        if (
          responseMessage &&
          responseMessage.msg === 'Código de verificación enviado a tu correo electrónico.'
        ) {
          navigate('/verifytoken');
        } else if (responseMessage && responseMessage.msg === 'Logged in!') {
          navigate('/');
        } else {
          setOpenSnackbar(true);
        }
      }
    } catch (e) {
      if (isMounted.current) setOpenSnackbar(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return (
    <div className="auth-wrapper">
      <div className="auth-card card-bg">
        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-logo">
            <div className="freenet-logo-placeholder">F</div>
            <div className="auth-title">FREENET</div>
          </div>

          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <input name="email" type="text" required autoComplete="email" autoFocus className="form-input" placeholder="Email or Username" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                name="password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Password"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <div className="form-group">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Signing in...' : 'Login'}</button>
          </div>

          <div className="muted-link" style={{textAlign: 'center'}}>
            <div><a href="/forgot-password">Forgot Password?</a></div>
            <div style={{marginTop:'6px'}}>Don't have an account? <a href="/register">Sign Up</a></div>
          </div>

          {openSnackbar && (
            <div className="error-note">{error || 'Ha ocurrido un error al iniciar sesión.'}</div>
          )}
        </form>
      </div>
    </div>
  );
}