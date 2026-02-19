import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth'; 
import { useNavigate } from 'react-router-dom';

const ResendTokenForm = () => {
    const { resendToken, error, successMessage } = useAuth();
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (successMessage === 'Código de verificación reenviado a tu correo electrónico.') {
            navigate('/verifytoken');
        }
    }, [successMessage, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await resendToken({ email });
        } catch (err) {
            console.error(err);
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

                    <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#fff' }}>
                        Ingresa tu correo electrónico para reenviar el código de verificación
                    </p>

                    <div className="form-group">
                        <label className="form-label">Correo electrónico</label>
                        <input
                            name="email"
                            id="email"
                            type="email"
                            autoFocus
                            required
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Correo electrónico"
                        />
                    </div>

                    <div className="form-group">
                        <button type="submit" className="btn-primary">Reenviar Código</button>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        {error && <div className="error-note">{error}</div>}
                        {successMessage && <div className="error-note" style={{ color: '#7fffd4' }}>{successMessage}</div>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResendTokenForm;
