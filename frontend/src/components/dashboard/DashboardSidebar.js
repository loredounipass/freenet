import React, { useState } from 'react'

const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Inicio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    hasChildren: false,
  },
  {
    id: 'insights',
    label: 'Estadísticas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    hasChildren: true,
  },
  {
    id: 'content',
    label: 'Contenido',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    hasChildren: true,
  },
  {
    id: 'monetization',
    label: 'Monetización',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    hasChildren: true,
  },
  {
    id: 'engagement',
    label: 'Interacción',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    hasChildren: true,
  },
  {
    id: 'tools',
    label: 'Todas las herramientas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M2 12h2M20 12h2"/>
      </svg>
    ),
    hasChildren: false,
  },
]

export default function DashboardSidebar({ activeSection, onNavigate }) {
  const [expanded, setExpanded] = useState({})

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="db-sidebar">
      {/* Brand */}
      <div className="db-sidebar-brand">
        <div className="db-sidebar-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div>
          <div className="db-sidebar-brand-title">Panel profesional</div>
          <div className="db-sidebar-brand-sub">freenet</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="db-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id
          return (
            <div key={item.id}>
              <button
                className={`db-sidebar-item${isActive ? ' db-sidebar-item-active' : ''}`}
                onClick={() => {
                  onNavigate(item.id)
                  if (item.hasChildren) toggle(item.id)
                }}
              >
                <span className={`db-sidebar-item-icon${isActive ? ' db-sidebar-item-icon-active' : ''}`}>
                  {item.icon}
                </span>
                <span className="db-sidebar-item-label">{item.label}</span>
                {item.hasChildren && (
                  <svg
                    className={`db-sidebar-chevron${expanded[item.id] ? ' db-sidebar-chevron-open' : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </button>
            </div>
          )
        })}
      </nav>

      {/* Create post CTA */}
      <div className="db-sidebar-footer">
        <button className="db-sidebar-create-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Crear publicación
        </button>
      </div>
    </aside>
  )
}
