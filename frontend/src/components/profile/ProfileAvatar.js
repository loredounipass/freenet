import React, { useRef } from 'react';
import { apiOrigin } from '../../api/http';

function resolveImageUrl(url) {
    if (!url) return null;
    return url.startsWith('/') ? `${apiOrigin}${url}` : url;
}

function initials(firstName, lastName) {
    const f = (firstName || '').trim();
    const l = (lastName || '').trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    if (l) return l.slice(0, 2).toUpperCase();
    return '?';
}

/**
 * Avatar circular del perfil. Si canEdit, muestra ícono de cámara y permite subir foto.
 */
export default function ProfileAvatar({ profilePhotoUrl, firstName, lastName, onEditPhoto, canEdit, className = '' }) {
    const inputRef = useRef(null);
    const photoUrl = resolveImageUrl(profilePhotoUrl);

    const handleEditClick = () => {
        if (canEdit && inputRef.current) inputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target?.files?.[0];
        if (file && onEditPhoto) onEditPhoto(file);
        e.target.value = '';
    };

    return (
        <div className={`profile-avatar-wrap ${className}`}>
            <div
                className="profile-avatar"
                style={{
                    backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
                    backgroundColor: 'var(--fn-dark-card)',
                }}
            >
                {!photoUrl && (
                    <span className="profile-avatar-initials" style={{ color: 'var(--fn-text)' }}>
                        {initials(firstName, lastName)}
                    </span>
                )}
            </div>
            {canEdit && (
                <>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        aria-label="Subir foto de perfil"
                    />
                    <button
                        type="button"
                        onClick={handleEditClick}
                        className="profile-avatar-edit"
                        aria-label="Editar foto de perfil"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}
