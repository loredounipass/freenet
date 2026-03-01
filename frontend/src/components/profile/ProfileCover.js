import React, { useRef } from 'react';
import { apiOrigin } from '../../api/http';

/** Resuelve URL de imagen: si es path relativo, le antepone el origin del API. */
function resolveImageUrl(url) {
    if (!url) return null;
    return url.startsWith('/') ? `${apiOrigin}${url}` : url;
}

/**
 * Portada del perfil (cover). Muestra imagen o placeholder; si es perfil propio, botón "Editar portada".
 */
export default function ProfileCover({ coverPhotoUrl, onEditCover, canEdit, className = '' }) {
    const inputRef = useRef(null);
    const coverUrl = resolveImageUrl(coverPhotoUrl);

    const handleEditClick = () => {
        if (canEdit && inputRef.current) inputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target?.files?.[0];
        if (file && onEditCover) onEditCover(file);
        e.target.value = '';
    };

    return (
        <div
            className={`profile-cover ${className}`}
            style={{
                backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                backgroundColor: 'var(--fn-dark-card)',
            }}
        >
            {canEdit && (
                <>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        aria-label="Subir foto de portada"
                    />
                    <button
                        type="button"
                        onClick={handleEditClick}
                        className="profile-cover-edit"
                        aria-label="Editar foto de portada"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        Editar portada
                    </button>
                </>
            )}
        </div>
    );
}
