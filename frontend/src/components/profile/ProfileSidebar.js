import React from 'react';

/** Tarjeta genérica del sidebar con título y contenido. */
function SidebarCard({ title, children, onEdit, canEdit }) {
    return (
        <div className="profile-sidebar-card">
            <div className="profile-sidebar-card-header flex justify-between items-center">
                <h3 className="profile-sidebar-card-title" style={{ color: 'var(--fn-text)' }}>
                    {title}
                </h3>
                {canEdit && onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="profile-sidebar-edit-icon"
                        aria-label={`Editar ${title}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="profile-sidebar-card-body" style={{ color: 'var(--fn-muted)' }}>
                {children}
            </div>
        </div>
    );
}

/**
 * Columna izquierda del perfil: detalles personales, enlaces, información de contacto según datos del perfil.
 */
export default function ProfileSidebar({
    profile,
    isOwnProfile,
    onEditDetails,
}) {
    const links = profile?.links || [];
    const gender = profile?.gender;
    const relationshipStatus = profile?.relationshipStatus;
    const interests = profile?.interests || [];
    const bio = profile?.bio;

    const hasPersonalDetails = gender || relationshipStatus || bio;
    const hasLinks = links.length > 0;
    const hasInterests = interests.length > 0;

    return (
        <aside className="profile-sidebar">
            {hasPersonalDetails && (
                <SidebarCard title="Detalles personales" canEdit={isOwnProfile} onEdit={onEditDetails}>
                    <ul className="profile-sidebar-list space-y-2">
                        {gender && (
                            <li className="flex items-center gap-2">
                                <span className="profile-sidebar-icon" aria-hidden>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    </svg>
                                </span>
                                {gender}
                            </li>
                        )}
                        {relationshipStatus && (
                            <li className="flex items-center gap-2">
                                <span className="profile-sidebar-icon" aria-hidden>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </span>
                                {relationshipStatus}
                            </li>
                        )}
                        {bio && (
                            <li className="flex items-start gap-2">
                                <span className="profile-sidebar-icon mt-0.5" aria-hidden>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </span>
                                <span>{bio}</span>
                            </li>
                        )}
                    </ul>
                </SidebarCard>
            )}

            {hasLinks && (
                <SidebarCard title="Enlaces" canEdit={isOwnProfile} onEdit={onEditDetails}>
                    <ul className="profile-sidebar-list space-y-2">
                        {links.map((link, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <span className="profile-sidebar-icon" aria-hidden>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                </span>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="profile-sidebar-link"
                                    style={{ color: 'var(--fn-teal)' }}
                                >
                                    {link.label || link.url}
                                </a>
                            </li>
                        ))}
                    </ul>
                </SidebarCard>
            )}

            {hasInterests && (
                <SidebarCard title="Intereses" canEdit={isOwnProfile} onEdit={onEditDetails}>
                    <div className="flex flex-wrap gap-2">
                        {interests.map((interest, i) => (
                            <span
                                key={i}
                                className="profile-sidebar-tag"
                                style={{
                                    backgroundColor: 'var(--fn-dark-card)',
                                    color: 'var(--fn-text)',
                                    borderColor: 'var(--fn-border)',
                                }}
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </SidebarCard>
            )}

            {!hasPersonalDetails && !hasLinks && !hasInterests && (
                <SidebarCard title="Información" canEdit={isOwnProfile} onEdit={onEditDetails}>
                    <p className="text-sm">Aún no hay información. {isOwnProfile ? 'Edita tu perfil para añadirla.' : ''}</p>
                </SidebarCard>
            )}
        </aside>
    );
}
