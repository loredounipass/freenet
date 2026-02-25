import React from 'react'

const PROFILE_TOOLS = [
  {
    id: 'linked',
    label: 'Cuentas vinculadas',
    desc: 'Interactúa con tu comunidad a través de tu perfil.',
    available: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    id: 'recommendation',
    label: 'Recomendación de perfil',
    desc: 'Descubre si tu perfil es elegible para ser recomendado.',
    available: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
        <polyline points="12 15 14 17 18 13"/>
      </svg>
    ),
  },
  {
    id: 'education',
    label: 'Educación para creadores',
    desc: 'Recursos y orientación para tener éxito como creador.',
    available: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
]

export default function DashboardProfileStatus() {
  return (
    <aside className="db-profile-status">
      {/* Header */}
      <div className="db-ps-header">
        <div className="db-ps-avatar">FN</div>
        <div>
          <div className="db-ps-name">Tu perfil</div>
          <div className="db-ps-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Activo
          </div>
        </div>
      </div>

      {/* Status OK */}
      <div className="db-ps-status-ok">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Tu perfil no tiene problemas.
      </div>

      {/* Tools */}
      <div className="db-ps-tools-title">Herramientas del perfil</div>
      <div className="db-ps-tools">
        {PROFILE_TOOLS.map((tool) => (
          <button key={tool.id} className="db-ps-tool-row">
            <div className="db-ps-tool-icon">{tool.icon}</div>
            <div className="db-ps-tool-info">
              <div className="db-ps-tool-label">{tool.label}</div>
              <div className="db-ps-tool-desc">{tool.desc}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>
    </aside>
  )
}
