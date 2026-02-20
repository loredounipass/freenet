import React, { useEffect, useState, useContext } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';

function UserProfileComponent() {
    const { updateUserProfile, error, successMessage } = useAuth();
    const { auth } = useContext(AuthContext);
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [localError, setLocalError] = useState('');
    const [localSuccessMessage, setLocalSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const TEN_MINUTES_MS = 10 * 60 * 1000;
    let remainingMinutes = 0;
    if (auth && auth.lastProfileUpdate) {
        const elapsed = Date.now() - auth.lastProfileUpdate;
        if (elapsed < TEN_MINUTES_MS) {
            remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / (60 * 1000));
        }
    }

    useEffect(() => {
        if (auth && !initialized) {
            setFirstName(auth.firstName || '');
            setLastName(auth.lastName || '');
            setEmail(auth.email || '');
            setInitialized(true);
        }
    }, [auth, initialized]);

    const handleUpdateProfile = async () => {
        setLocalError('');
        setLocalSuccessMessage('');

        if (!firstName || !lastName || !email) {
            setLocalError('Todos los campos son obligatorios.');
            return;
        }

        const firstNameChanged = firstName !== (auth.firstName || '');
        const lastNameChanged = lastName !== (auth.lastName || '');
        const emailChanged = email !== (auth.email || '');

        if (!firstNameChanged && !lastNameChanged && !emailChanged) {
            setLocalError('Debes proporcionar valores diferentes a los actuales');
            return;
        }

        const body = { firstName, lastName, email };
        try {
            setIsSubmitting(true);
            await updateUserProfile(body);
            // After successful update, re-sync initialized state if needed, 
            // but auth update usually triggers context update.
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (successMessage) {
            setLocalSuccessMessage(successMessage);
        }
        if (error) {
            setLocalError(error);
        }
    }, [successMessage, error]);

    const InputField = ({ label, value, onChange, type = "text", required = false }) => (
        <div className="settings-input-group">
            <label className="settings-label">
                {label} {required && <span className="settings-required-asterisk">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="settings-input"
                required={required}
            />
        </div>
    );

    return (
        <div className="settings-section-wrapper">
            <div className="settings-form-card">
                <div className="settings-section-header">
                    <div className="settings-large-icon">
                        <PersonIcon className="settings-large-icon-inner" />
                    </div>
                    <h2 className="settings-title">
                        Perfil de Usuario
                    </h2>
                </div>

                <form 
                    noValidate 
                    autoComplete="off" 
                    className="settings-form"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <InputField
                        label="Primer Nombre"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                    <InputField
                        label="Apellido"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                    <InputField
                        label="Correo Electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button
                        onClick={handleUpdateProfile}
                        disabled={isSubmitting || remainingMinutes > 0}
                        className="settings-btn settings-btn-primary"
                    >
                        {isSubmitting ? 'Guardando...' : 'Actualizar Perfil'}
                    </button>

                    {remainingMinutes > 0 && (
                        <div className="settings-alert settings-alert-warning">
                            No puedes actualizar tu perfil por otros {remainingMinutes} minuto(s).
                        </div>
                    )}
                    {localSuccessMessage && (
                        <div className="settings-alert settings-alert-success">
                            {localSuccessMessage}
                        </div>
                    )}
                    {localError && (
                        <div className="settings-alert settings-alert-error">
                            {localError}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default UserProfileComponent;
