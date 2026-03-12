import { useMemo, useState, type ReactNode } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { IssuesPage } from './pages/IssuesPage'
import { ScanHistoryPage } from './pages/ScanHistoryPage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import './App.css'

type PageKey = 'dashboard' | 'projects' | 'issues' | 'history' | 'configuration'

const pageLabels: Record<PageKey, string> = {
  dashboard: 'Dashboard Overview',
  projects: 'Projects',
  issues: 'Issues',
  history: 'Scan History',
  configuration: 'Configuration',
}

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <span className="app-nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {children}
      </svg>
    </span>
  )
}

const navItems: Array<{ key: PageKey; label: string; icon: ReactNode }> = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <NavIcon>
        <rect x="4" y="4" width="7" height="7" rx="1.3" />
        <rect x="13" y="4" width="7" height="7" rx="1.3" />
        <rect x="4" y="13" width="7" height="7" rx="1.3" />
        <rect x="13" y="13" width="7" height="7" rx="1.3" />
      </NavIcon>
    ),
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: (
      <NavIcon>
        <path d="M3.5 7.5h6l2 2h9v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      </NavIcon>
    ),
  },
  {
    key: 'issues',
    label: 'Issues',
    icon: (
      <NavIcon>
        <path d="M12 4 21 19H3z" />
        <path d="M12 9v4M12 16h.01" />
      </NavIcon>
    ),
  },
  {
    key: 'history',
    label: 'Scan History',
    icon: (
      <NavIcon>
        <path d="M12 3a9 9 0 1 1-6.4 2.6" />
        <path d="M12 7v5l3 2" />
      </NavIcon>
    ),
  },
  {
    key: 'configuration',
    label: 'Configuration',
    icon: (
      <NavIcon>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M18.3 5.7l-1.6 1.6M7.3 16.7l-1.6 1.6" />
      </NavIcon>
    ),
  },
]

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')

  const pageContent = useMemo(() => {
    switch (activePage) {
      case 'projects':
        return <ProjectsPage />
      case 'issues':
        return <IssuesPage />
      case 'history':
        return <ScanHistoryPage />
      case 'configuration':
        return <ConfigurationPage />
      case 'dashboard':
      default:
        return <DashboardPage />
    }
  }, [activePage])

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <span className="app-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </span>
          <div>
            <h1>DocRot</h1>
            <p>Detector Admin</p>
          </div>
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              aria-current={activePage === item.key ? 'page' : undefined}
              className={activePage === item.key ? 'app-nav-link active' : 'app-nav-link'}
              onClick={() => setActivePage(item.key)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="user-row">
            <span className="avatar" aria-hidden="true" />
            <div>
              <p>Alex Chen</p>
              <small>Pro Plan</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-title-wrap">
            <h2>{pageLabels[activePage]}</h2>
            {activePage === 'configuration' ? <span className="editor-mode-pill">Editor Mode</span> : null}
          </div>
          <div className="app-topbar-tools">
            <div className="search-shell">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.2" />
                <path d="m16 16 4.2 4.2" />
              </svg>
              <input
                type="text"
                value={
                  activePage === 'projects'
                    ? 'Quick search...'
                    : activePage === 'configuration'
                      ? 'Search config...'
                      : 'Search documentation...'
                }
                readOnly
                aria-label={
                  activePage === 'projects'
                    ? 'Quick search'
                    : activePage === 'configuration'
                      ? 'Search configuration'
                      : 'Search documentation'
                }
              />
            </div>
            {activePage === 'projects' ? (
              <button type="button" className="create-project-btn">
                + Create New Project
              </button>
            ) : activePage === 'configuration' ? (
              <>
                <button type="button" className="notification-btn" aria-label="Notifications">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 9a6 6 0 1 1 12 0v4l1.6 2.2H4.4L6 13z" />
                    <path d="M10.5 18a1.5 1.5 0 0 0 3 0" />
                  </svg>
                </button>
                <button type="button" className="apply-changes-btn">
                  Apply Changes
                </button>
              </>
            ) : (
              <button type="button" className="notification-btn" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M15 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A6 6 0 0 1 10 4.6V4a2 2 0 0 1 4 0v.6" />
                  <path d="M14 12h6" />
                  <path d="M17 9v6" />
                </svg>
              </button>
            )}
          </div>
        </header>
        <section className="page-container">{pageContent}</section>
      </main>
    </div>
  )
}

export default App
