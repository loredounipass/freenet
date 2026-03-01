import React from 'react';

/**
 * Muestra información de contacto básica en la pestaña "Información" del perfil.
 * Props: firstName, lastName, email, phone, isOwnProfile
 */
export default function ProfileContactInfo({ firstName, lastName, email, phone, isOwnProfile, onEditProfile }) {
    return (
        <section className="profile-contact-info" style={{ color: 'var(--fn-text)' }}>
            <h2 style={{ marginBottom: 8 }}>Información de contacto</h2>
            {isOwnProfile && onEditProfile && (
                <div style={{ marginBottom: 12 }}>
                    <button
                        type="button"
                        onClick={onEditProfile}
                        className="profile-btn-secondary"
                    >
                        Editar
                    </button>
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                    <label style={{ color: 'var(--fn-muted)', fontSize: 12 }}>Primer nombre</label>
                    <div style={{ marginTop: 4 }}>{firstName || '—'}</div>
                </div>
                <div>
                    <label style={{ color: 'var(--fn-muted)', fontSize: 12 }}>Apellido</label>
                    <div style={{ marginTop: 4 }}>{lastName || '—'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--fn-muted)', fontSize: 12 }}>Correo electrónico</label>
                    <div style={{ marginTop: 4 }}>{email || (isOwnProfile ? 'No configurado' : 'No disponible')}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: 'var(--fn-muted)', fontSize: 12 }}>Número de teléfono</label>
                    <div style={{ marginTop: 4 }}>{phone || 'No configurado'}</div>
                </div>
            </div>
        </section>
    );
}
