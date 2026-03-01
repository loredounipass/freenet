import React from 'react';

/**
 * Bloque de información principal: nombre, seguidores/siguiendo, bio/ocupación y botones de acción (Dashboard, Editar o Seguir/Siguiendo).
 */
export default function ProfileInfo({
    firstName,
    lastName,
    followersCount = 0,
    followingCount = 0,
    bio,
    isOwnProfile,
    isFollowing,
    onDashboard,
    onEditProfile,
    onFollow,
    onUnfollow,
    followLoading,
}) {
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Usuario';
    const countStr = [followersCount, 'seguidores', followingCount, 'siguiendo'].join(' ');

    return (
        <div className="profile-info">
            <h1 className="profile-name" style={{ color: 'var(--fn-text)' }}>
                {displayName}
            </h1>
            <p className="profile-counts" style={{ color: 'var(--fn-muted)' }}>
                {countStr}
            </p>
            {bio && (
                <p className="profile-bio" style={{ color: 'var(--fn-text)' }}>
                    {bio}
                </p>
            )}
            {isOwnProfile && (
                <div className="profile-actions flex flex-wrap gap-3 mt-4">
                    {onDashboard && (
                        <button
                            type="button"
                            onClick={onDashboard}
                            className="profile-btn-primary"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Dashboard
                        </button>
                    )}
                    {onEditProfile && (
                        <button
                            type="button"
                            onClick={onEditProfile}
                            className="profile-btn-secondary"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Editar
                        </button>
                    )}
                </div>
            )}
            {!isOwnProfile && (onFollow || onUnfollow) && (
                <div className="profile-actions flex flex-wrap gap-3 mt-4">
                    {isFollowing ? (
                        <button
                            type="button"
                            onClick={onUnfollow}
                            disabled={followLoading}
                            className="profile-btn-secondary"
                            aria-label="Dejar de seguir"
                        >
                            Siguiendo
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onFollow}
                            disabled={followLoading}
                            className="profile-btn-primary"
                            aria-label="Seguir"
                        >
                            Seguir
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
