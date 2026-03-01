import React from 'react';
import useAuth from './../hooks/useAuth';

export default function Register() {
  const { registerUser } = useAuth();

  const [errorMsg, setErrorMsg]               = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setErrorMsg('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await registerUser(data);
      if (result && !result.ok) {
        setErrorMsg(result.error || 'Error al registrarse.');
      }
    } catch (e) {
      setErrorMsg(e?.message || 'Error al registrarse.');
    }
  };

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="auth-wrapper">
      <div className="auth-card card-bg">
        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-logo">
            <img src="/logo192.png" alt="Freeus" className="auth-logo-img" />
            <div className="auth-title">Join Freeus</div>
          </div>

          <div className="form-group">
            <label className="form-label">First Name</label>
            <input name="firstName" required className="form-input" placeholder="First Name" />
          </div>

          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input name="lastName" required className="form-input" placeholder="Last Name" />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input name="email" type="email" required className="form-input" placeholder="Email Address" />
          </div>

          

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-wrapper">
              <input name="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="Password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="password-wrapper">
              <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" placeholder="Confirm Password" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle confirm-toggle">{showConfirmPassword ? 'Hide' : 'Show'}</button>
            </div>
            {password !== confirmPassword && <div className="error-note">Las contraseñas no coinciden</div>}
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className="error-note" role="alert" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 0.9rem', borderRadius: '10px',
              background: 'rgba(255,80,80,0.08)',
              border: '1px solid rgba(255,80,80,0.20)',
              color: '#ff9b9b', fontSize: '0.875rem',
              marginBottom: '0.25rem',
              animation: 'fn-shake 0.35s ease',
            }}>
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          <div className="form-group">
            <button type="submit" className="btn-primary">Create Account</button>
          </div>

          <div className="muted-link" style={{textAlign:'center'}}>
            <a href="/login" className="signup-button">Already have an account? <span className="signup-cta">Log In</span></a>
          </div>


        </form>
      </div>
    </div>
  );
}