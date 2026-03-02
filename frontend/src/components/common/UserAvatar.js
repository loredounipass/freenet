import React from 'react';
import { apiOrigin } from '../../api/http';

/**
 * Resolves a possibly-relative URL to an absolute one.
 */
function resolveUrl(url) {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return `${apiOrigin}${url}`;
    return url;
}

/**
 * Generates a deterministic accent color from a string (userId or name).
 * Returns a CSS color string. Always the same color for the same input.
 */
export function avatarColor(seed = '') {
    // A curated palette of vibrant but harmonious hues
    const palette = [
        '#22c1c3', // teal
        '#F6851B', // orange
        '#7c3aed', // violet
        '#0ea5e9', // sky
        '#10b981', // emerald
        '#f43f5e', // rose
        '#f59e0b', // amber
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#ec4899', // pink
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
}

/**
 * Shared avatar component used across the entire app.
 *
 * Props:
 *  - user: { _id, firstName, lastName, profilePhotoUrl } — any user object
 *  - size: number (px) — default 40
 *  - style: extra style overrides
 *  - className: extra class names
 *  - onClick: click handler
 *  - title: tooltip
 */
export default function UserAvatar({ user, size = 40, style = {}, className = '', onClick, title }) {
    const photoUrl = resolveUrl(user?.profilePhotoUrl);
    const firstLetter = (user?.firstName || user?.name || '?')[0]?.toUpperCase() ?? '?';
    const color = avatarColor(String(user?._id || user?.firstName || ''));

    const base = {
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: Math.round(size * 0.38),
        flexShrink: 0,
        userSelect: 'none',
        backgroundColor: photoUrl ? 'transparent' : color,
        color: '#fff',
        cursor: onClick ? 'pointer' : 'default',
        border: 'none',
        padding: 0,
        ...style,
    };

    if (onClick) {
        return (
            <button type="button" style={base} className={`user-avatar ${className}`} onClick={onClick} title={title} aria-label={title || 'Avatar'}>
                {photoUrl
                    ? <img src={photoUrl} alt={firstLetter} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : firstLetter}
            </button>
        );
    }

    return (
        <div style={base} className={`user-avatar ${className}`} title={title} aria-label={title || 'Avatar'}>
            {photoUrl
                ? <img src={photoUrl} alt={firstLetter} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : firstLetter}
        </div>
    );
}
