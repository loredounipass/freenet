import React, { useEffect, useState, useContext, useCallback } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import useAuth from '../../hooks/useAuth';
import { AuthContext } from '../../hooks/AuthContext';
import * as profileService from '../../services/profile';

/* ── constants ── */
const GENDER_OPTIONS = [
    { value: '', label: 'Seleccionar...' },
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Femenino', label: 'Femenino' },
    { value: 'No binario', label: 'No binario' },
    { value: 'Prefiero no decir', label: 'Prefiero no decir' },
    { value: 'Otro', label: 'Otro' },
];

const RELATIONSHIP_OPTIONS = [
    { value: '', label: 'Seleccionar...' },
    { value: 'Soltero/a', label: 'Soltero/a' },
    { value: 'En una relación', label: 'En una relación' },
    { value: 'Comprometido/a', label: 'Comprometido/a' },
    { value: 'Casado/a', label: 'Casado/a' },
    { value: 'Es complicado', label: 'Es complicado' },
    { value: 'Prefiero no decir', label: 'Prefiero no decir' },
];

/* ── reusable sub-components ── */
function InputField({ id, label, value, onChange, type = 'text', required = false, placeholder = '' }) {
    return (
        <div className="settings-input-group">
            <label htmlFor={id} className="settings-label">
                {label}{required && <span className="settings-required-asterisk"> *</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                className="settings-input"
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
}

function SelectField({ id, label, value, onChange, options }) {
    return (
        <div className="settings-input-group">
            <label htmlFor={id} className="settings-label">{label}</label>
            <select id={id} value={value} onChange={onChange} className="settings-input settings-select">
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function TextareaField({ id, label, value, onChange, placeholder = '', maxLength }) {
    return (
        <div className="settings-input-group">
            <label htmlFor={id} className="settings-label">
                {label}
                {maxLength && (
                    <span style={{ float: 'right', fontSize: '0.75rem', color: 'var(--fn-muted)' }}>
                        {value.length}/{maxLength}
                    </span>
                )}
            </label>
            <textarea
                id={id}
                value={value}
                onChange={onChange}
                className="settings-input settings-textarea"
                placeholder={placeholder}
                maxLength={maxLength}
                rows={3}
            />
        </div>
    );
}

/* ── main ── */
function UserProfileComponent() {
    const { updateUserProfile, error: authError, successMessage: authSuccess } = useAuth();
    const { auth } = useContext(AuthContext);

    // Account
    const [firstName, setFirstName]   = useState('');
    const [lastName, setLastName]     = useState('');
    const [email, setEmail]           = useState('');

    // Profile
    const [bio, setBio]                           = useState('');
    const [gender, setGender]                     = useState('');
    const [relationshipStatus, setRelationshipStatus] = useState('');
    const [interestInput, setInterestInput]       = useState('');
    const [interests, setInterests]               = useState([]);
    const [links, setLinks]                       = useState([]);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg]         = useState('');
    const [successMsg, setSuccessMsg]     = useState('');
    const [initialized, setInitialized]   = useState(false);

    // Cooldown guard
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    let remainingMinutes = 0;
    if (auth?.lastProfileUpdate) {
        const elapsed = Date.now() - auth.lastProfileUpdate;
        if (elapsed < TEN_MINUTES_MS) {
            remainingMinutes = Math.ceil((TEN_MINUTES_MS - elapsed) / 60_000);
        }
    }

    // Init everything from auth + API once
    useEffect(() => {
        if (initialized) return;
        setFirstName(auth?.firstName || '');
        setLastName(auth?.lastName || '');
        setEmail(auth?.email || '');

        profileService.getMyProfile()
            .then((res) => {
                const d = res?.data ?? res;
                if (!d) return;
                setBio(d.bio || '');
                setGender(d.gender || '');
                setRelationshipStatus(d.relationshipStatus || '');
                setInterests(Array.isArray(d.interests) ? d.interests : []);
                setLinks(Array.isArray(d.links) ? d.links : []);
            })
            .catch(() => {})
            .finally(() => setInitialized(true));
    }, [initialized, auth]);

    // Sync auth hook messages
    useEffect(() => {
        if (authSuccess) setSuccessMsg(authSuccess);
        if (authError)   setErrorMsg(authError);
    }, [authSuccess, authError]);

    /* ── single save handler ── */
    const handleSave = async () => {
        setErrorMsg('');
        setSuccessMsg('');

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setErrorMsg('Nombre, apellido y correo son obligatorios.');
            return;
        }
        const invalidLink = links.find((l) => !l.url?.trim());
        if (invalidLink) {
            setErrorMsg('Cada enlace debe tener una URL válida.');
            return;
        }

        try {
            setIsSubmitting(true);

            // 1) Account update (only if something changed)
            const accountChanged =
                firstName !== (auth?.firstName || '') ||
                lastName  !== (auth?.lastName  || '') ||
                email     !== (auth?.email     || '');

            if (accountChanged) {
                await updateUserProfile({ firstName, lastName, email });
            }

            // 2) Profile upsert (always — cheap PATCH)
            await profileService.upsertProfile({
                firstName: firstName.trim(),
                lastName:  lastName.trim(),
                bio:       bio.trim() || undefined,
                gender:    gender    || undefined,
                relationshipStatus: relationshipStatus || undefined,
                interests: interests.filter(Boolean),
                links: links
                    .filter((l) => l.url?.trim())
                    .map((l) => ({ label: l.label?.trim() || '', url: l.url.trim() })),
            });

            setSuccessMsg('¡Perfil actualizado correctamente!');
        } catch (e) {
            setErrorMsg(e?.response?.data?.message || 'Error al guardar los cambios.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── interests ── */
    const addInterest = useCallback(() => {
        const val = interestInput.trim();
        if (!val || interests.includes(val)) { setInterestInput(''); return; }
        setInterests((p) => [...p, val]);
        setInterestInput('');
    }, [interestInput, interests]);

    const removeInterest = (idx) => setInterests((p) => p.filter((_, i) => i !== idx));

    const handleInterestKey = (e) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addInterest(); }
    };

    /* ── links ── */
    const addLink    = () => setLinks((p) => [...p, { label: '', url: '' }]);
    const removeLink = (idx) => setLinks((p) => p.filter((_, i) => i !== idx));
    const updateLink = (idx, field, val) =>
        setLinks((p) => p.map((l, i) => i === idx ? { ...l, [field]: val } : l));

    /* ── render ── */
    return (
        <div className="settings-section-wrapper">
            <div className="settings-form-card">

                {/* Header */}
                <div className="settings-section-header">
                    <div className="settings-large-icon">
                        <PersonIcon className="settings-large-icon-inner" />
                    </div>
                    <h2 className="settings-title">Perfil de Usuario</h2>
                </div>

                <form
                    noValidate
                    autoComplete="off"
                    className="settings-form"
                    onSubmit={(e) => e.preventDefault()}
                >
                    {/* ── Nombre + Apellido ── */}
                    <div className="upc-grid-2">
                        <InputField
                            id="upc-firstName"
                            label="Primer Nombre"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            placeholder="Tu nombre"
                        />
                        <InputField
                            id="upc-lastName"
                            label="Apellido"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            placeholder="Tu apellido"
                        />
                    </div>

                    {/* ── Email ── */}
                    <InputField
                        id="upc-email"
                        label="Correo Electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="tu@correo.com"
                    />

                    {/* ── Divider ── */}
                    <div className="upc-divider" />

                    {/* ── Bio ── */}
                    <TextareaField
                        id="upc-bio"
                        label="Biografía"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Cuéntanos algo sobre ti..."
                        maxLength={200}
                    />

                    {/* ── Género + Estado sentimental ── */}
                    <div className="upc-grid-2">
                        <SelectField
                            id="upc-gender"
                            label="Género"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            options={GENDER_OPTIONS}
                        />
                        <SelectField
                            id="upc-relationship"
                            label="Estado sentimental"
                            value={relationshipStatus}
                            onChange={(e) => setRelationshipStatus(e.target.value)}
                            options={RELATIONSHIP_OPTIONS}
                        />
                    </div>

                    {/* ── Intereses ── */}
                    <div className="settings-input-group">
                        <label className="settings-label">Intereses</label>
                        <div className="upc-tags-input-wrap">
                            {interests.map((tag, idx) => (
                                <span key={idx} className="upc-tag">
                                    {tag}
                                    <button
                                        type="button"
                                        className="upc-tag-remove"
                                        onClick={() => removeInterest(idx)}
                                        aria-label={`Quitar ${tag}`}
                                    >×</button>
                                </span>
                            ))}
                            <input
                                id="upc-interest-input"
                                type="text"
                                className="upc-tag-input"
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                onKeyDown={handleInterestKey}
                                placeholder={interests.length === 0 ? 'Escribe un interés y presiona Enter...' : 'Agregar más...'}
                            />
                        </div>
                        <span className="upc-field-hint">Presiona Enter o coma para agregar cada interés.</span>
                    </div>

                    {/* ── Enlaces ── */}
                    <div className="settings-input-group">
                        <label className="settings-label">
                            Enlaces
                            <button
                                type="button"
                                className="upc-add-link-btn"
                                onClick={addLink}
                                id="upc-add-link-btn"
                            >
                                + Agregar enlace
                            </button>
                        </label>

                        {links.length === 0 && (
                            <p className="upc-field-hint">Agrega links a tu web, redes sociales, etc.</p>
                        )}

                        <div className="upc-links-list">
                            {links.map((link, idx) => (
                                <div key={idx} className="upc-link-row">
                                    <input
                                        type="text"
                                        className="settings-input upc-link-label-input"
                                        placeholder="Etiqueta (ej. TikTok)"
                                        value={link.label}
                                        onChange={(e) => updateLink(idx, 'label', e.target.value)}
                                    />
                                    <input
                                        type="url"
                                        className="settings-input upc-link-url-input"
                                        placeholder="https://..."
                                        value={link.url}
                                        onChange={(e) => updateLink(idx, 'url', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="upc-remove-link-btn"
                                        onClick={() => removeLink(idx)}
                                        aria-label="Quitar enlace"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Single save button ── */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSubmitting || remainingMinutes > 0}
                        className="settings-btn settings-btn-primary"
                        id="upc-save-btn"
                    >
                        {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <span className="pinfo-spinner" />
                                Guardando...
                            </span>
                        ) : 'Guardar cambios'}
                    </button>

                    {remainingMinutes > 0 && (
                        <div className="settings-alert settings-alert-warning">
                            Espera {remainingMinutes} minuto(s) antes de volver a cambiar tu cuenta.
                        </div>
                    )}
                    {successMsg && <div className="settings-alert settings-alert-success">{successMsg}</div>}
                    {errorMsg   && <div className="settings-alert settings-alert-error">{errorMsg}</div>}
                </form>
            </div>
        </div>
    );
}

export default UserProfileComponent;
