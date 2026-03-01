import React from 'react';

const DEFAULT_TABS = [
    { id: 'all', label: 'Todo' },
    { id: 'about', label: 'Información' },
    { id: 'photos', label: 'Fotos' },
    { id: 'videos', label: 'Videos' },
    { id: 'more', label: 'Más' },
];

/**
 * Barra de pestañas del perfil (estilo Facebook). activeTab y onTabChange controlan el estado.
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
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}
