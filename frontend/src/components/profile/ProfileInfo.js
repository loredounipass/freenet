import React, { useState } from 'react';

/* ── tiny icon helpers ── */
const IconMsg = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const IconShare = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);
const IconEdit = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const IconHeart = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--fn-teal)" stroke="none">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);
const IconGender = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    </svg>
);
const IconRelation = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
);
const IconLink = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
);

function fmtCount(n) {
    if (!n || n === 0) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
}

/**
 * Bloque de información TikTok-style: nombre, stats, bio, detalles y botones de acción.
 */
export default function ProfileInfo({
    firstName,
    lastName,
    followersCount = 0,
    followingCount = 0,
    likes = 0,
    bio,
    gender,
    relationshipStatus,
    interests = [],
    links = [],
    isOwnProfile,
    isFollowing,
    profileId,
    onEditProfile,
    onFollow,
    onUnfollow,
    followLoading,
    onMessage,
}) {
    const [copied, setCopied] = useState(false);
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Usuario';

    const handleShare = () => {
        const url = profileId
            ? `${window.location.origin}/profile/${profileId}`
            : window.location.href;
        navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            // fallback: show the URL briefly
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="pinfo-root">
            {/* Name */}
            <h1 className="pinfo-name">{displayName}</h1>

            {/* Stats row: followers · following · likes */}
            <div className="pinfo-stats-row">
                <span className="pinfo-stat">
                    <strong>{fmtCount(followersCount)}</strong>
                    <span className="pinfo-stat-label">Seguidores</span>
                </span>
                <span className="pinfo-stat-sep">·</span>
                <span className="pinfo-stat">
                    <strong>{fmtCount(followingCount)}</strong>
                    <span className="pinfo-stat-label">Siguiendo</span>
                </span>
                <span className="pinfo-stat-sep">·</span>
                <span className="pinfo-stat">
                    <span className="pinfo-stat-icon"><IconHeart /></span>
                    <strong>{fmtCount(likes)}</strong>
                    <span className="pinfo-stat-label">Me gusta</span>
                </span>
            </div>

            {/* Bio */}
            {bio && (
                <p className="pinfo-bio">{bio}</p>
            )}

            {/* Quick meta pills: gender, relationship status */}
            {(gender || relationshipStatus) && (
                <div className="pinfo-meta-row">
                    {gender && (
                        <span className="pinfo-meta-pill">
                            <IconGender />
                            {gender}
                        </span>
                    )}
                    {relationshipStatus && (
                        <span className="pinfo-meta-pill">
                            <IconRelation />
                            {relationshipStatus}
                        </span>
                    )}
                </div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
                <div className="pinfo-interests-row">
                    {interests.map((i, idx) => (
                        <span key={idx} className="pinfo-interest-tag">{i}</span>
                    ))}
                </div>
            )}

            {/* Links */}
            {links.length > 0 && (
                <div className="pinfo-links-row">
                    {links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pinfo-link"
                        >
                            <IconLink />
                            {link.label || link.url}
                        </a>
                    ))}
                </div>
            )}

            {/* ── Action buttons ── */}
            <div className="pinfo-actions">
                {isOwnProfile ? (
                    <>
                        {/* Own profile: Edit + Share */}
                        {onEditProfile && (
                            <button
                                type="button"
                                onClick={onEditProfile}
                                className="profile-btn-secondary pinfo-btn"
                                id="profile-edit-btn"
                            >
                                <IconEdit />
                                Editar perfil
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {/* Other user's profile: Follow/Unfollow + Message */}
                        {isFollowing ? (
                            <button
                                type="button"
                                onClick={onUnfollow}
                                disabled={followLoading}
                                className="profile-btn-secondary pinfo-btn"
                                id="profile-unfollow-btn"
                                aria-label="Dejar de seguir"
                            >
                                {followLoading ? <span className="pinfo-spinner" /> : 'Siguiendo'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onFollow}
                                disabled={followLoading}
                                className="profile-btn-primary pinfo-btn"
                                id="profile-follow-btn"
                                aria-label="Seguir"
                            >
                                {followLoading ? <span className="pinfo-spinner" /> : 'Seguir'}
                            </button>
                        )}
                        {onMessage && (
                            <button
                                type="button"
                                onClick={onMessage}
                                className="profile-btn-secondary pinfo-btn"
                                id="profile-message-btn"
                                aria-label="Enviar mensaje"
                            >
                                <IconMsg />
                                Mensaje
                            </button>
                        )}
                    </>
                )}
                {/* Share button — visible for EVERY profile (own and others) */}
                <button
                    type="button"
                    onClick={handleShare}
                    className="profile-btn-secondary pinfo-btn"
                    id="profile-share-btn"
                    title="Copiar enlace del perfil"
                >
                    <IconShare />
                    {copied ? '¡Copiado!' : 'Compartir'}
                </button>
            </div>
        </div>
    );
}
