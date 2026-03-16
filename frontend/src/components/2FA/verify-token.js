import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const VerifyToken = () => {
    const [formValues, setFormValues] = useState({ token: '' });
    const { verifyToken, setError: clearAuthError } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;

    useEffect(() => {
        return () => {
            clearAuthError();
        };
    }, [clearAuthError]);

    const handleChange = (e) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
        if (error) setError(null);
        if (success) setSuccess(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!email) {
            setError('No se encontró el correo electrónico. Por favor, inicia sesión nuevamente.');
            return;
        }

        if (!formValues.token || formValues.token.trim().length === 0) {
            setError('Por favor, ingresa el código de verificación.');
            return;
        }

        if (formValues.token.length < 6) {
            setError('El código debe tener al menos 6 dígitos.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await verifyToken({ email, token: formValues.token });
            
            if (result?.ok && result?.msg === 'Logged in!') {
                setSuccess('¡Verificación exitosa! Redirigiendo...');
                setTimeout(() => navigate('/'), 1500);
            } else if (result?.error) {
                setError(result.error);
            }
        } catch (err) {
            setError('Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        navigate('/resendtoken', { state: { email } });
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card card-bg">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="auth-logo">
                        <img src="/logo192.png" alt="Freeus" className="auth-logo-img" />
                        <div className="auth-title">Freeus</div>
                    </div>

                    <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#fff' }}>
                        Por favor, ingresa el token que recibiste en el correo electrónico
                    </p>

                    <div className="form-group">
                        <label className="form-label">Token</label>
                        <input
                            name="token"
                            id="token"
                            autoFocus
                            required
                            className="form-input"
                            value={formValues.token}
                            onChange={handleChange}
                            placeholder="Token"
                        />
                    </div>

                    <div className="form-group">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Verificando...' : 'Verificar'}
                        </button>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div onClick={handleResend} style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#66d0e0', fontWeight: 600, cursor: 'pointer' }}>
                            Reenviar Token
                        </div>
                    </div>

                    {error && <div className="error-note">{error}</div>}
                    {success && <div style={{ color: '#7fffd4', textAlign: 'center', marginTop: '0.5rem', fontWeight: 500 }}>{success}</div>}
                </form>
            </div>
        </div>
    );
};

export default VerifyToken;
