import React, { useState } from 'react'
import DashboardSidebar      from './dashboard/DashboardSidebar'
import DashboardInsights     from './dashboard/DashboardInsights'
import DashboardContent      from './dashboard/DashboardContent'
import DashboardMonetization from './dashboard/DashboardMonetization'
import DashboardEngagement   from './dashboard/DashboardEngagement'
import DashboardWeeklyGoals  from './dashboard/DashboardWeeklyGoals'
import DashboardProfileStatus from './dashboard/DashboardProfileStatus'

/* Map a section id to the component to render in the main column */
function MainContent({ section }) {
  switch (section) {
    case 'insights':     return <DashboardInsights />
    case 'content':      return <DashboardContent />
    case 'monetization': return <DashboardMonetization />
    case 'engagement':   return <DashboardEngagement />
    case 'tools':
    case 'home':
    default:
      return (
        <>
          <DashboardInsights />
          <DashboardContent />
          <DashboardMonetization />
          <DashboardEngagement />
        </>
      )
  }
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('home')

  return (
    <div className="db-page">
      {/* Left sidebar */}
      <DashboardSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />

      {/* Main content area */}
      <main className="db-main">
        {/* Page heading */}
        <div className="db-page-header">
          <div>
            <h1 className="db-page-title">Panel profesional</h1>
            <p className="db-page-sub">
              Descubre cómo está funcionando tu perfil y gestiona tu contenido
            </p>
          </div>
          {/* Date range chip */}
          <div className="db-date-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Últimos 28 días
          </div>
        </div>

        {/* Two-column layout: main + right rail */}
        <div className="db-content-layout">
          <div className="db-content-col">
            <MainContent section={activeSection} />
          </div>
          <div className="db-right-rail">
            <DashboardProfileStatus />
            <DashboardWeeklyGoals />
          </div>
        </div>
      </main>
    </div>
  )
}
