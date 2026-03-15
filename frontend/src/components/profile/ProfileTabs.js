import React from 'react';

/* ── Tab icon SVGs ── */
const IconAll = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

const IconInfo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="8.01" strokeWidth="2.5" />
        <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
);

const IconPhotos = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

const IconVideos = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const IconMore = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="5" cy="12" r="1.2" fill="currentColor" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
        <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    </svg>
);

const TAB_ICONS = {
    all: <IconAll />,
    about: <IconInfo />,
    photos: <IconPhotos />,
    videos: <IconVideos />,
    more: <IconMore />,
};

const DEFAULT_TABS = [
    { id: 'all', label: 'Todo', showLabel: true },
    { id: 'about', label: 'Información', showLabel: true },
    { id: 'photos', label: 'Fotos' },
    { id: 'videos', label: 'Videos' },
    { id: 'more', label: 'Más', showLabel: true },
];

/**
 * Barra de pestañas del perfil. Muestra icono + label en desktop, solo icono en móvil muy pequeño.
 */
export default function ProfileTabs({ tabs = DEFAULT_TABS, activeTab = 'all', onTabChange, className = '' }) {
    return (
        <nav className={`profile-tabs ${className}`} role="tablist">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`profile-tab ${activeTab === tab.id ? 'profile-tab-active' : ''}`}
                    onClick={() => onTabChange?.(tab.id)}
                >
                    <span className="profile-tab-icon">{TAB_ICONS[tab.id] || null}</span>
                    <span className={`profile-tab-label${tab.showLabel ? ' profile-tab-label--visible' : ''}`}>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}
