import React from 'react'

const MONETIZATION_CARDS = [
  {
    id: 'earnings',
    label: 'Ganancias aproximadas',
    value: '$0.00',
    sub: 'USD este mes',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
  },
  {
    id: 'ads',
    label: 'Anuncios asociados',
    value: '0',
    sub: 'Campañas activas',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    color: 'var(--fn-blue)',
    bg: 'rgba(30,144,255,0.1)',
  },
]

const PROGRAMS = [
  {
    id: 'stars',
    label: 'Stars',
    desc: 'Permite que tus seguidores te apoyen enviándote estrellas y regalos.',
    status: 'Disponible para configurar',
    statusOk: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    iconColor: '#f59e0b',
  },
  {
    id: 'subs',
    label: 'Suscripciones',
    desc: 'Ofrece contenido exclusivo a tus seguidores a cambio de una cuota mensual.',
    status: 'Próximamente',
    statusOk: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    iconColor: 'var(--fn-teal)',
  },
]

export default function DashboardMonetization() {
  return (
    <section className="db-section">
      <div className="db-section-header">
        <div>
          <h2 className="db-section-title">Monetización</h2>
          <p className="db-section-sub">Descubre programas para generar ingresos</p>
        </div>
        <button className="db-link-btn">Ver todo →</button>
      </div>

      {/* Revenue cards */}
      <div className="db-mono-cards">
        {MONETIZATION_CARDS.map((c) => (
          <div key={c.id} className="db-mono-card">
            <div className="db-mono-icon" style={{ color: c.color, background: c.bg }}>
              {c.icon}
            </div>
            <div className="db-mono-value" style={{ color: c.color }}>{c.value}</div>
            <div className="db-mono-label">{c.label}</div>
            <div className="db-mono-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Programs */}
      <div className="db-programs-list">
        {PROGRAMS.map((p) => (
          <div key={p.id} className="db-program-row">
            <div className="db-program-icon" style={{ color: p.iconColor, background: `${p.iconColor}18` }}>
              {p.icon}
            </div>
            <div className="db-program-info">
              <div className="db-program-name">{p.label}</div>
              <div className="db-program-desc">{p.desc}</div>
              <span className={`db-program-status${p.statusOk ? ' db-program-status-ok' : ' db-program-status-soon'}`}>
                {p.status}
              </span>
            </div>
            <button className="db-program-btn">
              {p.statusOk ? 'Configurar' : 'Notificarme'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
