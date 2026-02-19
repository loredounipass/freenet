import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const VerifyToken = () => {
    const [formValues, setFormValues] = useState({ token: '' });
    const { verifyToken, error } = useAuth();
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const navigate = useNavigate();
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleChange = (e) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const storedEmail = localStorage.getItem('email');
        if (!storedEmail) {
            setLocalError('No se encontró el correo electrónico. Por favor, asegúrate de que estés autenticado.');
            return;
        }

        setLoading(true);
        setTimeout(async () => {
            try {
                const response = await verifyToken({ email: storedEmail, ...formValues });
                if (isMounted.current && response?.msg === 'Logged in!') {
                    navigate('/');
                }
            } catch (err) {
            } finally {
                if (isMounted.current) setLoading(false);
            }
        }, 2000);
    };

    const handleResend = () => {
        navigate('/resendtoken');
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card card-bg">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="auth-logo">
                        <div className="freenet-logo-placeholder">F</div>
                        <div className="auth-title">FREENET</div>
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

                    {localError && <div className="error-note">{localError}</div>}
                    {error && <div className="error-note">{error}</div>}
                </form>
            </div>
        </div>
    );
};

export default VerifyToken;
