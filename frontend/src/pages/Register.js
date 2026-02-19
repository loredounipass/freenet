import React from 'react';
import useAuth from './../hooks/useAuth';

export default function Register() {
  const { registerUser, error } = useAuth();

  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setOpenSnackbar(true);
      return;
    }

    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await registerUser(data);
    } catch (e) {
      setOpenSnackbar(true);
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
            <div className="freenet-logo-placeholder">F</div>
            <div className="auth-title">Join Freenet</div>
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
            <label className="form-label">Username</label>
            <input name="username" required className="form-input" placeholder="Username" />
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

          <div className="form-group">
            <button type="submit" className="btn-primary">Create Account</button>
          </div>

          <div className="muted-link" style={{textAlign:'center'}}>
            <a href="/login" className="signup-button">Already have an account? <span className="signup-cta">Log In</span></a>
          </div>

          {openSnackbar && (
            <div className="error-note">{error || 'Ha ocurrido un error al registrarse.'}</div>
          )}
        </form>
      </div>
    </div>
  );
}