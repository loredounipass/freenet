import React from 'react';
import { useNavigate } from 'react-router-dom';
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
    return '?';
}

/**
 * Caja "¿Qué estás pensando?" para crear publicaciones. Redirige al feed o abre composición según la app.
 */
export default function ProfilePostBox({ profile, onCompose }) {
    const navigate = useNavigate();
    const photoUrl = resolveImageUrl(profile?.profilePhotoUrl);
    const firstName = profile?.firstName;
    const lastName = profile?.lastName;

    const handleClick = () => {
        if (onCompose) {
            onCompose();
        } else {
            navigate('/feed');
        }
    };

    return (
        <div className="profile-postbox">
            <div className="profile-postbox-inner flex items-center gap-3 p-4">
                <div
                    className="profile-postbox-avatar"
                    style={{
                        backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
                        backgroundColor: 'var(--fn-dark-card)',
                    }}
                >
                    {!photoUrl && (
                        <span style={{ color: 'var(--fn-text)', fontWeight: 700 }}>
                            {initials(firstName, lastName)}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleClick}
                    className="profile-postbox-input flex-1 text-left"
                    style={{
                        backgroundColor: 'var(--fn-dark-card)',
                        color: 'var(--fn-muted)',
                        border: '1px solid var(--fn-border)',
                    }}
                >
                    ¿Qué estás pensando?
                </button>
            </div>
            <div className="profile-postbox-actions flex justify-around border-t border-solid p-2" style={{ borderColor: 'var(--fn-border)' }}>
                <button type="button" className="profile-postbox-action" aria-label="Video en vivo">
                    <span className="profile-postbox-action-icon text-red-500">●</span>
                    Video en vivo
                </button>
                <button type="button" className="profile-postbox-action" aria-label="Foto o video">
                    <span className="profile-postbox-action-icon text-green-500">●</span>
                    Foto o video
                </button>
                <button type="button" className="profile-postbox-action" aria-label="Reel">
                    <span className="profile-postbox-action-icon text-red-500">●</span>
                    Reel
                </button>
            </div>
        </div>
    );
}
